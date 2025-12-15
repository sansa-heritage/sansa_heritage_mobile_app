import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Header from "./components/screens/Header";
import CartPage from "./components/CartPage";
import CategoryScreen from "./components/CategoryScreen";
import CheckoutPage from "./components/CheckoutPage";
import Dashboard from "./components/Dashboard";
import FavoriteScreen from "./components/FavoritsPage";
import Login from "./components/Login";
import OrdersPage from "./components/OrdersPage";
import PaymentPage from "./components/PaymentPage";
import PrivacyPolicyScreen, { AboutUsScreen } from "./components/PrivacyAndContactUs";
import ProductDetails from "./components/ProductDetails";
import Profile from "./components/Profile";
import ResetPassword from "./components/ResetPassword";
import BasicExample from "./components/screens"; // Intro slides
import SplashScreen from "./components/screens/SplashScreen";
import SettingsPage from "./components/SettingsPage";
import SignUp from "./components/SignUp";
import WalletsPage from "./components/WalletsPage";
import OTPLogin from "./components/ForgotPassword";
import CustomBottomTabs from "./components/screens/BottomTabs";
import { navigationRef, getCurrentRoute } from "./components/apiHelper/NavigationService";
import AccountPage from "./components/AccountPage";
import TermsScreen from "./components/TermsAndCondition";
import FAQScreen from "./components/FQPage";
import AddressFormScreen from "./components/AddressPage";
import { AlertComponent } from "./components/screens/Toast";
import UpdateProfileScreen from "./components/UserEditPage";
import NotificationScreen from "./components/NotificationPage";
import CardsScreen from "./components/cardsPage";
import BootSplash from "react-native-bootsplash";
const Stack = createStackNavigator();

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>("");

  const TAB_ROUTES = [
    "Dashboard",
    "Cart",
    "Favorites",
    "AccountPage"
  ];

  const HEADER_TITLES: Record<string, string> = {
    CartPage: "Cart",
    ProductDetails: "Product Details",
    CheckoutPage: "Order Confirmation",
    PaymentPage: "Payment",
    OrdersPage: "My Orders",
    FavoritesPage: "Wishlist",
    Profile: "My Profile",
    AccountPage: "My Account",
    CategoryScreen: "Categories",
    SettingsPage: "Settings",
    PrivacyPolicy: "Privacy Policy",
    FAQScreen: "FAQ",
    AddressFormPage: "Addresses"
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await AsyncStorage.removeItem("introSeen");
        const token = await AsyncStorage.getItem("authToken");
        setIsLoggedIn(!!token);

        const introSeen = await AsyncStorage.getItem("introSeen");
        setShowIntro(!introSeen);
      } catch (err) {
        console.error("Error checking login:", err);
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      // …do multiple sync or async tasks
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
      console.log("BootSplash has been hidden successfully");
    });
    checkStatus();
  }, []);


  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["authToken", "userID", "username", "email"]);
      setIsLoggedIn(false);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <NavigationContainer ref={navigationRef}
      onReady={() => {
        const route = navigationRef.getCurrentRoute();
        setCurrentRoute(route?.name ?? "");
      }}
      onStateChange={() => {
        const route = navigationRef.getCurrentRoute();
        setCurrentRoute(route?.name ?? "");
      }}>
      {showIntro ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="IntroSlides">
            {(props) => (
              <BasicExample
                {...props}
                onFinishIntro={async () => {
                  await AsyncStorage.setItem("introSeen", "true");
                  setShowIntro(false);
                }}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      ) : !isLoggedIn ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => (
              <Login
                {...props}
                onLoginSuccess={() => {
                  setIsLoggedIn(true);
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="ForgotPassword" component={OTPLogin} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
        </Stack.Navigator>
      ) : (
        <>
          <Header
            currentRoute={currentRoute}
            title={HEADER_TITLES[currentRoute] || ""}
          />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} />
            <Stack.Screen name="CartPage" component={CartPage} />
            <Stack.Screen name="CheckoutPage" component={CheckoutPage} />
            <Stack.Screen name="PaymentPage" component={PaymentPage} />
            <Stack.Screen name="Profile">
              {(props) => <Profile {...props} onLogout={logout} />}
            </Stack.Screen>
            <Stack.Screen name="WalletsPage" component={WalletsPage} />
            <Stack.Screen name="OrdersPage" component={OrdersPage} />
            <Stack.Screen name="SettingsPage" component={SettingsPage} />
            <Stack.Screen name="FavoritesPage" component={FavoriteScreen} />
            <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="AboutUs" component={AboutUsScreen} />
            <Stack.Screen name="TermsScreen" component={TermsScreen} />
            <Stack.Screen name="FAQScreen" component={FAQScreen} />
            <Stack.Screen name="AddressFormPage" component={AddressFormScreen} />
            <Stack.Screen name="UpdateProfileScreen" component={UpdateProfileScreen} />
            <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
            <Stack.Screen name="CardsScreen" component={CardsScreen} />

            <Stack.Screen name="AccountPage">
              {(props) => <AccountPage {...props} onLogout={logout} />}
            </Stack.Screen>
          </Stack.Navigator>
          <AlertComponent />

          {TAB_ROUTES.includes(currentRoute) && (
            <CustomBottomTabs
              activeRoute={currentRoute as any}
              onLogout={logout}
            />
          )}
        </>
      )}
    </NavigationContainer>
  );
};

export default App;
