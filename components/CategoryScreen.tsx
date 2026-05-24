import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Dimensions,
    Modal,
    ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Slider from "@react-native-community/slider";
import Rating from "./screens/RatingStars";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from '@react-navigation/native';
import { addToFavoritesList } from "./apiHelper/apiService";
const { width } = Dimensions.get("window");
import { StyleSheet } from "react-native";
import { RootStackParamList } from "./models/types";

// Base URL for images
const BASE_URL = 'https://ecappbe-sanasaheritages-projects.vercel.app';

// Helper function to get image source
const getImageSource = (item: any) => {
    // Check images array first (API returns images array)
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        const image = item.images[0];
        if (image) {
            if (image.startsWith('data:image')) return { uri: image };
            if (image.startsWith('http')) return { uri: image };
            if (image.startsWith('/')) return { uri: `${BASE_URL}${image}` };
            return { uri: `${BASE_URL}/${image}` };
        }
    }
    // Fallback to single image field
    if (item.image) {
        if (item.image.startsWith('data:image')) return { uri: item.image };
        if (item.image.startsWith('http')) return { uri: item.image };
        if (item.image.startsWith('/')) return { uri: `${BASE_URL}${item.image}` };
        return { uri: `${BASE_URL}/${item.image}` };
    }
    // Default placeholder
    return require("../assets/images/logo.png");
};

