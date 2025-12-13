// AuthContext.tsx
import React, { createContext, useContext, useState } from "react";

type AuthContextType = {
  logoutUser: () => void;
  user: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);

  const logoutUser = () => {
    setUser(null);
    console.log("Logged out!");
  };

  return (
    <AuthContext.Provider value={{ logoutUser, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside an AuthProvider");
  }
  return context;
};
