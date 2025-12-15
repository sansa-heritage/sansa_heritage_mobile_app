import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { navigationRef } from "../../components/apiHelper/NavigationService";

interface HeaderProps {
  currentRoute: string;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ currentRoute, title }) => {
  const isDashboard = currentRoute === "Dashboard";

  return (
    <View style={styles.header}>
      {/* LEFT SECTION */}
      {isDashboard ? (
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />
      ) : (
        <View style={styles.leftRow}>
          <TouchableOpacity
            onPress={() => navigationRef.canGoBack() && navigationRef.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.pageTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}

      {/* FLEX SPACER */}
      <View style={{ flex: 1 }} />

      {/* RIGHT ICONS (ONLY DASHBOARD) */}
      {isDashboard && (
        <View style={styles.iconRow}>
          <TouchableOpacity style={{ marginRight: 15 }}>
            <MaterialIcons name="favorite-border" size={24} />
          </TouchableOpacity>

          <TouchableOpacity>
            <MaterialIcons name="notifications-none" size={24} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Header;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 14,
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
    maxWidth: "80%",
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
