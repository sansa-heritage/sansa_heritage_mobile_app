import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    TextInput,
    Alert,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useRoute } from '@react-navigation/native';
import { addToFavoritesList, removeFromFavoritesList } from "../../api/favoriteApi";
import { addToCart } from "../../api/cartApi";
import { RootStackParamList } from "../../models/types";
import LoadingService from '../../services/LoadingService';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import eventBus from '../../services/eventBus';

const { width } = Dimensions.get("window");
const BASE_URL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app';

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
    const { mainCategory, displayTitle } = route.params as { mainCategory: string; displayTitle?: string };

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const [favorites, setFavorites] = useState<string[]>([]);

    const getDisplayTitle = () => {
        if (displayTitle) return displayTitle;
        if (mainCategory === "New Arrival") return "New Arrivals";
        if (mainCategory === "Trending") return "Trending Now";
        return mainCategory;
    };

    useEffect(() => {
        navigation.setParams({ displayTitle: getDisplayTitle() });
    }, [displayTitle, mainCategory]);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem('favorites');
            if (stored) setFavorites(JSON.parse(stored));
        } catch (err) {
            console.error('Error loading favorites:', err);
        }
    };

    const toggleFavorite = async (id: string) => {
        try {
            const isAlreadyFav = favorites.includes(id);

            if (isAlreadyFav) {
                await removeFromFavoritesList(id);
                const updated = favorites.filter(fav => fav !== id);
                setFavorites(updated);
                await AsyncStorage.setItem('favorites', JSON.stringify(updated));
            } else {
                await addToFavoritesList(id);
                const updated = [...favorites, id];
                setFavorites(updated);
                await AsyncStorage.setItem('favorites', JSON.stringify(updated));
            }

            eventBus.emit('ITEM_REMOVED', { id: 123 });
            eventBus.emit('FAVORITE_UPDATED', {});
        } catch (err) {
            console.error('Error toggling favorite:', err);
            Alert.alert('Error', 'Failed to update wishlist. Please try again.');
        }
    };

    const handleAddToCart = async (item: any) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert('Login Required', 'Please login to add items to cart.');
                return;
            }

            LoadingService.show('Adding to cart...');

            const colorValue = item.colors?.[0]?._id || item.colors?.[0]?.name || null;
            const sizeValue = item.sizes?.[0]?._id || item.sizes?.[0]?.label || null;

            await addToCart(item._id, 1, colorValue, sizeValue);

            Alert.alert('Success', 'Item added to cart successfully!');
            eventBus.emit('CART_UPDATED', {});
            eventBus.emit('ITEM_REMOVED', { id: 123 });
        } catch (error: any) {
            console.error('Add to cart error:', error);
            Alert.alert('Error', error?.message || 'Failed to add item to cart.');
        } finally {
            LoadingService.hide();
        }
    };

    const redirectToProductDetails = (id: string) => {
        navigation.navigate('ProductDetails', { itemId: id });
    };

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

    const fetchProducts = async () => {
        try {
            setLoading(true);
            LoadingService.show('Loading products...');

            const token = await AsyncStorage.getItem('authToken');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const params: any = {};
            if (mainCategory === "Trending") params.isTrending = true;
            else if (mainCategory === "New Arrival") params.isNewArrival = true;
            else params.category = mainCategory;

            if (searchText && searchText.trim()) params.search = searchText.trim();
            if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== '') {
                params.category = selectedCategory;
            }

            const queryString = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join("&");

            const url = `${config.baseURL}api/products${queryString ? "?" + queryString : ""}`;

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

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, [mainCategory]);

    const handleSearchSubmit = () => fetchProducts();

    const handleClearSearch = () => {
        setSearchText("");
        fetchProducts();
    };

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

    /* ============================================
       PRODUCT CARD — same Add pill as FavoriteScreen
       ============================================ */
    const renderProductCard = ({ item }: { item: any }) => {
        const isFav = favorites.includes(item._id);

        const originalPrice = Number(item.price || 0);
        const discountPercent = Number(item.discountPercent || 0);
        const discountedPrice =
            discountPercent > 0
                ? originalPrice - (originalPrice * discountPercent) / 100
                : originalPrice;

        const rating = Number(item.rating || 0);
        const ratingCount = Number(item.reviewCount || item.reviews || 0);
        const outOfStock = item.stock === 0;

        return (
            <TouchableOpacity
                style={styles.productCard}
                onPress={() => redirectToProductDetails(item._id)}
                activeOpacity={0.85}
            >
                {discountPercent >= 20 && (
                    <View style={styles.megaDropRow}>
                        <View style={styles.megaDropBadge}>
                            <Text style={styles.megaDropText}>Mega Price Drop</Text>
                        </View>
                    </View>
                )}

                <View style={styles.imageWrapper}>
                    <Image source={getImageSource(item)} style={styles.productImage} />

                    {/* Out-of-stock overlay */}
                    {outOfStock && (
                        <>
                            <View style={styles.oosOverlay} />
                            <View style={styles.oosBadge}>
                                <Text style={styles.oosBadgeText}>OUT OF STOCK</Text>
                            </View>
                        </>
                    )}

                    {/* ❤️ Wishlist — floating top-right (same white+black outline style) */}
                    <TouchableOpacity
                        style={styles.favoriteIcon}
                        onPress={() => toggleFavorite(item._id)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons
                            name="favorite"
                            size={22}
                            style={
                                isFav
                                    ? { color: '#E9445A' }
                                    : {
                                        color: '#FFFFFF',
                                        textShadowColor: '#000',
                                        textShadowOffset: { width: 0, height: 0 },
                                        textShadowRadius: 2,
                                    }
                            }
                        />
                    </TouchableOpacity>

                    {/* Rating pill — bottom-left */}
                    {rating > 0 && (
                        <View style={styles.ratingPill}>
                            <Text style={styles.ratingPillText}>{rating.toFixed(1)}</Text>
                            <MaterialIcons name="star" size={10} color="#1F9E4C" />
                            {ratingCount > 0 && (
                                <>
                                    <View style={styles.ratingDivider} />
                                    <Text style={styles.ratingCount}>
                                        {ratingCount > 999
                                            ? `${Math.floor(ratingCount / 1000)}k`
                                            : ratingCount}
                                    </Text>
                                </>
                            )}
                        </View>
                    )}

                    {/* ✅ Add / Similar pill — bottom-right, same as FavoriteScreen */}
                    <TouchableOpacity
                        style={styles.addPill}
                        activeOpacity={0.85}
                        onPress={() => {
                            if (outOfStock) {
                                redirectToProductDetails(item._id);
                            } else {
                                handleAddToCart(item);
                            }
                        }}
                    >
                        <Ionicons
                            name={outOfStock ? 'repeat-outline' : 'bag-add-outline'}
                            size={16}
                            color="#E9445A"
                        />
                        <Text style={styles.addPillText}>
                            {outOfStock ? 'Similar' : 'Add'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.productInfo}>
                    <Text numberOfLines={1} style={styles.productTitle}>
                        {item.name}
                    </Text>

                    {discountPercent >= 20 && (
                        <View style={styles.megaDropInline}>
                            <Text style={styles.megaDropInlineText}>Mega Price Drop</Text>
                        </View>
                    )}

                    <View style={styles.priceRow}>
                        <Text style={styles.strikePrice}>₹{originalPrice}</Text>
                        <Text style={styles.finalPrice}>₹{discountedPrice.toFixed(0)}</Text>
                        {discountPercent > 0 && (
                            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && products.length === 0) {
        return <View style={styles.loadingContainer} />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.searchSection}>
                    <Ionicons name="search-outline" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                        returnKeyType="search"
                        onSubmitEditing={handleSearchSubmit}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

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
                            {searchText
                                ? `No results for "${searchText}"`
                                : "Try selecting a different category"}
                        </Text>
                        <TouchableOpacity
                            style={styles.clearFilterBtn}
                            onPress={() => {
                                setSelectedCategory("");
                                setSearchText("");
                                fetchProducts();
                            }}
                        >
                            <Text style={styles.clearFilterBtnText}>Clear Filters</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F8F8' },
    container: { flex: 1, backgroundColor: '#F8F8F8', paddingHorizontal: 16 },
    flatList: { flex: 1 },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#fff',
    },

    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 8,
        marginTop: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 10,
        paddingHorizontal: 8,
        color: '#151515',
    },
    clearButton: { padding: 4 },

    categoryTabsContainer: { marginVertical: 8 },
    categoryTabsContent: { paddingHorizontal: 2 },
    categoryTab: {
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderRadius: 10,
        marginRight: 5,
        backgroundColor: '#0C0C0C',
        minWidth: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryTabActive: { backgroundColor: '#96252A' },
    categoryTabText: { fontSize: 10, color: '#fff', fontWeight: '500' },
    categoryTabTextActive: { color: '#fff', fontWeight: '600' },

    columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 2 },
    listContent: { paddingBottom: 80, paddingTop: 8 },

    productCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 18,
        width: (width - 48) / 2,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },

    megaDropRow: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingHorizontal: 2,
    },
    megaDropBadge: {
        backgroundColor: '#E9445A',
        borderRadius: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    megaDropText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },

    imageWrapper: { position: 'relative' },
    productImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        resizeMode: 'cover',
    },

    /* Out-of-stock overlay */
    oosOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.55)',
    },
    oosBadge: {
        position: 'absolute',
        top: '46%',
        left: 0,
        right: 0,
        backgroundColor: 'rgba(90,110,120,0.65)',
        paddingVertical: 6,
        alignItems: 'center',
    },
    oosBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.8,
    },

    /* ❤️ Wishlist — floating top-right, no bg */
    favoriteIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 2,
    },

    ratingPill: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 3,
        gap: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    ratingPillText: {
        color: '#111',
        fontSize: 11,
        fontWeight: '700',
    },
    ratingDivider: {
        width: 1,
        height: 10,
        backgroundColor: '#D0D0D0',
        marginHorizontal: 2,
    },
    ratingCount: {
        color: '#666',
        fontSize: 11,
        fontWeight: '500',
    },

    /* ✅ Add / Similar pill — bottom-right, same as FavoriteScreen */
    addPill: {
        position: 'absolute',
        bottom: -14,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.2,
        borderColor: '#E9445A',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        zIndex: 2,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    addPillText: {
        color: '#E9445A',
        fontSize: 13,
        fontWeight: '700',
    },

    productInfo: {
        paddingTop: 20,
        paddingHorizontal: 8,
        paddingBottom: 10,
    },
    productTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
        marginBottom: 6,
    },

    megaDropInline: {
        alignSelf: 'flex-start',
        backgroundColor: '#FCEBED',
        borderRadius: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginBottom: 6,
    },
    megaDropInlineText: {
        color: '#E9445A',
        fontSize: 10,
        fontWeight: '700',
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    strikePrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    finalPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111',
    },
    discountText: {
        fontSize: 13,
        color: '#F58220',
        fontWeight: '700',
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
    clearFilterBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});