export default function CategoryScreen({ route }) {
    const { mainCategory } = route.params;
    const [products, setProducts] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [distanceRange, setDistanceRange] = useState([500, 2000]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    
    function addToFavorites(_id: number | undefined) {
        addToFavoritesList(_id)
    }
    
    const handleSearchChange = (text: string) => setSearchText(text);
    
    const redirectToProductDetails = (id) => {
        navigation.navigate('ProductDetails', { itemId: id });
    };

    useEffect(() => {
        fetchProducts();
    }, [mainCategory, searchText, selectedCategory, priceRange, distanceRange]);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const params: any = {};
            if (mainCategory === "Trending") {
                params.isTrending = true;
            } else if (mainCategory === "New Arrival") {
                params.isNewArrival = true;
            } else if (mainCategory === "Sarees" || mainCategory === "Dress Materials" || 
                       mainCategory === "Kurta Sets" || mainCategory === "Dupattas") {
                params.category = mainCategory;
            }

            if (searchText) params.search = searchText;
            if (selectedCategory) params.category = selectedCategory;
            if (priceRange?.[0] && priceRange[0] > 0) params.minPrice = priceRange[0];
            if (priceRange?.[1] && priceRange[1] > 0) params.maxPrice = priceRange[1];

            const queryString = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join("&");

            const url = `https://ecappbe-sanasaheritages-projects.vercel.app/api/products${queryString ? "?" + queryString : ""}`;

            console.log("CATEGORY API:", url); 

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            setProducts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderPrice = (price, discount) => {
        const discountedPrice = price - (price * discount / 100);
        return (
            <View>
                <View style={styles.priceContainer}>
                    <Text style={styles.discountedPrice}>₹{discountedPrice?.toFixed(2)}</Text>
                    <Text style={styles.originalPrice}>₹{price?.toFixed(2)}</Text>
                </View>
                <Text style={styles.discountPercent}>{discount}% off</Text>
            </View>
        );
    };

    const renderProductCard = ({ item }) => (
        <TouchableOpacity
            style={styles.newArrivalItem}
            onPress={() => redirectToProductDetails(item._id)}
        >
            <Image 
                source={getImageSource(item)} 
                style={styles.itemImage} 
            />
            <TouchableOpacity
                style={styles.favoriteIcon}
                onPress={() => addToFavorites(item._id)}
            >
                <MaterialIcons name="favorite-border" size={24} color="red" />
            </TouchableOpacity>
            <View style={styles.itemContainer}>
                <Text style={styles.itemTitle}>
                    {item.name?.length > 20 ? item.name.substring(0, 15) + "..." : item.name}
                </Text>
                <Text style={styles.itemDescription}>
                    {item?.description?.length > 20
                        ? item?.description?.substring(0, 18) + "..."
                        : item?.description}
                </Text>
                {renderPrice(item.price, item.discountPercent)}
                {item.rating !== undefined && <Rating value={item.rating} />}
            </View>
        </TouchableOpacity>
    );

    const applyFilter = () => {
        setModalVisible(false);
        fetchProducts();
    };

    const clearFilters = () => {
        setSearchText("");
        setSelectedCategory("");
        setPriceRange([0, 5000]);
        setDistanceRange([500, 2000]);
        setModalVisible(false);
        fetchProducts();
    };

    // Header component for the FlatList
    const ListHeaderComponent = () => (
        <>
            {/* Header */}
            <View style={styles.header}>
                <Text style={{ marginLeft: 10, fontSize: 20, fontWeight: "bold" }}>
                    {mainCategory === "New Arrival" ? "New Arrival" : mainCategory === "Trending" ? "Trending" : mainCategory}
                </Text>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search items..."
                    value={searchText}
                    onChangeText={handleSearchChange}
                />
                <TouchableOpacity
                    style={styles.searchIconWrapper}
                    onPress={() => setModalVisible(true)}
                >
                    <MaterialIcons name="filter-list" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </>
    );

    // Empty component when no products
    const ListEmptyComponent = () => (
        <Text style={styles.seeAllText}>No Records Found</Text>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                keyExtractor={(item, index) => `${item._id}-${index}`}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                renderItem={renderProductCard}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={ListEmptyComponent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContentContainer}
            />

            {/* Filter Modal */}
            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={clearFilters}>
                                <Text style={styles.clearText}>Clear</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Filters</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        {/* Price Slider */}
                        <Text style={styles.filterSectionTitle}>Price Range</Text>
                        <View style={styles.priceHeader}>
                            <Text style={styles.priceText}>Min: ₹{priceRange[0]}</Text>
                            <Text style={styles.priceText}>Max: ₹{priceRange[1]}</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={10000}
                            value={priceRange[0]}
                            onValueChange={(value) => setPriceRange([Math.round(value), priceRange[1]])}
                            minimumTrackTintColor="#ff6f61"
                        />
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={10000}
                            value={priceRange[1]}
                            onValueChange={(value) => setPriceRange([priceRange[0], Math.round(value)])}
                            minimumTrackTintColor="#ff6f61"
                        />

                        {/* Distance Slider */}
                        <Text style={styles.filterSectionTitle}>Distance</Text>
                        <View style={styles.sliderSection}>
                            <Text style={styles.sliderLabel}>{distanceRange[0]}m</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={500}
                                maximumValue={2000}
                                value={distanceRange[0]}
                                onValueChange={(value) => setDistanceRange([Math.round(value), distanceRange[1]])}
                                minimumTrackTintColor="#ff6f61"
                            />
                            <Text style={styles.sliderLabel}>{distanceRange[1]}m</Text>
                        </View>

                        <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
                            <Text style={styles.applyButtonText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContentContainer: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    logo: {
        width: 100,
        height: 40,
        resizeMode: "contain",
    },
    titleSection: {
        marginVertical: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 16,
        color: "#777",
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 50,
        position: "relative",
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 5,
    },
    searchIconWrapper: {
        backgroundColor: '#151515',
        padding: 10,
        borderRadius: 10,
        marginLeft: 10,
    },
    categoriesSection: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginVertical: 10,
    },
    categoryCard: {
        backgroundColor: "#f8f8f8",
        padding: 10,
        margin: 5,
        borderRadius: 8,
        width: (width - 60) / 4,
        alignItems: "center",
    },
    categoryLabel: {
        fontSize: 12,
        textAlign: "center",
    },
    newArrivalSection: {
        marginVertical: 10,
    },
    newArrivalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    newArrivalTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    button: {
        padding: 5,
    },
    seeAllText: {
        color: "#ff6f61",
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 20,
    },
    columnWrapper: {
        justifyContent: "space-between",
    },
    newArrivalItem: {
        backgroundColor: "#fff",
        marginBottom: 10,
        width: (width - 40) / 2,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 0.5,
        borderColor: "#ddd",
    },
    itemImage: {
        width: "100%",
        height: 150,
        resizeMode: "cover",
    },
    favoriteIcon: {
        position: "absolute",
        top: 5,
        right: 5,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 2,
    },
    itemContainer: {
        padding: 8,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 2,
    },
    itemDescription: {
        fontSize: 12,
        color: "#555",
        marginBottom: 5,
    },
    addToCartButton: {
        backgroundColor: "#ff6f61",
        paddingVertical: 12,
        borderRadius: 8,
        marginVertical: 10,
        alignItems: "center",
    },
    addToCartButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
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
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: width - 40,
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    clearText: {
        color: "#ff6f61",
        fontWeight: "bold",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginVertical: 5,
    },
    priceHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    priceText: {
        fontSize: 14,
        color: "#666",
    },
    categoryFilter: {
        flexDirection: "row",
        marginBottom: 10,
    },
    categoryFilterButton: {
        backgroundColor: "#ff6f61",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    categoryFilterButtonInactive: {
        backgroundColor: "#eee",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    categoryFilterText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 12,
    },
    sliderSection: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sliderLabel: {
        fontSize: 12,
        width: 30,
        textAlign: "center",
    },
    slider: {
        flex: 1,
        marginHorizontal: 5,
    },
    applyButton: {
        backgroundColor: "#ff6f61",
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 15,
        alignItems: "center",
    },
    applyButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});