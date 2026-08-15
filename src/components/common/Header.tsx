// import React, { useEffect } from "react";
// import { View, Image, TouchableOpacity, StyleSheet, Text } from "react-native";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import { navigationRef } from "../../services/NavigationService";

// const Header = ({ currentRoute }) => {
//   const isDashboard = currentRoute === "Dashboard";
//   useEffect(() => {
//     console.log(currentRoute);
    
// },[currentRoute])

//   return (
//     <View style={styles.header}>
//       {isDashboard ? (
//         <Image
//           source={require("../../../assets/images/logo.png")}
//           style={styles.logo}
//         />
//       ) : (
//         <View style={styles.leftRow}>
//           <TouchableOpacity onPress={() => navigationRef.goBack()}>
//             <MaterialIcons name="arrow-back" size={24} color="black" />
//           </TouchableOpacity>
//           <Text style={styles.pageTitle}>{currentRoute}</Text>
//         </View>
//       )}

//       <View style={{ flex: 1 }} />

//       <View style={styles.iconRow}>
//         <TouchableOpacity style={{ marginRight: 15 }}>
//           <MaterialIcons name="favorite-border" size={24} />
//         </TouchableOpacity>
//         <TouchableOpacity>
//           <MaterialIcons name="notifications-none" size={24} />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };


// const styles = StyleSheet.create({
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     backgroundColor: "#fff",
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 2 },
//     shadowRadius: 2,
//   },

//   leftRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },

//   pageTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#000",
//     marginLeft: 10,
//   },

//   logo: {
//     width: 100,
//     height: 40,
//     resizeMode: "contain",
//   },

//   iconRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
// });

import React, { useEffect } from "react";
import { 
  View, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../../models/types";
import { NotificationBadge } from "../NotificationBadge";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const Header = ({ currentRoute }) => {
  const navigation = useNavigation<NavigationProp>();
  const isDashboard = currentRoute === "Dashboard";
  
  useEffect(() => {
    console.log(currentRoute);
  }, [currentRoute]);

  const navigateToNotifications = () => {
    navigation.navigate('NotificationScreen');
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <View style={styles.header}>
        {isDashboard ? (
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.leftRow}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#151515" />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>
              {currentRoute?.replace(/([A-Z])/g, ' $1').trim() || ''}
            </Text>
          </View>
        )}

        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('FavoritesPage')}
          >
            <MaterialIcons name="favorite-border" size={24} color="#151515" />
          </TouchableOpacity>
          <NotificationBadge 
            size={24} 
            color="#151515"
            onPress={navigateToNotifications}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight || 0,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    // Remove border and shadow
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#151515",
    marginLeft: 4,
    textTransform: "capitalize",
  },
  logo: {
    width: 100,
    height: 36,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginRight: 16,
    padding: 4,
  },
});

export default Header;