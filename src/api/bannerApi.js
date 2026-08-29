// api/bannerApi.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';

const BASE_URL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app';

// Get active banners
export const getActiveBanners = async () => {
  try {
    const response = await fetch(`${BASE_URL}api/banners/active`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch banners');
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
};