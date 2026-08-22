import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
    Modal,
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    TextInput,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import Rating from "../../components/common/RatingStars";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useRoute } from '@react-navigation/native';
import { addToFavoritesList } from "../../api/favoriteApi";
import { RootStackParamList } from "../../models/types";
import LoadingService from '../../services/LoadingService';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");
const BASE_URL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app';

// Helper function to get image source
const getImageSource = (item: any) => {
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        const image = item.images[0];
        if (image) {
            if (image.startsWith('data:image')) return { uri: image };
            if (image.startsWith('http')) return { uri: image };
            if (image.startsWith('/')) return { uri: `${BASE_URL.replace(/\/$/, '')}${image}` };
            return { uri: `${BASE_URL.replace(/\/$/, '')}/${image}` };
        }
    }
    if (item.image) {
        if (item.image.startsWith('data:image')) return { uri: item.image };
        if (item.image.startsWith('http')) return { uri: item.image };
        if (item.image.startsWith('/')) return { uri: `${BASE_URL.replace(/\/$/, '')}${item.image}` };
        return { uri: `${BASE_URL.replace(/\/$/, '')}/${item.image}` };
    }
    return require("../../../assets/images/logo.png");
};

export default function CategoryScreen() {
    const route = useRoute();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { mainCategory } = route.params as { mainCategory: string };

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const getDisplayTitle = () => {
        if (mainCategory === "New Arrival") return "New Arrivals";
        if (mainCategory === "Trending") return "Trending Now";
        return mainCategory;
    };

    const addToFavorites = (_id: number | undefined) => {
        addToFavoritesList(_id);
    };

    const redirectToProductDetails = (id) => {
        navigation.navigate('ProductDetails', { itemId: id });
    };

    const goBack = () => {
        navigation.goBack();
    };

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${config.baseURL}api/master/category`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            const data = await response.json();
            const activeCategories = data.filter((cat: any) => cat.isActive === true);
            setCategories([{ _id: '', name: 'All', isActive: true }, ...activeCategories]);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([
                { _id: '', name: 'All' },
                { _id: '1', name: 'Sarees' },
                { _id: '2', name: 'Kurtis' },
                { _id: '3', name: 'Lehengas' },
                { _id: '4', name: 'Ethnic Sets' },
                { _id: '5', name: 'Dupattas' },
            ]);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, [mainCategory]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            LoadingService.show('Loading products...');

            const token = await AsyncStorage.getItem('authToken');
            const headers: any = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const params: any = {};
            
            if (mainCategory === "Trending") {
                params.isTrending = true;
            } else if (mainCategory === "New Arrival") {
                params.isNewArrival = true;
            } else {
                params.category = mainCategory;
            }

            // ✅ Add search text to params (only if not empty)
            if (searchText && searchText.trim()) {
                params.search = searchText.trim();
            }

            if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== '') {
                params.category = selectedCategory;
            }
            if (priceRange?.[0] && priceRange[0] > 0) params.minPrice = priceRange[0];
            if (priceRange?.[1] && priceRange[1] > 0) params.maxPrice = priceRange[1];

            const queryString = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join("&");

            const url = `${config.baseURL}api/products${queryString ? "?" + queryString : ""}`;

            console.log("CATEGORY API:", url);

            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            setProducts(data || []);
        } catch (err) {
            console.error(err);
            setProducts([]);
        } finally {
            setLoading(false);
            LoadingService.hide();
        }
    };

    // ✅ Manual search handler
    const handleSearch = () => {
        fetchProducts();
    };

    // ✅ Clear search handler
    const handleClearSearch = () => {
        setSearchText("");
        // Fetch products without search filter
        fetchProducts();
    };

    const renderPrice = (price, discount) => {
        const discountedPrice = price - (price * discount / 100);
        return (
            <View style={styles.priceContainer}>
                <Text style={styles.discountedPrice}>₹{discountedPrice?.toFixed(0)}</Text>
                <Text style={styles.originalPrice}>₹{price?.toFixed(0)}</Text>
            </View>
        );
    };

    const renderProductCard = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => redirectToProductDetails(item._id)}
            activeOpacity={0.8}
        >
            <View style={styles.imageWrapper}>
                <Image 
                    source={getImageSource(item)} 
                    style={styles.productImage} 
                />
                {item.discountPercent > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{item.discountPercent}% OFF</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.favoriteIcon}
                    onPress={() => addToFavorites(item._id)}
                >
                    <Ionicons name="heart-outline" size={22} color="#96252A" />
                </TouchableOpacity>
            </View>
            <View style={styles.productInfo}>
                <Text numberOfLines={1} style={styles.productTitle}>
                    {item.name}
                </Text>
                {renderPrice(item.price, item.discountPercent)}
                {item.rating !== undefined && item.rating > 0 && (
                    <View style={styles.ratingContainer}>
                        <Rating value={item.rating} />
                        <Text style={styles.ratingCount}>({Math.floor(Math.random() * 100) + 20})</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    // Render dynamic category tabs
    const renderCategoryTab = (tab: any) => {
        const isActive = selectedCategory === tab._id || (tab._id === '' && !selectedCategory);
        return (
            <TouchableOpacity
                key={tab._id || 'all'}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => {
                    setSelectedCategory(tab._id || '');
                    fetchProducts();
                }}
            >
                <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                    {tab.name}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading && products.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#96252A" />
                <Text style={styles.loadingText}>Loading products...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header with Back Button */}
                {/* <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#151515" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{getDisplayTitle()}</Text>
                    <View style={{ width: 24 }} />
                </View> */}

                {/* ✅ Search Bar with Manual Search Button */}
                <View style={styles.searchSection}>
                    <Ionicons name="search-outline" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch} // ✅ Search on keyboard enter
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={styles.searchButton} 
                        onPress={handleSearch}
                    >
                        <Text style={styles.searchButtonText}>Search</Text>
                    </TouchableOpacity>
                </View>

                {/* Dynamic Category Tabs */}
                <View style={styles.categoryTabsContainer}>
                    <FlatList
                        horizontal
                        data={categories}
                        renderItem={({ item }) => renderCategoryTab(item)}
                        keyExtractor={(item) => item._id || 'all'}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryTabsContent}
                    />
                </View>

                {/* Products Grid - Proper scrolling */}
                {products.length > 0 ? (
                    <FlatList
                        data={products}
                        keyExtractor={(item, index) => `${item._id}-${index}`}
                        numColumns={2}
                        columnWrapperStyle={styles.columnWrapper}
                        renderItem={renderProductCard}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.listContent}
                        style={styles.flatList}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={80} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No Products Found</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchText ? `No results for "${searchText}"` : "Try selecting a different category"}
                        </Text>
                        <TouchableOpacity style={styles.clearFilterBtn} onPress={() => {
                            setSelectedCategory("");
                            setPriceRange([0, 5000]);
                            setSearchText("");
                            fetchProducts();
                        }}>
                            <Text style={styles.clearFilterBtnText}>Clear Filters</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
        paddingHorizontal: 16,
    },
    flatList: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        backgroundColor: '#F8F8F8',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#151515',
    },
    // ✅ Search Bar Styles
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 8,
        marginTop:8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 10,
        paddingHorizontal: 8,
        color: '#151515',
    },
    searchButton: {
        backgroundColor: '#96252A',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 8,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    clearButton: {
        padding: 4,
    },
    categoryTabsContainer: {
        marginVertical: 8,
    },
    categoryTabsContent: {
        paddingHorizontal: 2,
    },
    categoryTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#F0F0F0',
    },
    categoryTabActive: {
        backgroundColor: '#96252A',
    },
    categoryTabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryTabTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    listContent: {
        paddingBottom: 80,
        paddingTop: 8,
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        width: (width - 48) / 2,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    imageWrapper: {
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: 170,
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#950C21',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    favoriteIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    productInfo: {
        padding: 10,
        paddingBottom: 12,
    },
    productTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    discountedPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000',
        marginRight: 6,
    },
    originalPrice: {
        fontSize: 12,
        color: '#888',
        textDecorationLine: 'line-through',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingCount: {
        fontSize: 11,
        color: '#999',
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#151515',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
    },
    clearFilterBtn: {
        marginTop: 20,
        backgroundColor: '#96252A',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    clearFilterBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});