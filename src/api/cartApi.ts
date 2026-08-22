import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const addToCart = async (
  productId: string,
  quantity: number,
  color: string | null = null,
  size: string | null = null,
) => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const storedUserId = await AsyncStorage.getItem('userID');

    if (!storedToken || !storedUserId) {
      throw new Error('User not authenticated');
    }

    const body: any = {
      productId,
      quantity,
      userId: storedUserId,
    };

    // Only add color and size if they have values
    if (color && color !== null && color !== 'null') {
      body.color = color;
    }
    if (size && size !== null && size !== 'null') {
      body.size = size;
    }

    console.log('Adding to cart:', body);

    const response = await fetch(`${config.baseURL}api/cart/add-to-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error adding item to cart: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('Item added to cart:', data);
    return data;
  } catch (err) {
    console.error('Failed to add item to cart:', err);
    throw err;
  }
};

export const removeFromCart = async (
  productId: string,
  quantity: number,
  color: string | null = null,
  size: string | null = null,
) => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const storedUserId = await AsyncStorage.getItem('userID');

    if (!storedToken || !storedUserId) {
      throw new Error('User not authenticated');
    }

    const body: any = {
      productId,
      quantity,
      userId: storedUserId,
    };

    // Only add color and size if they have values
    if (color && color !== null && color !== 'null' && color !== 'N/A') {
      body.color = color;
    }
    if (size && size !== null && size !== 'null' && size !== 'N/A') {
      body.size = size;
    }

    console.log('Removing from cart:', body);

    const response = await fetch(`${config.baseURL}api/cart/remove-from-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error removing item from cart: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('Item removed from cart:', data);
    return data;
  } catch (err) {
    console.error('Failed to remove item from cart:', err);
    throw err;
  }
};

export const getCartItems = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');

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

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse cart response:', parseError);
      return [];
    }

    console.log('Cart API response status:', response.status);
    console.log('Cart API response:', data);

    if (!response.ok) {
      if (
        response.status === 404 ||
        data?.message?.includes('empty') ||
        data?.message?.includes('not found')
      ) {
        console.log('Cart not found or empty, returning empty array');
        return [];
      }
      throw new Error(
        data?.message || `Failed to fetch cart items: ${response.status}`,
      );
    }

    if (data?.items && Array.isArray(data.items)) {
      return data.items;
    }

    if (data?.cart?.items && Array.isArray(data.cart.items)) {
      return data.cart.items;
    }

    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data)) {
      return data;
    }

    if (data?.success !== false) {
      return [];
    }

    console.log('No items found in cart response, returning empty array');
    return [];
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
};
