import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    TextInput,
    ScrollView,
    SafeAreaView,
    Alert,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/config';
import { Address } from '../../models/address';
import Ionicons from "react-native-vector-icons/Ionicons";
import { Toast } from '../../components/common/Toast';
import LoadingService from '../../services/LoadingService';

const { width } = Dimensions.get('window');

export default function AddressScreen({ navigation }) {
    const flatListRef = useRef<FlatList>(null);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
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
        LoadingService.show('Loading addresses...');   // ✅ ADDED

        try {
            const response = await fetch(`${config.baseURL}api/auth/addresses`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const json = await response.json();
            const list = json.addresses || [];
            setAddresses(list);

            const saved = await AsyncStorage.getItem('selectedAddress');
            if (saved) {
                const parsed = JSON.parse(saved);
                setSelectedAddress(parsed._id);
            } else if (list.length > 0) {
                const defaultAddr = list.find(addr => addr.isDefault) || list[0];
                setSelectedAddress(defaultAddr._id);
                await AsyncStorage.setItem("selectedAddress", JSON.stringify(defaultAddr));
            }
        } catch (err) {
            console.log('Error fetching addresses', err);
            Toast.show('error', 'Failed to load addresses');
        } finally {
            setLoading(false);
            LoadingService.hide();                      // ✅ ADDED
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const onSelectAddress = async (address: Address) => {
        setSelectedAddress(address._id);
        await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
        Toast.show('success', 'Address selected');
    };

    const openAddModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setNewAddress({
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
            phone: ''
        });
        setAddressModalVisible(true);
    };

    const openEditModal = (address: Address) => {
        setIsEditMode(true);
        setEditingId(address._id);
        setNewAddress({
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            country: address.country || '',
            zipCode: address.zipCode || '',
            phone: address.phone || ''
        });
        setAddressModalVisible(true);
    };

    const validateAddress = () => {
        const { street, city, state, country, zipCode, phone } = newAddress;
        if (!street.trim()) return 'Street address is required';
        if (!city.trim()) return 'City is required';
        if (!state.trim()) return 'State is required';
        if (!country.trim()) return 'Country is required';
        if (!zipCode.trim()) return 'Zip code is required';
        if (zipCode.length < 5) return 'Please enter a valid zip code (minimum 5 digits)';
        if (phone && phone.trim()) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone.trim())) {
                return 'Please enter a valid 10-digit phone number';
            }
        }
        return null;
    };

    const saveAddress = async () => {
        const validationError = validateAddress();
        if (validationError) {
            Toast.show('error', validationError);
            return;
        }

        LoadingService.show(isEditMode ? 'Updating address...' : 'Adding address...');

        try {
            const storedToken = await AsyncStorage.getItem("authToken");
            if (!storedToken) {
                Toast.show('error', 'Please login again');
                LoadingService.hide();
                return;
            }

            const addressData: any = {
                street: newAddress.street.trim(),
                city: newAddress.city.trim(),
                state: newAddress.state.trim(),
                country: newAddress.country.trim(),
                zipCode: newAddress.zipCode.trim(),
                isDefault: addresses.length === 0
            };

            if (newAddress.phone && newAddress.phone.trim()) {
                addressData.phone = newAddress.phone.trim();
            }

            const url = isEditMode && editingId
                ? `${config.baseURL}api/auth/addresses/${editingId}`
                : `${config.baseURL}api/auth/addresses`;

            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${storedToken}`,
                },
                body: JSON.stringify(addressData),
            });

            const data = await response.json();

            if (response.ok) {
                Toast.show('success', isEditMode ? 'Address updated successfully' : 'Address added successfully');
                setAddressModalVisible(false);
                await fetchAddresses();
                setNewAddress({
                    street: '',
                    city: '',
                    state: '',
                    country: '',
                    zipCode: '',
                    phone: ''
                });
            } else {
                Toast.show('error', data.message || (isEditMode ? 'Update failed' : 'Add failed'));
            }

        } catch (err: any) {
            console.error('Save address error:', err);
            Toast.show('error', err.message || 'Something went wrong');
        } finally {
            LoadingService.hide();
        }
    };

    const deleteAddress = (addressId: string) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        LoadingService.show('Deleting address...');
                        try {
                            const storedToken = await AsyncStorage.getItem("authToken");
                            const response = await fetch(`${config.baseURL}api/auth/addresses/${addressId}`, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${storedToken}`,
                                },
                            });

                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }

                            Toast.show('success', 'Address deleted successfully');
                            await fetchAddresses();
                        } catch (err) {
                            console.error('Delete error:', err);
                            Toast.show('error', 'Failed to delete address');
                        } finally {
                            LoadingService.hide();
                        }
                    }
                }
            ]
        );
    };

    const setDefaultAddress = async (addressId: string) => {
        LoadingService.show('Setting as default...');
        try {
            const storedToken = await AsyncStorage.getItem("authToken");
            const response = await fetch(`${config.baseURL}api/auth/addresses/${addressId}/default`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${storedToken}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            Toast.show('success', 'Default address updated');
            await fetchAddresses();
        } catch (err: any) {
            console.error('Set default error:', err);
            Toast.show('error', err.message || 'Failed to set default address');
        } finally {
            LoadingService.hide();
        }
    };

    const renderAddressItem = ({ item }: { item: Address }) => {
        const isSelected = selectedAddress === item._id;

        return (
            <TouchableOpacity
                style={[styles.addressCard, isSelected && styles.selectedCard]}
                onPress={() => onSelectAddress(item)}
                activeOpacity={0.85}
            >
                {/* Top row: name + badges */}
                <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardName}>Delivery Address</Text>
                        {item.isDefault && (
                            <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                            </View>
                        )}
                    </View>

                    {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#96252A" />
                    )}
                </View>

                {/* Address lines */}
                <Text style={styles.addressLine} numberOfLines={2}>
                    {item.street}
                </Text>
                <Text style={styles.addressLine}>
                    {item.city}, {item.state} - {item.zipCode}
                </Text>
                <Text style={styles.addressLine}>
                    {item.country}
                </Text>
                {item.phone ? (
                    <Text style={styles.phoneLine}>Phone: {item.phone}</Text>
                ) : null}

                {/* Actions row */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        onPress={() => openEditModal(item)}
                        style={styles.actionLink}
                    >
                        <Ionicons name="create-outline" size={14} color="#96252A" />
                        {/* <Text style={styles.actionLinkText}>EDIT</Text> */}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => deleteAddress(item._id)}
                        style={styles.actionLink}
                    >
                        <Ionicons name="trash-outline" size={14} color="#96252A" />
                        {/* <Text style={styles.actionLinkText}>DELETE</Text> */}
                    </TouchableOpacity>

                    {!item.isDefault && (
                        <TouchableOpacity
                            onPress={() => setDefaultAddress(item._id)}
                            style={styles.actionLink}
                        >
                            <Ionicons name="star-outline" size={14} color="#96252A" />
                            {/* <Text style={styles.actionLinkText}>SET DEFAULT</Text> */}
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // ✅ Removed inline ActivityIndicator — global AnimatedLogoLoader handles it
    if (loading) {
        return <View style={styles.loadingContainer} />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* HEADER */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle}>Saved Addresses</Text>
                        <View style={styles.addressCount}>
                            <Text style={styles.addressCountText}>{addresses.length}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                        <Ionicons name="add" size={18} color="#96252A" />
                        <Text style={styles.addButtonText}>ADD NEW</Text>
                    </TouchableOpacity>
                </View>

                {addresses.length > 0 ? (
                    <FlatList
                        ref={flatListRef}
                        data={addresses}
                        keyExtractor={(item) => item._id}
                        renderItem={renderAddressItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        getItemLayout={(data, index) => ({
                            length: 220,
                            offset: 220 * index,
                            index,
                        })}
                        onScrollToIndexFailed={(info) => {
                            const wait = new Promise(resolve => setTimeout(resolve, 500));
                            wait.then(() => {
                                flatListRef.current?.scrollToIndex({
                                    index: info.index,
                                    animated: true
                                });
                            });
                        }}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="location-outline" size={60} color="#D1D5DB" />
                        </View>
                        <Text style={styles.emptyTitle}>No Addresses Saved</Text>
                        <Text style={styles.emptySubtitle}>
                            Add your first address to make checkout faster and easier
                        </Text>
                        <TouchableOpacity style={styles.emptyAddButton} onPress={openAddModal}>
                            <Text style={styles.emptyAddButtonText}>ADD NEW ADDRESS</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ADD / EDIT MODAL */}
                <Modal
                    visible={addressModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setAddressModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {isEditMode ? 'Edit Address' : 'Add New Address'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setAddressModalVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Street Address *</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="home-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter street address"
                                            placeholderTextColor="#9CA3AF"
                                            value={newAddress.street}
                                            onChangeText={(t) => setNewAddress({ ...newAddress, street: t })}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>City *</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="business-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter city"
                                            placeholderTextColor="#9CA3AF"
                                            value={newAddress.city}
                                            onChangeText={(t) => setNewAddress({ ...newAddress, city: t })}
                                        />
                                    </View>
                                </View>

                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.inputLabel}>State *</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="map-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="State"
                                                placeholderTextColor="#9CA3AF"
                                                value={newAddress.state}
                                                onChangeText={(t) => setNewAddress({ ...newAddress, state: t })}
                                            />
                                        </View>
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <Text style={styles.inputLabel}>Zip Code *</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Zip Code"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="numeric"
                                                value={newAddress.zipCode}
                                                onChangeText={(t) => setNewAddress({ ...newAddress, zipCode: t })}
                                                maxLength={6}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Country *</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="globe-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter country"
                                            placeholderTextColor="#9CA3AF"
                                            value={newAddress.country}
                                            onChangeText={(t) => setNewAddress({ ...newAddress, country: t })}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <Text style={styles.inputHelper}>Optional — Enter 10-digit number</Text>
                                    <View style={styles.phoneWrapper}>
                                        <View style={styles.countryCodeContainer}>
                                            <Text style={styles.countryCode}>+91</Text>
                                        </View>
                                        <View style={[styles.inputWrapper, { flex: 1 }]}>
                                            <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                            <TextInput
                                                style={[styles.input, { borderWidth: 0, paddingLeft: 0 }]}
                                                placeholder="Enter phone number"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="phone-pad"
                                                value={newAddress.phone}
                                                onChangeText={(t) => setNewAddress({ ...newAddress, phone: t })}
                                                maxLength={10}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.cancelButton]}
                                        onPress={() => setAddressModalVisible(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.saveButton]}
                                        onPress={saveAddress}
                                    >
                                        <Text style={styles.saveButtonText}>
                                            {isEditMode ? 'Update' : 'Save Address'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

/* ==================== STYLES ==================== */
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },

    // ================= HEADER =================
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: 0.2,
    },
    addressCount: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 1,
        borderRadius: 10,
    },
    addressCountText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#96252A',
    },
    addButtonText: {
        color: '#96252A',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // ================= LIST =================
    listContent: {
        paddingBottom: 20,
    },

    // ================= CARD (AJIO/MYNTRA STYLE) =================
    addressCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedCard: {
        borderColor: '#96252A',
        borderWidth: 1.5,
        backgroundColor: '#FFFBFB',
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    defaultBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    defaultBadgeText: {
        color: '#16A34A',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    addressLine: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 19,
        marginBottom: 1,
    },
    phoneLine: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionLinkText: {
        fontSize: 11,
        color: '#96252A',
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // ================= EMPTY STATE =================
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 19,
    },
    emptyAddButton: {
        marginTop: 24,
        backgroundColor: '#96252A',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
    },
    emptyAddButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 0.5,
    },

    // ================= MODAL =================
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    closeButton: {
        padding: 4,
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 6,
    },
    inputHelper: {
        fontSize: 11,
        color: '#94A3B8',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    phoneWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    countryCodeContainer: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    countryCode: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: '#96252A',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    },
});