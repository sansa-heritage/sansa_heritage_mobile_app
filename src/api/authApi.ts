import config from '../config/config';

export const registerWithGoogle = async payload => {
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