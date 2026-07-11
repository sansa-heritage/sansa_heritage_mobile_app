import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Toast } from '../screens/Toast';

// API helper functions
export const addToCart = async (productId: string, quantity: number) => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const storedUserId = await AsyncStorage.getItem('userID');

    const response = await fetch(`${config.baseURL}api/cart/add-to-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify({
        productId,
        quantity,
        userId: storedUserId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error adding item to cart: ${response.status}`);
    }

    const data = await response.json();
    console.log('Item added to cart:', data);
  } catch (err) {
    console.error('Failed to add item to cart:', err);
  }
};

export const removeFromCart = async (productId: string, quantity: number) => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const storedUserId = await AsyncStorage.getItem('userID');

    const response = await fetch(`${config.baseURL}api/cart/remove-from-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify({
        productId,
        quantity,
        userId: storedUserId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error removing item from cart: ${response.status}`);
    }

    const data = await response.json();
    console.log('Item removed from cart:', data);
  } catch (err) {
    console.error('Failed to remove item from cart:', err);
  }
};

export const addToFavoritesList = async productId => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');

    const response = await fetch(`${config.baseURL}api/add-favorite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`, // Ensure token is passed
      },
      body: JSON.stringify({ productId }),
    });

    const data = await response.json();
    console.log('Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add to favorites');
    }

    Toast.show('success', 'Product added to favorites');
  } catch (error: any) {
    console.error('Error:', error);
    Toast.show('error', error.message);
  }
};

// export const getCartItems = async () => {
//   try {
//     const token = await AsyncStorage.getItem('authToken');

//     const response = await fetch(`${config.baseURL}api/cart/cartitems`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || 'Failed to fetch cart items');
//     }

//     return data?.items || []; // Return only the items array
//   } catch (error) {
//     console.error('Error fetching cart items:', error);
//     throw error;
//   }
// };

export const getCartItems = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');

    // If no token, return empty array (user not logged in)
    if (!token) {
      console.log('No auth token found, returning empty cart');
      return [];
    }

    console.log('Fetching cart items...');

    const response = await fetch(`${config.baseURL}api/cart/cartitems`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // Always try to parse JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse cart response:', parseError);
      return [];
    }

    console.log('Cart API response status:', response.status);
    console.log('Cart API response:', data);

    // If response is not OK, but we have data, check if it's an empty cart
    if (!response.ok) {
      // If it's a 404 or similar, return empty array (cart doesn't exist yet)
      if (response.status === 404 || data?.message?.includes('empty') || data?.message?.includes('not found')) {
        console.log('Cart not found or empty, returning empty array');
        return [];
      }
      // For other errors, throw
      throw new Error(data?.message || `Failed to fetch cart items: ${response.status}`);
    }

    // Extract items from various possible response formats
    if (data?.items && Array.isArray(data.items)) {
      return data.items;
    }
    
    if (data?.cart?.items && Array.isArray(data.cart.items)) {
      return data.cart.items;
    }
    
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }

    // If response is an array directly
    if (Array.isArray(data)) {
      return data;
    }

    // If we have a success response but no items, return empty array
    if (data?.success !== false) {
      return [];
    }

    // Fallback: return empty array
    console.log('No items found in cart response, returning empty array');
    return [];

  } catch (error) {
    console.error('Error fetching cart items:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

export const removeFromFavoritesList = async productId => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');

    const response = await fetch(`${config.baseURL}api/remove-favorite`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify({ productId }),
    });

    const data = await response.json();
    console.log('Delete Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove from favorites');
    }

    Toast.show('success', 'Product removed from favorites');
  } catch (error: any) {
    console.error('Error:', error);
    Toast.show('error', error.message);
  }
};

// Function to fetch all favorite products
export const getFavoriteProducts = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${config.baseURL}api/list-favorites`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch favorite products');
    }

    const data = await response.json();
    return data.favorites; // Returns list of favorite products
  } catch (error: any) {
    console.error('Error fetching favorite products:', error.message);
    throw error.message;
  }
};

export const placeOrder = async orderData => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${config.baseURL}api/order/place-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Order placed successfully:', data);
    return data;
  } catch (error) {
    console.error('Error placing order:', error);
  }
};

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

// Function to fetch all favorite products
export const getOrders = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(
      `${config.baseURL}api/order/fetch-orders?isAdmin=false`,
      {
        method: 'GET',
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
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

export const cancelOrder = async orderId => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${config.baseURL}api/order/remove-order`, {
      method: 'DELETE',
      body: JSON.stringify({
        orderId,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

export const registerWithGoogle = async payload => {
  try {
    const response = await fetch(`${config.baseURL}api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google registration failed');
    }

    console.log('Registration Successful:', data);
    return data; // This contains user details and JWT token
  } catch (error: any) {
    console.error('Error:', error.message);
  }
};

export const sendOtp = async (email: string) => {
  try {
    const response = await fetch(`${config.baseURL}api/reset/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.status === 404) {
      throw new Error('User not found with this email');
    }

    if (!response.ok) {
      throw new Error('Failed to send OTP');
    }
    const data = await response.json();
    return data; // { message: "OTP sent successfully" }
  } catch (error: any) {
    console.error('Error sending OTP:', error.message);
    throw error.message;
  }
};

export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await fetch(`${config.baseURL}api/reset/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'OTP verification failed');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error verifying OTP:', error.message);
    throw error.message;
  }
};

export const resetPassword = async (newPassword: string, email: string) => {
  try {
    const response = await fetch(`${config.baseURL}api/auth/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPassword, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reset password');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error resetting password:', error.message);
    throw error.message;
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
