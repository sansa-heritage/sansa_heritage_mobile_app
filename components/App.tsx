// import React, { useState, useEffect } from "react";
// import { NavigationContainer, useNavigationState } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// import CartPage from "./CartPage";
// import CheckoutPage from "./CheckoutPage";
// import Dashboard from "./Dashboard";
// import Login from "./Login";
// import OrdersPage from "./OrdersPage";
// import PaymentPage from "./PaymentPage";
// import ProductDetails from "./ProductDetails";
// import Profile from "./Profile";
// import SettingsPage from "./SettingsPage";
// import SignUp from "./SignUp";
// import WalletsPage from "./WalletsPage";
// import FavoriteScreen from "./FavoritsPage";
// import BasicExample from "./(tabs)";
// import SplashScreen from "./screens/SplashScreen";
// import OTPLogin from "./ForgotPassword";
// import BottomTabs from "./screens/BottomTabs";
// import CategoryScreen from "./CategoryScreen";
// import Header from "./screens/Header";

// import AuthContext, { AuthContextType } from "./apiHelper/authContext";
// import ResetPassword from "./ResetPassword";
// import PrivacyPolicyScreen, { AboutUsScreen } from "./PrivacyAndContactUs";
// import { AuthProvider } from "./apiHelper/AuthProvider";

// const Stack = createStackNavigator();

// const App = () => {
//   const [loading, setLoading] = useState(true);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   useEffect(() => {
//     const checkLogin = async () => {
//       try {
//         const token = await AsyncStorage.getItem("authToken");
//         setIsLoggedIn(!!token);
//       } catch (err) {
//         console.error("Error checking login:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     checkLogin();
//   }, []);

//   const logout = async () => {
//     try {
//       await AsyncStorage.multiRemove(["authToken", "userID", "username", "email"]);

//       setIsLoggedIn(false);
//     } catch (err) {
//       console.error("Error logging out:", err);
//     }
//   };

//   if (loading) {
//     return <SplashScreen onFinish={() => setLoading(false)} />;
//   }

//   return (
//     <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, logout }}>
//       <NavigationContainer>
//         {isLoggedIn && <Header />}

//         <Stack.Navigator
//           initialRouteName={isLoggedIn ? "onboarding" : "Login"}
//           screenOptions={{ headerShown: false }}
//         >
//           <Stack.Screen name="Login" component={Login} />
//           <Stack.Screen name="onboarding" component={BasicExample} />
//           <Stack.Screen name="SignUp" component={SignUp} />
//           <Stack.Screen name="Dashboard" component={Dashboard} />
//           <Stack.Screen name="ProductDetails" component={ProductDetails} />
//           <Stack.Screen name="CartPage" component={CartPage} />
//           <Stack.Screen name="CheckoutPage" component={CheckoutPage} />
//           <Stack.Screen name="PaymentPage" component={PaymentPage} />
//           <Stack.Screen name="Profile" component={Profile} />
//           <Stack.Screen name="WalletsPage" component={WalletsPage} />
//           <Stack.Screen name="OrdersPage" component={OrdersPage} />
//           <Stack.Screen name="SettingsPage" component={SettingsPage} />
//           <Stack.Screen name="FavoritesPage" component={FavoriteScreen} />
//           <Stack.Screen name="ForgotPassword" component={OTPLogin} />
//           <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
//           <Stack.Screen name="ResetPassword" component={ResetPassword} />
//           <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
//           <Stack.Screen name="AboutUs" component={AboutUsScreen} />
//         </Stack.Navigator>

//         {isLoggedIn && <BottomTabsWrapper />}
//       </NavigationContainer>
//     </AuthContext.Provider>
//   );
// };

// function BottomTabsWrapper() {
//   const state = useNavigationState((state) => state);
//   const activeRoute = state?.routes[state.index]?.name as
//     | "Dashboard"
//     | "CartPage"
//     | "FavoritesPage"
//     | "Profile";

//   const navigation = state?.key ? (state as any).navigation : null;

//   return <BottomTabs navigation={navigation} activeRoute={activeRoute} />;
// }

// export default App;
