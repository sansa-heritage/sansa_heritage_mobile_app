import React, { useState } from 'react';
import { View, Text, Image, Dimensions, StyleSheet, ScrollView } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width: screenWidth } = Dimensions.get('window');

const cardData = [
  { id: '1', title: 'Platinum Card', brand: require('../assets/images/visa.png') },
  { id: '2', title: 'Gold Card', brand: require('../assets/images/visa.png') },
  { id: '3', title: 'Gold Card', brand: require('../assets/images/visa.png') },
];

const transactions = [
  {
    id: '1',
    title: 'Casual Shirts',
    date: '23 Mar 2021',
    amount: '$250',
    image: require('../assets/images/white_green.png'),
  },
  {
    id: '2',
    title: 'Jeans',
    date: '25 Mar 2021',
    amount: '$120',
    image: require('../assets/images/white_green.png'),
  },
  {
    id: '3',
    title: 'Shoes',
    date: '27 Mar 2021',
    amount: '$300',
    image: require('../assets/images/white_green.png'),
  },
];

export default function WalletScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Carousel */}
      <View style={{ height: 220, marginTop: 20 }}>
        <Carousel
          loop
          width={screenWidth}
          height={220}
          autoPlay={false}
          data={cardData}
          scrollAnimationDuration={1000}
          onSnapToItem={(index) => setActiveIndex(index)}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <Image source={item.brand} style={styles.cardBrand} resizeMode="contain" />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
          )}
        />
      </View>

      {/* Pagination */}
      <View style={styles.pagination}>
        {cardData.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, { opacity: activeIndex === index ? 1 : 0.3 }]}
          />
        ))}
      </View>

      {/* Transactions Section */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Recent Transactions</Text>
      </View>

      {transactions.map((item) => (
        <View key={item.id} style={styles.transactionContainer}>
          <Image source={item.image} style={styles.transactionImage} />
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>{item.title}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
          <Text style={styles.transactionAmount}>{item.amount}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFEDF3',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 10,
  },
  cardBrand: { width: '80%', height: '80%' },
  cardTitle: { marginTop: 10, fontWeight: 'bold' },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },

  transactionsHeader: { marginTop: 30, paddingHorizontal: 20 },
  transactionsTitle: { fontSize: 18, fontWeight: 'bold' },

  transactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  transactionImage: { width: 50, height: 50, borderRadius: 10 },
  transactionDetails: { flex: 1, marginLeft: 10 },
  transactionTitle: { fontSize: 16, fontWeight: 'bold' },
  transactionDate: { fontSize: 14, color: '#999' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', color: '#FF4A4A' },

  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', marginHorizontal: 4 },
});
