import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { cancelOrder, getOrders } from './apiHelper/apiService';

type Order = {
  _id: string;
  products: {
    name: string;
    price: number;
    image: string;
  }[];
  createdAt: string;
  status: 'Completed' | 'Cancelled';
};

const MyOrdersScreen: React.FC = () => {
  // ✅ Hooks at top level
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] =
    useState<'Completed' | 'Cancelled'>('Completed');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res?.orders || []);
    } catch {
      setOrders([]);
    }
  };

  const openConfirm = (orderId: string) => {
    setSelectedOrderId(orderId);
    setConfirmVisible(true);
  };

  const confirmCancel = async () => {
    if (!selectedOrderId) return;
    await cancelOrder(selectedOrderId);
    setConfirmVisible(false);
    setSelectedOrderId(null);
    loadOrders();
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      {/* Date + Status */}
      <View style={styles.statusRow}>
        <Text style={styles.date}>
          {new Date(item.createdAt).toDateString()}
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.status === 'Completed'
              ? styles.completed
              : styles.cancelled,
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {/* Products */}
      {item.products.map((p, index) => (
        <View key={index} style={styles.productRow}>
          <Image source={{ uri: p.image }} style={styles.image} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.price}>₹{p.price}</Text>
          </View>
        </View>
      ))}

      {/* Cancel */}
      {item.status === 'Completed' && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => openConfirm(item._id)}
        >
          <Ionicons
            name="close-circle-outline"
            size={18}
            color="#E53935"
          />
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {['Completed', 'Cancelled'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            style={[
              styles.tabBtn,
              activeTab === tab && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />

      {/* CONFIRM MODAL */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color="#E53935"
            />
            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel this order?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={confirmCancel}
              >
                <Text style={styles.modalConfirmText}>
                  Yes, Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MyOrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    padding: 16,
  },

  header: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },

  /* Order Card */
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 3,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  date: {
    fontSize: 13,
    color: '#777',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  completed: {
    backgroundColor: '#E8F5E9',
  },

  cancelled: {
    backgroundColor: '#FDECEA',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: '600',
  },

  price: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  cancelText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    backgroundColor: '#FFF',
    width: '80%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },

  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
  },

  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },

  modalCancelText: {
    fontSize: 14,
    color: '#555',
  },

  modalConfirm: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  modalConfirmText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

