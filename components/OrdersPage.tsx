import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { cancelOrder, getOrders } from './apiHelper/apiService';

type Order = {
  _id: string;
  userEmail?: string;
  products: {
    productId: string;
    name: string;
    price: number;
    image: string;
    _id: string;
  }[];
  createdAt: string;
  status: 'Completed' | 'Cancelled';
};

const MyOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'Completed' | 'Cancelled'>('Completed');
  const [refreshKey, setRefreshKey] = useState(0); // State to force re-render

  useEffect(() => {
    fetchOrders();
  }, [refreshKey]); // Re-fetch orders when refreshKey changes

  const handleCancelOrder = async (orderId: string) => {
    console.log("Cancel clicked", orderId);

    const confirmCancel = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to cancel this order?')
      : await new Promise((resolve) => {
        Alert.alert(
          'Cancel Order',
          'Are you sure you want to cancel this order?',
          [
            { text: 'No', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Yes', onPress: () => resolve(true) },
          ]
        );
      });

    if (confirmCancel) {
      const res = await cancelOrder(orderId);
      if (res) {
        setRefreshKey(prev => prev + 1); // Trigger re-render to refresh list
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      if (!response || !response.orders) throw new Error('Failed to fetch orders');
      setOrders(response.orders);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch orders');
    }
  };

  // Filter orders based on the selected tab
  const filteredOrders = orders.filter(order => order.status === activeTab);

  const renderItem = ({ item }: { item: Order }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.orderCard}>
        {item.products.map((product, index) => (
          <View key={index} style={styles.productContainer}>
            {/* Image Section */}
            {product?.image && <Image source={{ uri: product.image }} style={styles.image} />}

            {/* Product Details */}
            <View style={styles.infoContainer}>
              <View style={styles.row}>
                <Text style={styles.orderName}>{product?.name || 'N/A'}</Text>
                <Text style={styles.price}>₹{product?.price?.toFixed(2) || '0.00'}</Text>
              </View>
              <Text style={styles.date}>{item.createdAt}</Text>
            </View>
          </View>
        ))}
        {activeTab === 'Completed' && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelOrder(item._id)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['Completed', 'Cancelled'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab ? styles.activeTab : {}]}
            onPress={() => setActiveTab(tab as 'Completed' | 'Cancelled')}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredOrders.length === 0 && (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#888', fontSize: 16 }}>
          Your orders will appear here shortly.
        </Text>
      )}
      {/* Order List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.orderList}
      />
      {!orders && <Text>No Orders founds</Text>}
    </View>
  );
};

export default MyOrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  refreshButton: {
    alignSelf: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  refreshText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  tabButton: { marginHorizontal: 16, paddingVertical: 8, borderBottomWidth: 4, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#ff0000' },
  tabText: { fontSize: 16, color: '#000' },
  orderList: { paddingTop: 10 },
  orderCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  image: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  infoContainer: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  orderName: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  date: { fontSize: 14, color: '#9E9E9E', marginTop: 4 },
  cancelButton: { backgroundColor: '#ff4d4d', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  cancelButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
