import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxiosError } from "axios";

export interface IMyError {
  status: number;
  message?: string;
}

export const useAuth = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [renewInProgress, setRenewInProgress] = useState(false);

  // 🔹 Check token on app load
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setAuthenticated(!!token);
    };
    checkToken();
  }, []);

  // 🔹 Save token when logging in
  const loginUser = useCallback(async (token: string) => {
    await AsyncStorage.setItem("authToken", token);
    setAuthenticated(true);
  }, []);

  // 🔹 Clear token on logout
  const logoutUser = useCallback(async () => {
    await AsyncStorage.multiRemove(["authToken", "userID", "username", "email"]);
    setAuthenticated(false);
  }, []);

  // 🔹 Renew user session (refresh token API call)
  const renewUserAuth = useCallback(async () => {
    setRenewInProgress(true);
    try {
      // Example: call refresh token API
      // const { data } = await axios.post("/auth/refresh");
      // await AsyncStorage.setItem("authToken", data.token);
      setAuthenticated(true);
    } catch (err) {
      setAuthenticated(false);
    } finally {
      setRenewInProgress(false);
    }
  }, []);

  // 🔹 Handle API errors globally
  const errorHandler = useCallback(
    <T extends IMyError>(cb: (msg: string) => void) => {
      return function (error: AxiosError<T>) {
        if (error.response?.status === 401) {
          renewUserAuth();
        } else {
          cb(error.message);
        }
      };
    },
    [renewUserAuth]
  );

  return {
    authenticated,
    renewInProgress,
    loginUser,
    logoutUser,
    renewUserAuth,
    errorHandler,
  };
};
