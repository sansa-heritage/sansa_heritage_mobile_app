import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";

const mockData = [
  { id: '1', title: 'Long Sleeve Shirts', price: '$165', imageUrl: '/assets/images/casual2.png', favorite: false },
  { id: '2', title: 'Casual Henley Shirts', price: '$175', imageUrl: '/assets/images/black2.png', favorite: true },
  { id: '3', title: 'Curved Hem Shirts', price: '$100', imageUrl: '/assets/images/white_black.png', favorite: false },
  { id: '4', title: 'Casual Nolin', price: '$100', imageUrl: '/assets/images/black_shirt.png', favorite: true },
  { id: '5', title: 'Short Sleeve Shirts', price: '$120', imageUrl: '/assets/images/casual2.png', favorite: false },
  { id: '6', title: 'Linen Casual Shirt', price: '$100', imageUrl: '/assets/images/white_green.png', favorite: true }
];

const SearchResultsScreen = () => {
  const [searchQuery, setSearchQuery] = useState<string>('Shirt');
  const [recentSearches] = useState<string[]>(['Shirt', 'T-shirt', 'Jeans', 'Jacket']);
  const [products, setProducts] = useState(mockData);

  const toggleFavorite = (id: string) => {
    const updatedProducts = products.map(product =>
      product.id === id ? { ...product, favorite: !product.favorite } : product
    );
    setProducts(updatedProducts);
  };

  const renderProductCard = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.price}>{item.price}</Text>
      <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.favoriteButton}>
        <Ionicons name={item.favorite ? 'heart' : 'heart-outline'} size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Recent Searches */}
      <View style={styles.recentSearches}>
        <Text style={styles.recentSearchesTitle}>Recent searches</Text>
        <FlatList
          data={recentSearches}
          renderItem={({ item }) => <Text style={styles.recentSearchItem}>{item}</Text>}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Search Results */}
      <View style={styles.searchResults}>
        <Text style={styles.resultsTitle}>Search results showing for "{searchQuery}"</Text>
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingLeft: 10,
    marginRight: 10
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10
  },
  recentSearches: {
    marginVertical: 10
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  recentSearchItem: {
    marginRight: 10,
    fontSize: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10
  },
  searchResults: {
    marginTop: 20
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  card: {
    flex: 1,
    margin: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  price: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 10
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10
  }
});

export default SearchResultsScreen;
