// src/config/config.js
/**
 * Central global constants for the app.
 * Pure JavaScript — no native modules.
 *
 * ────────────────────────────────────────────────────────────
 *  HOW TO SWITCH ENVIRONMENTS
 *  Change ACTIVE_ENV below to 'development' | 'staging' | 'production'
 *  then rebuild the app.
 * ────────────────────────────────────────────────────────────
 */

/* ============================================================
   ACTIVE ENVIRONMENT
   ============================================================ */

// ✅ FORCE a specific environment (uncomment the one you want)
const ACTIVE_ENV = 'development';
// const ACTIVE_ENV = 'staging';
// const ACTIVE_ENV = 'production';

// ✅ OR auto-switch based on build type (comment out the line above)
// const ACTIVE_ENV = __DEV__ ? 'development' : 'production';

/* ============================================================
   PER-ENVIRONMENT MAP
   ============================================================ */
const ENV_MAP = {
  development: {
    // Use LAN IP for real devices, 10.0.2.2 for Android emulator
    baseURL: 'http://192.168.1.11:5000/',
    googleWebClientId:
      '782904869146-0min0dn439lt2uprmv9q5qsnkfmdt3dv.apps.googleusercontent.com',
    googleIosClientId:
      '662462542419-f7bpa8ios3ji30b1svrljk7spc1oa72d.apps.googleusercontent.com',
    razorpayKeyId: 'rzp_test_xxxxxxxxxxxx',
  },

  staging: {
    baseURL: 'https://sansa-backend-staging.vercel.app/',
    googleWebClientId:
      '782904869146-0min0dn439lt2uprmv9q5qsnkfmdt3dv.apps.googleusercontent.com',
    googleIosClientId:
      '662462542419-f7bpa8ios3ji30b1svrljk7spc1oa72d.apps.googleusercontent.com',
    razorpayKeyId: 'rzp_test_xxxxxxxxxxxx',
  },

  production: {
    baseURL: 'https://sansa-backend-prod.vercel.app/',
    googleWebClientId:
      '782904869146-0min0dn439lt2uprmv9q5qsnkfmdt3dv.apps.googleusercontent.com',
    googleIosClientId:
      '662462542419-f7bpa8ios3ji30b1svrljk7spc1oa72d.apps.googleusercontent.com',
    razorpayKeyId: 'rzp_test_xxxxxxxxxxxx',
  },
};

/* ============================================================
   HELPERS
   ============================================================ */
const ensureTrailingSlash = (url) => (url.endsWith('/') ? url : `${url}/`);

const current = ENV_MAP[ACTIVE_ENV];

/* ============================================================
   EXPORTED CONFIG
   ============================================================ */
const config = {
  /* Environment */
  baseURL: ensureTrailingSlash(current.baseURL),
  env: ACTIVE_ENV,
  isProduction: ACTIVE_ENV === 'production',
  isStaging: ACTIVE_ENV === 'staging',
  isDevelopment: ACTIVE_ENV === 'development',

  /* Google Sign-In */
  googleWebClientId: current.googleWebClientId,
  googleIosClientId: current.googleIosClientId,

  /* Razorpay */
  razorpayKeyId: current.razorpayKeyId,
};

export default config;