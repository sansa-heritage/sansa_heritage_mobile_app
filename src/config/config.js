 // export default config;
import Config from 'react-native-config';
import { Platform } from 'react-native';

/**
 * Fallback URL — used only if the .env file is missing
 * or API_BASE_URL is empty.
 *
 * Android emulator → 10.0.2.2 maps to host machine's localhost
 * iOS simulator / real device → use LAN IP
 */
const DEV_FALLBACK = Platform.select({
  android: 'http://192.168.1.11:5000/',
  ios: 'http://192.168.1.11:5000/',
  default: 'http://192.168.1.11:5000/',
});

/**
 * Resolves the base URL from the active .env file.
 * Always ensures a trailing '/' for safe concatenation.
 */
const resolveBaseURL = () => {
  const fromEnv = Config.API_BASE_URL?.trim();
  const url = fromEnv && fromEnv.length > 0 ? fromEnv : DEV_FALLBACK;
  return url.endsWith('/') ? url : `${url}/`;
};

const config = {
  baseURL: resolveBaseURL(),
  env: Config.ENV_NAME || 'development',
  isProduction: Config.ENV_NAME === 'production',
  isStaging: Config.ENV_NAME === 'staging',
  isDevelopment: Config.ENV_NAME === 'development' || !Config.ENV_NAME,
};

export default config;