import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
