import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const addToCart = async (productId: string, quantity: number, color: string, p0: string) => {
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

export const removeFromCart = async (productId: string, quantity: number, color: string, p0: string) => {
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