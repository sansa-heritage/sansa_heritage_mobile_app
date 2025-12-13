import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';
import { addToCart, removeFromCart } from './apiHelper/apiService';
import { RootStackParamList } from './models/types';
import eventBus from './apiHelper/eventBus';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: any;
  discount: number;
}

const CartScreen: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const reloadPage = () => {
    navigation.replace('CartPage',{itemId: ''});
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserId = await AsyncStorage.getItem('userID');

        if (storedToken) setToken(storedToken);
        if (storedUserId) setUserId(storedUserId);

        if (!storedToken) {
          console.warn('No token found in AsyncStorage');
        }
      } catch (err) {
        console.error('Error fetching token:', err);
      }
    };

    const fetchProductDetails = async () => {

      if (!token) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${config.baseURL}api/cart/cartitems`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        setCartItems(data.items);
        setLoading(false);
      } catch (err) {
        setError('Failed to load product details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const initialize = async () => {
      await fetchToken();
      if (token) {
        fetchProductDetails()
      }
    };

    initialize();
  }, [token]);
  const increaseQuantity = async (id: string) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.productId === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      return updatedItems;
    });

    // API call to add item to cart with updated quantity
    const updatedItem = cartItems.find((item) => item.productId === id);
    if (updatedItem) {
      await addToCart(id, 1);
      reloadPage()
    }
  };

  const decreaseQuantity = async (id: string) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.productId === id && item.quantity > 0
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      return updatedItems;
    });

    // API call to remove item from cart with updated quantity
    const updatedItem = cartItems.find((item) => item.productId === id);
    if (updatedItem && updatedItem.quantity > 0) {
      await removeFromCart(id, 1);
      reloadPage()
      eventBus.emit("ITEM_REMOVED", { id: 123 });
    }
  };
  const renderPrice = (price, discount) => {
    const discountedPrice = price - (price * discount / 100);
    return (
      <View style={styles.priceContainer}>
        <Text style={styles.discountedPrice}>₹{discountedPrice?.toFixed(2)}</Text>
        <Text style={styles.originalPrice}>₹{price?.toFixed(2)}</Text>
        <Text style={styles.discountPercent}>{discount}% off</Text>
      </View>
    );
  };

  const calculateSubtotal = () => {
    return cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2); // Returns string
  };

  const redirectToCheckout = () => {
    const subtotalPrice = Number(
      cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)
    );
    const billingDetails = { subtotalPrice: 0 };
    billingDetails.subtotalPrice = subtotalPrice
    navigation.navigate('CheckoutPage', {
      billingDetails: Number(cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2))
    });
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemContainer}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price * item.quantity}</Text>
        <View style={styles.priceSection}>
          {renderPrice(item?.price, item?.discount || 0)}
        </View>
      </View>
      <View style={styles.quantityControl}>
        <TouchableOpacity onPress={() => decreaseQuantity(item.productId)} style={styles.button}>
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => increaseQuantity(item.productId)} style={styles.button}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
      <View 
        style={[
          styles.screen,
          cartItems.length === 0 && { backgroundColor: 'transparent' }
        ]}
      >

        <Text style={styles.title}>My Cart</Text>
        {cartItems?.length > 0 ? (
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.productId.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: 100 }
            ]}
            ListFooterComponent={
              <View style={{ marginTop: 20 }}>
                <View style={styles.subtotalContainer}>
                  <Text style={styles.subtotalLabel}>Subtotal:</Text>
                  <Text style={styles.subtotalValue}>${calculateSubtotal()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={redirectToCheckout}
                >
                  <Text style={styles.checkoutButtonText}>Checkout</Text>
                </TouchableOpacity>
              </View>
            }
          />
        ) : (
          <View>
            <Text style={styles.errorMsg}>Add Some Items To Cart</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 16,
    color: '#333',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 5,
    marginHorizontal: 5,
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  subtotalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorMsg: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center'
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  checkoutButton: {
    backgroundColor: '#151515',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceSection: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'left',
    padding: 9,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 9,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: 'green',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CartScreen;
