// src/config/config.ts
import Config from 'react-native-config';

const DEV_FALLBACK = 'http://192.168.1.11:5000/';

const resolveBaseURL = () => {
  const fromEnv = Config.API_BASE_URL?.trim();
  const url = fromEnv && fromEnv.length > 0 ? fromEnv : DEV_FALLBACK;
  return url.endsWith('/') ? url : `${url}/`;
};

const config = {
  /* Environment */
  baseURL: resolveBaseURL(),
  env: Config.ENV_NAME || 'development',
  isProduction: Config.ENV_NAME === 'production',
  isStaging: Config.ENV_NAME === 'staging',
  isDevelopment: Config.ENV_NAME === 'development' || !Config.ENV_NAME,

  /* Google Sign-In */
  googleWebClientId: Config.GOOGLE_WEB_CLIENT_ID || '',
  googleIosClientId: Config.GOOGLE_IOS_CLIENT_ID || '',

  /* Razorpay */
  razorpayKeyId: Config.RAZORPAY_KEY_ID || '',
};

export default config;