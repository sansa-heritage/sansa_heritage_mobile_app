import React, { useEffect } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Text } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { navigationRef, getCurrentRoute } from "../../components/apiHelper/NavigationService";

const Header = ({ currentRoute }) => {
  const isDashboard = currentRoute === "Dashboard";
  useEffect(() => {
    console.log(currentRoute);
    
},[currentRoute])

  return (
    <View style={styles.header}>
      {isDashboard ? (
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />
      ) : (
        <View style={styles.leftRow}>
          <TouchableOpacity onPress={() => navigationRef.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{currentRoute}</Text>
        </View>
      )}

      <View style={{ flex: 1 }} />

      <View style={styles.iconRow}>
        <TouchableOpacity style={{ marginRight: 15 }}>
          <MaterialIcons name="favorite-border" size={24} />
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialIcons name="notifications-none" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },

  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginLeft: 10,
  },

  logo: {
    width: 100,
    height: 40,
    resizeMode: "contain",
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default Header;
