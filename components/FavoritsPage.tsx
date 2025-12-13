import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { getFavoriteProducts, removeFromFavoritesList } from './apiHelper/apiService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './models/types';
import eventBus from './apiHelper/eventBus';

const FavoriteScreen = () => {
  const [favoriteData, setFavoriteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const redirectToProductDetails = (id: string) => {
    navigation.navigate('ProductDetails', { itemId: id });
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      await removeFromFavoritesList(productId);
      setFavoriteData(prev => prev.filter((f: any) => f.productId._id !== productId));
      eventBus.emit("ITEM_REMOVED", { id: 123 });
    } catch (err) {
      console.log("Error removing favorite:", err);
    }
  };

  useEffect(() => {
    const getFavorites = async () => {
      try {
        const data = await getFavoriteProducts();
        setFavoriteData(data);
      } catch (err) {
        setError('Error fetching favorites');
      } finally {
        setLoading(false);
      }
    };
    getFavorites();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => redirectToProductDetails(item?.productId._id)}
      activeOpacity={0.8}
    >
      <TouchableOpacity
        style={styles.removeIconContainer}
        onPress={() => handleRemoveFavorite(item.productId._id)}
      >
        <Text style={styles.removeIcon}>✕</Text>
      </TouchableOpacity>

      <Image source={{ uri: item.productId.image }} style={styles.itemImage} />
      <Text style={styles.itemName} numberOfLines={1}>{item.productId.name}</Text>
      <Text style={styles.itemPrice}>₹{item.productId.price}</Text>
    </TouchableOpacity>
  );


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.screen,
          favoriteData.length === 0 && { backgroundColor: 'transparent' }
        ]}
      >

        <Text style={styles.header}>Favorites</Text>
        {favoriteData.length > 0 ? (
          <FlatList
            data={favoriteData}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.errorMsg}>Add Some Items To Favorites</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default FavoriteScreen;

const styles = StyleSheet.create({
  errorMsg: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 50,
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  itemContainer: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  itemImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    color: 'red',
    fontSize: 18,
  },
  removeIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },

  removeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

});
