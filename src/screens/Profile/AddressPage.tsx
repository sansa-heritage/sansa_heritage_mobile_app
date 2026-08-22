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
    ActivityIndicator,
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

            console.log('Saving address:', addressData);

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
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Ionicons name="location-outline" size={20} color="#96252A" />
                        <Text style={styles.streetText} numberOfLines={1}>{item.street}</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                        {item.isDefault && (
                            <View style={styles.defaultBadge}>
                                <Ionicons name="star" size={12} color="#16A34A" />
                                <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                        )}
                        {isSelected && !item.isDefault && (
                            <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>Selected</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.detailRow}>
                        <Ionicons name="business-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{item.city}, {item.state}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="globe-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{item.country} - {item.zipCode}</Text>
                    </View>
                    {item.phone && (
                        <View style={styles.detailRow}>
                            <Ionicons name="call-outline" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>{item.phone}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.actionButtons}>
                        {!item.isDefault && (
                            <TouchableOpacity
                                onPress={() => setDefaultAddress(item._id)}
                                style={[styles.actionBtn, styles.setDefaultBtn]}
                            >
                                <Ionicons name="star-outline" size={16} color="#F59E0B" />
                                <Text style={styles.setDefaultText}>Set Default</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => openEditModal(item)}
                            style={styles.actionBtn}
                        >
                            <Ionicons name="pencil-outline" size={20} color="#96252A" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => deleteAddress(item._id)}
                            style={styles.actionBtn}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#96252A" />
                <Text style={styles.loadingText}>Loading addresses...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeft}>
                        <Ionicons name="location" size={24} color="#96252A" />
                        <Text style={styles.headerTitle}>My Addresses</Text>
                        <View style={styles.addressCount}>
                            <Text style={styles.addressCountText}>{addresses.length}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                        <Ionicons name="add-circle" size={24} color="#96252A" />
                        <Text style={styles.addButtonText}>Add New</Text>
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
                            <Ionicons name="location-outline" size={80} color="#D1D5DB" />
                        </View>
                        <Text style={styles.emptyTitle}>No Addresses Saved</Text>
                        <Text style={styles.emptySubtitle}>
                            Add your first address to make checkout faster and easier
                        </Text>
                        <TouchableOpacity style={styles.emptyAddButton} onPress={openAddModal}>
                            <Text style={styles.emptyAddButtonText}>Add New Address</Text>
                        </TouchableOpacity>
                    </View>
                )}

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
                                        <Ionicons name="home-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                                        <Ionicons name="business-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                                            <Ionicons name="map-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                                            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                                        <Ionicons name="globe-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                                    <Text style={styles.inputHelper}>Optional - Enter 10-digit number</Text>
                                    <View style={styles.phoneWrapper}>
                                        <View style={styles.countryCodeContainer}>
                                            <Text style={styles.countryCode}>+91</Text>
                                        </View>
                                        <View style={[styles.inputWrapper, { flex: 1 }]}>
                                            <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
    },
    addressCount: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
    },
    addressCountText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#96252A',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 20,
    },
    addressCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    selectedCard: {
        borderColor: '#96252A',
        borderWidth: 2,
        backgroundColor: '#FEF2F2',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    streetText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        flex: 1,
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    defaultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#86EFAC',
        gap: 4,
    },
    defaultBadgeText: {
        color: '#16A34A',
        fontSize: 10,
        fontWeight: '600',
    },
    selectedBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    selectedBadgeText: {
        color: '#D97706',
        fontSize: 10,
        fontWeight: '600',
    },
    cardBody: {
        marginBottom: 10,
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#4B5563',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    actionBtn: {
        padding: 4,
    },
    setDefaultBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    setDefaultText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0F172A',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
    },
    emptyAddButton: {
        marginTop: 24,
        backgroundColor: '#96252A',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
    },
    emptyAddButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    closeButton: {
        padding: 4,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0F172A',
        marginBottom: 6,
    },
    inputHelper: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
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
        paddingVertical: 12,
        borderRadius: 10,
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
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
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
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#96252A',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});