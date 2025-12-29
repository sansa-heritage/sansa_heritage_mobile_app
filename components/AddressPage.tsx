import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

import config from "../config/config";
import { Address } from "./models/address";
import { Toast } from "./screens/Toast";

export default function AddressScreen() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [form, setForm] = useState({
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        phone: "",
    });

    /* ================= FETCH ================= */

    const fetchAddresses = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken");
            const res = await fetch(`${config.baseURL}api/auth/addresses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setAddresses(json.addresses || []);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchSelectedAddress = async () => {
        const saved = await AsyncStorage.getItem("selectedAddress");
        if (saved) setSelectedAddress(JSON.parse(saved)._id);
    };

    useEffect(() => {
        fetchAddresses();
        fetchSelectedAddress();
    }, []);

    /* ================= SELECT ================= */

    const selectAddress = async (address: Address) => {
        setSelectedAddress(address._id);
        await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
    };

    /* ================= DELETE ================= */

    const deleteAddress = (id: string) => {
        Alert.alert("Delete address?", "This action cannot be undone", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const token = await AsyncStorage.getItem("authToken");
                    await fetch(`${config.baseURL}api/auth/addresses/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    fetchAddresses();
                    Toast.show("success", "Address removed");
                },
            },
        ]);
    };

    /* ================= SAVE ================= */

    const saveAddress = async () => {
        if (Object.values(form).some((v) => !v)) {
            return Toast.show("error", "All fields required");
        }

        const token = await AsyncStorage.getItem("authToken");

        const url = isEditMode
            ? `${config.baseURL}api/auth/addresses/${selectedAddress}`
            : `${config.baseURL}api/auth/addresses`;

        const method = isEditMode ? "PUT" : "POST";

        await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
        });

        setBottomSheetVisible(false);
        setForm({
            street: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
            phone: "",
        });
        fetchAddresses();
        Toast.show("success", isEditMode ? "Address Updated Successfully" : "Address Saved Successfully")
    };

    /* ================= RENDER ================= */

    const renderItem = ({ item }: { item: Address }) => {
        const active = selectedAddress === item._id;

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    active && styles.activeCard,
                ]}
                onPress={() => selectAddress(item)}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.street}>{item.street}</Text>

                    <View style={styles.iconRow}>
                        <TouchableOpacity
                            onPress={() => {
                                setIsEditMode(true);
                                setSelectedAddress(item._id);
                                setForm(item);
                                setBottomSheetVisible(true);
                            }}
                        >
                            <Ionicons name="create-outline" size={20} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => deleteAddress(item._id)}
                            style={{ marginLeft: 14 }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#777" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.text}>
                    {item.city}, {item.state}
                </Text>
                <Text style={styles.text}>
                    {item.country} - {item.zipCode}
                </Text>
                <Text style={styles.phone}>{item.phone}</Text>

                {active && (
                    <View style={styles.selectedTag}>
                        <Text style={styles.selectedText}>Delivering here</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    /* ================= UI ================= */

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Addresses</Text>

            <FlatList
                data={addresses}
                keyExtractor={(i) => i._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 120 }}
            />

            {/* ADD BUTTON */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                    setIsEditMode(false);
                    setForm({
                        street: "",
                        city: "",
                        state: "",
                        country: "",
                        zipCode: "",
                        phone: "",
                    });
                    setBottomSheetVisible(true);
                }}
            >
                <Text style={styles.addText}>+ Add New Address</Text>
            </TouchableOpacity>

            {/* BOTTOM SHEET */}
            <Modal visible={bottomSheetVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.sheetOverlay}
                >
                    <View style={styles.sheet}>
                        <View style={styles.dragHandle} />

                        <Text style={styles.sheetTitle}>
                            {isEditMode ? "Edit Address" : "Add New Address"}
                        </Text>

                        {/* STREET */}
                        <Text style={styles.label}>Street Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="House no, Building, Area"
                            value={form.street}
                            onChangeText={(t) => setForm({ ...form, street: t })}
                        />

                        {/* CITY + STATE */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>City</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="City"
                                    value={form.city}
                                    onChangeText={(t) => setForm({ ...form, city: t })}
                                />
                            </View>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.label}>State</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="State"
                                    value={form.state}
                                    onChangeText={(t) => setForm({ ...form, state: t })}
                                />
                            </View>
                        </View>

                        {/* COUNTRY + ZIP */}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Country</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Country"
                                    value={form.country}
                                    onChangeText={(t) => setForm({ ...form, country: t })}
                                />
                            </View>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.label}>ZIP Code</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="ZIP"
                                    maxLength={6}
                                    keyboardType="numeric"
                                    value={form.zipCode}
                                    onChangeText={(t) => setForm({ ...form, zipCode: t })}
                                />
                            </View>
                        </View>

                        {/* PHONE */}
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.phoneRow}>
                            <Text style={styles.countryCode}>+91</Text>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Mobile number"
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={form.phone}
                                onChangeText={(t) => setForm({ ...form, phone: t })}
                            />
                        </View>

                        {/* SAVE BUTTON */}
                        <TouchableOpacity style={styles.saveBtn} onPress={saveAddress}>
                            <Text style={styles.saveText}>
                                {isEditMode ? "Update Address" : "Save Address"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setBottomSheetVisible(false)}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f6f6f6", padding: 16 },

    header: { fontSize: 22, fontWeight: "700", marginBottom: 10 },

    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#eee",
        marginBottom: 14,
    },

    activeCard: {
        backgroundColor: "rgba(232, 169, 169, 0.04)",
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    street: { fontSize: 16, fontWeight: "700", flex: 1 },

    iconRow: { flexDirection: "row" },

    text: { color: "#555", marginTop: 4 },

    phone: { marginTop: 6, fontWeight: "600" },

    selectedTag: {
        marginTop: 10,
        alignSelf: "flex-start",
        backgroundColor: "#e8f5e9",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },

    selectedText: {
        color: "green",
        fontSize: 12,
        fontWeight: "600",
    },

    addButton: {
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: "#000",
        paddingVertical: 14,
        borderRadius: 12,
    },

    addText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 16,
        fontWeight: "700",
    },

    /* BOTTOM SHEET */

    sheetOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },

    sheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },

    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#ccc",
        alignSelf: "center",
        borderRadius: 2,
        marginBottom: 10,
    },

    sheetTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
    },

    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },

    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
        marginTop: 10,
    },

    row: {
        flexDirection: "row",
    },

    phoneRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    countryCode: {
        marginRight: 10,
        fontSize: 15,
        fontWeight: "600",
    },



    saveBtn: {
        backgroundColor: "#000",
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
    },

    saveText: {
        color: "#fff",
        fontWeight: "700",
        textAlign: "center",
        fontSize: 16,
    },

    cancelBtn: {
        marginTop: 14,
    },

    cancelText: {
        textAlign: "center",
        color: "#666",
        fontWeight: "600",
    },

});