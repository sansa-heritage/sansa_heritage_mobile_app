import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/config';
import { Address } from './models/address';
import Ionicons from "react-native-vector-icons/Ionicons";
import { Toast } from './screens/Toast';

export default function AddressScreen({ navigation }) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
    const [noAddressPopup, setNoAddressPopup] = useState(false);
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        phone: ''
    });

    const fetchAddresses = async () => {
        const token = await AsyncStorage.getItem('authToken');
        setLoading(true);

        try {
            const response = await fetch(`${config.baseURL}api/auth/addresses`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const json = await response.json();
            const list = json.addresses || [];

            setAddresses(list);

            // POPUP IF NO ADDRESS FOUND
            if (list.length === 0) {
                setNoAddressPopup(true);
            }
        } catch (err) {
            console.log('Error fetching addresses', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSelectedAddress = async () => {
        const saved = await AsyncStorage.getItem('selectedAddress');
        if (saved) {
            const parsed = JSON.parse(saved);
            setSelectedAddress(parsed._id);
        }
    };

    useEffect(() => {
        fetchAddresses();
        fetchSelectedAddress();
    }, []);

    const onSelectAddress = async (address) => {
        setSelectedAddress(address._id);
        await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
    };


    const goToAddAddress = () => {
        navigation.navigate("AddAddressScreen");
    };


    const goToEditAddress = (address) => {
        navigation.navigate("AddAddressScreen", { editData: address });
    };


    const saveAddress = async () => {
        const storedToken = await AsyncStorage.getItem("authToken");

        if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.country || !newAddress.zipCode || !newAddress.phone) {
            return Toast.show("Error", "All fields are required.");
        }

        try {
            const url = isEditMode
                ? `${config.baseURL}api/auth/addresses/${selectedAddress?._id}`
                : `${config.baseURL}api/auth/addresses`;

            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${storedToken}`,
                },
                body: JSON.stringify(newAddress),
            });

            if (response.ok) {
                await fetchAddresses();
                setAddressModalVisible(false);
                setNewAddress({
                    street: "",
                    city: "",
                    state: "",
                    country: "",
                    zipCode: "",
                    phone: "",
                });
            } else {
                Toast.show("Error", isEditMode ? "Update failed" : "Add failed");
            }
        } catch (err: any) {
            Toast.show("Error", err);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Addresses</Text>
            {addresses.length > 0 && (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.addressCard,
                                selectedAddress === item._id && styles.selectedCard,
                            ]}
                        >
                            <View style={styles.addressRow}>
                                <TouchableOpacity
                                    style={{ flex: 1 }}
                                    onPress={() => onSelectAddress(item)}
                                >
                                    <Text style={styles.title}>{item.street}</Text>
                                    <Text style={styles.text}>{item.street}</Text>
                                    <Text style={styles.text}>{item.city}, {item.state}</Text>
                                    <Text style={styles.text}>Phone: {item.phone}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setIsEditMode(true);
                                        setSelectedAddress(item);
                                        setNewAddress({
                                            street: item.street,
                                            city: item.city,
                                            state: item.state,
                                            country: item.country,
                                            zipCode: item.zipCode,
                                            phone: item.phone
                                        });
                                        setAddressModalVisible(true);
                                    }}
                                    style={styles.editButton}
                                >
                                    <Ionicons name="pencil" size={22} color="black" />
                                </TouchableOpacity>
                            </View>


                        </View>
                    )}
                />
            )}

            <TouchableOpacity style={styles.addButton} onPress={() => {
                setNewAddress({
                    street: "",
                    city: "",
                    state: "",
                    country: "",
                    zipCode: "",
                    phone: "",
                });
                setIsEditMode(false)
                setAddressModalVisible(true);
            }}>
                <Text style={styles.addButtonText}>Add New Address</Text>
            </TouchableOpacity>
            <Modal visible={addressModalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{isEditMode ? "Edit Address" : "Add Address"}</Text>

                        <Text style={styles.inputLabel}>Street</Text>
                        <TextInput style={styles.input} value={newAddress.street}
                            onChangeText={(t) => setNewAddress({ ...newAddress, street: t })} />

                        <Text style={styles.inputLabel}>City</Text>
                        <TextInput style={styles.input} value={newAddress.city}
                            onChangeText={(t) => setNewAddress({ ...newAddress, city: t })} />

                        <Text style={styles.inputLabel}>State</Text>
                        <TextInput style={styles.input} value={newAddress.state}
                            onChangeText={(t) => setNewAddress({ ...newAddress, state: t })} />

                        <Text style={styles.inputLabel}>Country</Text>
                        <TextInput style={styles.input} value={newAddress.country}
                            onChangeText={(t) => setNewAddress({ ...newAddress, country: t })} />

                        <Text style={styles.inputLabel}>Zip Code</Text>
                        <TextInput style={styles.input} keyboardType="numeric"
                            value={newAddress.zipCode}
                            onChangeText={(t) => setNewAddress({ ...newAddress, zipCode: t })} />

                        <Text style={styles.inputLabel}>Phone</Text>
                        <View style={styles.phoneRow}>
                            <Text style={styles.countryCode}>+91</Text>
                            <TextInput style={[styles.input, { flex: 1 }]} keyboardType="number-pad"
                                value={newAddress.phone}
                                onChangeText={(t) => setNewAddress({ ...newAddress, phone: t })} />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.actionButton} onPress={saveAddress}>
                                <Text style={styles.actionText}>{isEditMode ? "Update" : "Save"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={() => setAddressModalVisible(false)}>
                                <Text style={styles.actionText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={noAddressPopup} transparent animationType="fade">
                <View style={styles.popupContainer}>
                    <View style={styles.popup}>
                        <Text style={styles.popupTitle}>No Addresses Found</Text>
                        <Text style={styles.popupText}>
                            You don't have any saved addresses. Please add one.
                        </Text>

                        <TouchableOpacity
                            style={styles.popupButton}
                            onPress={() => {
                                setNoAddressPopup(false);
                                goToAddAddress();
                            }}
                        >
                            <Text style={styles.popupButtonText}>Add Address</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}


const styles = StyleSheet.create({
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        marginBottom: 12,
        backgroundColor: "#fff",
    },
    editButton: {
        padding: 8,
    },

    modalContainer: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 16,
    },

    modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        marginBottom: 16,
        textAlign: "center",
    },

    inputLabel: {
        fontSize: 14,
        color: "#000",
        fontWeight: "500",
        marginBottom: 4,
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        color: "#000",
        marginBottom: 12,
    },

    // Phone Input Row
    phoneRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },

    countryCode: {
        fontSize: 15,
        color: "#000",
        marginRight: 8,
        fontWeight: "600",
    },

    // Modal Buttons Row
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },

    actionButton: {
        flex: 1,
        backgroundColor: "#000",
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },

    actionText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 16,
        fontWeight: "600",
    },

    addAddressBtn: {
        backgroundColor: "#000",
        padding: 12,
        marginTop: 10,
        borderRadius: 8,
        alignItems: "center",
    },

    addAddressText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10,
        color: '#000',
    },
    addressCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        marginBottom: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedCard: {
        borderColor: '#000',
        backgroundColor: '#e8e8e8',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    text: {
        color: '#222',
        marginTop: 2,
    },

    editText: {
        color: '#000',
        fontWeight: '600',
    },
    addButton: {
        marginTop: 15,
        backgroundColor: '#000',
        padding: 14,
        borderRadius: 10,
        marginBottom: 50
    },
    addButtonText: {
        textAlign: 'center',
        color: '#fff',
        fontWeight: '700',
    },
    popupContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    popup: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 25,
    },
    popupTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    popupText: {
        marginTop: 10,
        color: '#333',
    },
    popupButton: {
        marginTop: 20,
        backgroundColor: '#000',
        padding: 12,
        borderRadius: 10,
    },
    popupButtonText: {
        textAlign: 'center',
        color: '#fff',
        fontWeight: '700',
    },
});
