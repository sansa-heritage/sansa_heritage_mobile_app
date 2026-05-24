import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getFavoriteProducts, removeFromFavoritesList } from './apiHelper/apiService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './models/types';
import eventBus from './apiHelper/eventBus';

const FavoriteScreen = () => {
  const [favoriteData, setFavoriteData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const redirectToProductDetails = (id: string) => {
    navigation.navigate('ProductDetails', { itemId: id });
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await removeFromFavoritesList(productId);
      setFavoriteData(prev =>
        prev.filter(item => item.productId._id !== productId)
      );
      eventBus.emit('ITEM_REMOVED', { id: productId });
    } catch (err) {
      console.log('Remove favorite error:', err);
    }
  };

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const data = await getFavoriteProducts();
        setFavoriteData(data);
      } catch {
        setError('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const renderItem = ({ item }: any) => {
    const product = item.productId;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => redirectToProductDetails(product._id)}
      >
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFavorite(product._id)}
        >
          <Icon name="favorite" size={20} color="#E53935" />
        </TouchableOpacity>

        <Image source={{ uri: product.image }} style={styles.image} />

        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>

        <Text style={styles.price}>₹{product.price}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {favoriteData.length > 0 ? (
        <FlatList
          data={favoriteData}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      ) : (
        <View style={styles.empty}>
          <Icon name="favorite-border" size={70} color="#ccc" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySub}>
            Add products you love to see them here
          </Text>
        </View>
      )}
    </View>
  );
};

export default FavoriteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 14,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 16,
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 10
  },
  card: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 4,
    elevation: 3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#E53935',
    fontSize: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 6,
  },
});

