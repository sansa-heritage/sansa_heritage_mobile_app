export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Dashboard: undefined;
  searchPage: undefined;
  ProductDetails: { itemId: string };
  CartPage: { itemId?: string };
  CheckoutPage: { billingDetails: Number };
  PaymentPage: { orderId: Number };
  Profile: undefined;
  WalletsPage: undefined;
  OrdersPage: undefined;
  SettingsPage: undefined;
  FavoritesPage: undefined;
  TermsScreen: undefined;
  FAQScreen: undefined;
  AboutUs: undefined;
  PrivacyPolicy: undefined;
  ForgotPassword: undefined
  BottomTabs: undefined
  CategoryScreen: { mainCategory: string };
  ResetPassword: { email: string };
  AccountPage: undefined;
  AddressFormPage: undefined;
  UpdateProfileScreen: undefined;
  NotificationScreen: undefined;
  CardsScreen: undefined;
  ReturnRefundScreen: undefined;
  // Add other routes as needed
};