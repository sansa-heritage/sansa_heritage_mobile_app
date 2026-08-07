import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const deleteAddress = async addressId => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');

    const response = await fetch(
      `${config.baseURL}api/auth/addresses/${addressId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Address deleted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};


export const updateProfile = async data => {
  const storedToken = await AsyncStorage.getItem('authToken');
  return await fetch(`${config.baseURL}api/auth/update-profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${storedToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export const getAddresses = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');

    const response = await fetch(`${config.baseURL}api/auth/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch addresses');
    }

    const data = await response.json();
    return data.addresses || [];
  } catch (error) {
    console.log('ADDRESS FETCH ERROR:', error);
    return [];
  }
};

export const getUserDetails = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${config.baseURL}api/auth/userById`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    });

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      throw data;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// ==================== RAZORPAY PAYMENT FUNCTIONS ====================

export const createRazorpayOrder = async (amount: number) => {
  try {
    const token = await AsyncStorage.getItem('authToken');

    console.log('🔐 Creating Razorpay order with amount:', amount);
    console.log('🔐 Token exists:', !!token);

    if (!token) {
      throw new Error('No auth token found. Please login again.');
    }

    const response = await fetch(
      `${config.baseURL}api/order/create-razorpay-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
        }),
      },
    );

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Order created:', data);

    return data;
  } catch (error: any) {
    console.error('❌ createRazorpayOrder error:', error.message);
    throw error;
  }
};

export const verifyRazorpayPayment = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  shippingAddress: any;
  totalPrice: number;
}) => {
  try {
    const token = await AsyncStorage.getItem('authToken');

    console.log('🔐 Verifying payment with data:', paymentData);

    if (!token) {
      throw new Error('No auth token found. Please login again.');
    }

    const response = await fetch(`${config.baseURL}api/order/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    console.log('📡 Verification response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Payment verified:', data);

    return data;
  } catch (error: any) {
    console.error('❌ verifyRazorpayPayment error:', error.message);
    throw error;
  }
};
