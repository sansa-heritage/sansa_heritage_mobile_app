// components/apiHelper/authService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN = "authToken";
const USERNAME = "username";
const EMAIL = "email";

export const authService = {
  // ✅ Save user session
  async login(token?: string, username?: string, email?: string) {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN, token || ""],
      [USERNAME, username || ""],
      [EMAIL, email || ""],
    ]);
    this.isLoggedIn()
  },

  // ✅ Remove user session
  async logout() {
    await AsyncStorage.multiRemove([AUTH_TOKEN, USERNAME, EMAIL]);
  },

  // ✅ Get stored token
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(AUTH_TOKEN);
  },

  // ✅ Get stored user info
  async getUser(): Promise<{ username: string | null; email: string | null }> {
    const [username, email] = await AsyncStorage.multiGet([USERNAME, EMAIL]);
    return {
      username: username[1],
      email: email[1],
    };
  },

  // ✅ Check if logged in
  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem(AUTH_TOKEN);
    return !!token;
  },
};
