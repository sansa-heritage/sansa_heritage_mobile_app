import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

/* ============================================================
   verifyRazorpayPayment — now accepts coupon + discountAmount
   ============================================================ */

interface CouponPayload {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  shippingAddress: any;
  totalPrice: number;
  coupon?: CouponPayload | null;      // ✅ optional
  discountAmount?: number;            // ✅ optional
}

export const verifyRazorpayPayment = async (
  paymentData: VerifyPaymentPayload,
) => {
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
      body: JSON.stringify(paymentData),   // ✅ coupon + discountAmount automatically included
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