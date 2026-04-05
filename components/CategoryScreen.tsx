import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
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

export default function CategoryScreen({ route }) {
    const { mainCategory } = route.params;
    const [products, setProducts] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [priceRange, setPriceRange] = useState([0, 0]);
    const [distanceRange, setDistanceRange] = useState([0, 0]);
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
        }

        if (searchText) params.search = searchText;
        if (selectedCategory) params.category = selectedCategory;
        if (priceRange?.[0]) params.minPrice = priceRange[0];
        if (priceRange?.[1]) params.maxPrice = priceRange[1];

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
    const renderProductCard = (item) => (
        <TouchableOpacity
            style={styles.newArrivalItem}
            onPress={() => redirectToProductDetails(item._id)}
        >
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
            ) : (
                <Image source={require("../assets/images/logo.png")} style={styles.itemImage} />
            )}
            <TouchableOpacity
                style={styles.favoriteIcon}
                onPress={() => addToFavorites(item._id)}
            >
                <MaterialIcons name="favorite-border" size={24} color="red" />
            </TouchableOpacity>
            <View style={styles.itemContainer}>
                <Text style={styles.itemTitle}>
                    {item.name.length > 20 ? item.name.substring(0, 15) + "..." : item.name}
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

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#000" />
            ) : (


                <ScrollView>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={{ marginLeft: 10, fontSize: 20, fontWeight: "bold" }}>
                            {mainCategory === "newArrival" ? "New Arrival" : mainCategory === "trending" ? "Trending" : mainCategory}
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
                    {/* Products List */}
                    {products.length === 0 ? (
                        <Text style={styles.seeAllText}>No Records Found</Text>
                    ) : (
                        <FlatList
                            nestedScrollEnabled
                            data={products}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={2}
                            columnWrapperStyle={styles.columnWrapper}
                            renderItem={({ item }) => renderProductCard(item)}
                        />
                    )}
                </ScrollView>
            )}
            {/* Filter Modal */}
            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Filters</Text>

                        {/* Price Slider */}
                        <Text style={styles.filterSectionTitle}>Pricing</Text>
                        <View style={styles.sliderSection}>
                            <Text style={styles.sliderLabel}>${priceRange[0]}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={50}
                                maximumValue={200}
                                value={priceRange[0]}
                                onValueChange={(value) => setPriceRange([value, priceRange[1]])}
                                minimumTrackTintColor="#ff6f61"
                            />
                            <Text style={styles.sliderLabel}>${priceRange[1]}</Text>
                        </View>

                        {/* Distance Slider */}
                        <Text style={styles.filterSectionTitle}>Distance</Text>
                        <View style={styles.sliderSection}>
                            <Text style={styles.sliderLabel}>{distanceRange[0]}m</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={500}
                                maximumValue={2000}
                                value={distanceRange[0]}
                                onValueChange={(value) => setDistanceRange([value, distanceRange[1]])}
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