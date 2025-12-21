import config from "../../config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { Toast } from "../screens/Toast";

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
        userId: storedUserId
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
        userId: storedUserId
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



export const addToFavoritesList = async (productId) => {
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

export const getCartItems = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");

    const response = await fetch(`${config.baseURL}api/cart/cartitems`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch cart items");
    }

    return data?.items || [];  // Return only the items array

  } catch (error) {
    console.error("Error fetching cart items:", error);
    throw error;
  }
};

export const removeFromFavoritesList = async (productId) => {
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

export const placeOrder = async (orderData) => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${config.baseURL}api/order/place-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
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
}


// Function to fetch all favorite products
export const getOrders = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${config.baseURL}api/order/fetch-orders?isAdmin=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
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

export const cancelOrder = async (orderId) => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${config.baseURL}api/order/remove-order`, {
      method: 'DELETE',
      body: JSON.stringify({
        orderId
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
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

export const registerWithGoogle = async (payload) => {
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

export const updateProfile = async ( data) => {
    const storedToken = await AsyncStorage.getItem('authToken');
  return await fetch(`${config.baseURL}api/auth/update-profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${storedToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
};

export const getAddresses = async () => {
  try {
    const storedToken = await AsyncStorage.getItem("authToken");

    const response = await fetch(`${config.baseURL}api/auth/addresses`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch addresses");
    }

    const data = await response.json();
    return data.addresses || [];
  } catch (error) {
    console.log("ADDRESS FETCH ERROR:", error);
    return [];
  }
};

export const getUserDetails = async () => {
  try {
    const storedToken = await AsyncStorage.getItem("authToken");
    const response = await fetch(`${config.baseURL}api/auth/userById`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
    console.error("Error fetching user details:", error);
    throw error;
  }
};

