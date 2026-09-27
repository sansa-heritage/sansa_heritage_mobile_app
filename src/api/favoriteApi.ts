import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ✅ FIXED — replaced Toast with snackbar
import { snackbar } from '../components/common/Snackbar';

export const addToFavoritesList = async (productId: string) => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');

    const response = await fetch(`${config.baseURL}api/add-favorite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify({ productId }),
    });

    const data = await response.json();
    console.log('Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add to favorites');
    }

    // ✅ FIXED — snackbar instead of Toast
    snackbar.success('Product added to favorites');
  } catch (error: any) {
    console.error('Error:', error);
    // ✅ FIXED — snackbar instead of Toast
    snackbar.error(error.message || 'Failed to add to favorites');
  }
};

export const removeFromFavoritesList = async (productId: string) => {
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

    // ✅ FIXED — snackbar instead of Toast
    snackbar.success('Product removed from favorites');
  } catch (error: any) {
    console.error('Error:', error);
    // ✅ FIXED — snackbar instead of Toast
    snackbar.error(error.message || 'Failed to remove from favorites');
  }
};

// ✅ UNCHANGED — no toasts in this function
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
    return data.favorites;
  } catch (error: any) {
    console.error('Error fetching favorite products:', error.message);
    throw error.message;
  }
};