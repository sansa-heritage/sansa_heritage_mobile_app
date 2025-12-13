import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserDetails, updateProfile } from "./apiHelper/apiService";
import { Toast } from "./screens/Toast";


const UpdateProfileScreen = () => {
    const [username, setUsername] = useState<any>(null);
    const [email, setEmail] = useState<any>(null);
    const [phone, setPhone] = useState<any>(null);

    useEffect(() => {

        loadUserData();
    }, []);

    const handleUpdate = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('authToken');
            if (!storedToken) {
                return Toast.show("error", "User not logged in");
            }
            const data = { username, email, phone };

            const res = await updateProfile(data);
            loadUserData()
            Toast.show("success", "Profile updated successfully");

        } catch (error: any) {
            console.log(error);
            Toast.show("error", error.response?.data?.message || "Something went wrong");
        }
    };

    const loadUserData = async () => {
        try {
            const userDetails = await getUserDetails();

            console.log("User JSON => ", JSON.stringify(userDetails, null, 2));

            setUsername(userDetails?.username || "Guest");
            setEmail(userDetails?.email);

        } catch (error) {
            console.log("Error ss fetching user:", error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Update Profile</Text>

            <TextInput
                placeholder="Enter Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#888"
            />

            <TextInput
                placeholder="Enter Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#888"

            />

            <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
                <Text style={styles.btnText}>Update</Text>
            </TouchableOpacity>
        </View>
    );
};

export default UpdateProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    heading: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#ccc",
        marginBottom: 12,
    },
    btn: {
        backgroundColor: "black",
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        alignItems: "center",
    },
    btnText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});
