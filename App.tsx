import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Header from "./src/components/common/Header";
import CartPage from "./src/screens/Cart/CartPage";
import CategoryScreen from "./src/screens/Home/CategoryScreen";
import CheckoutPage from "./src/screens/Cart/CheckoutPage";
import Dashboard from "./src/screens/Home/Dashboard";
import FavoriteScreen from "./src/screens/Profile/FavoritsPage";
import Login from "./src/screens/Auth/Login";
import OrdersPage from "./src/screens/Profile/OrdersPage";
import PaymentPage from "./src/screens/Cart/PaymentPage";
import PrivacyPolicyScreen, { AboutUsScreen } from "./src/screens/Info/PrivacyAndContactUs";
import ProductDetails from "./src/screens/Product/ProductDetails";
import Profile from "./src/screens/Profile/Profile";
import ResetPassword from "./src/screens/Auth/ResetPassword";
import BasicExample from "./src/screens/Onboarding";
import SplashScreen from "./src/screens/Splash/SplashScreen";
import SettingsPage from "./src/screens/Profile/SettingsPage";
import SignUp from "./src/screens/Auth/SignUp";
import WalletsPage from "./src/screens/Profile/WalletsPage";
import OTPLogin from "./src/screens/Auth/ForgotPassword";
import CustomBottomTabs from "./src/navigation/BottomTabs";
import { navigationRef, getCurrentRoute } from "./src/services/NavigationService";
import AccountPage from "./src/screens/Profile/AccountPage";
import TermsScreen from "./src/screens/Info/TermsAndCondition";
import FAQScreen from "./src/screens/Info/FQPage";
import AddressScreen from "./src/screens/Profile/AddressPage";
import { AlertComponent } from "./src/components/common/Toast";
import UpdateProfileScreen from "./src/screens/Profile/UserEditPage";
import NotificationScreen from "./src/screens/Notification/NotificationPage";
import CardsScreen from "./src/components/cardsPage";
import BootSplash from "react-native-bootsplash";
import { Text, View, StyleSheet } from "react-native";
import { NotificationProvider } from "./src/context/NotificationContext";
import ReturnRefundPolicyScreen from "./src/screens/Info/Refund&ReturnPage";

import AnimatedLogoLoader from "./src/components/common/AnimatedLogoLoader";
import OrderDetailsScreen from "./src/screens/Profile/OrderDetails";

const Stack = createStackNavigator();

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>("");
  const [currentRouteParams, setCurrentRouteParams] = useState<any>({});



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
    <NotificationProvider>
      <View style={{ flex: 1 }}>

        <NavigationContainer ref={navigationRef}
          onReady={() => {
            const route = navigationRef.getCurrentRoute();
            setCurrentRoute(route?.name ?? "");
            setCurrentRouteParams(route?.params ?? {});

          }}
          onStateChange={() => {
            const route = navigationRef.getCurrentRoute();
            setCurrentRoute(route?.name ?? "");
            setCurrentRouteParams(route?.params ?? {});

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
              <Header currentRoute={currentRoute} routeParams={currentRouteParams} />
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
                <Stack.Screen name="AddressScreen" component={AddressScreen} />
                <Stack.Screen name="UpdateProfileScreen" component={UpdateProfileScreen} />
                <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
                <Stack.Screen name="CardsScreen" component={CardsScreen} />
                <Stack.Screen name="ReturnRefundScreen" component={ReturnRefundPolicyScreen} />

                {/* ✅ Add OrderDetails Screen here */}
                <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />


                <Stack.Screen name="AccountPage">
                  {(props) => <AccountPage {...props} onLogout={logout} />}
                </Stack.Screen>
              </Stack.Navigator>
              <AlertComponent />

              {/* <CustomBottomTabs activeRoute="Dashboard" onLogout={logout} /> */}
              {/* Only show tabs when NOT on ProductDetails */}
              {currentRoute !== "ProductDetails" && (
                <CustomBottomTabs activeRoute={currentRoute} onLogout={logout} />
              )}
            </>
          )}
        </NavigationContainer>
        <AnimatedLogoLoader />
      </View>

    </NotificationProvider>
  );



};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
export default App;
