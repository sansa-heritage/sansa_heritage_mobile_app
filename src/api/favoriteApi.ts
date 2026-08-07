import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast } from '../components/common/Toast';

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