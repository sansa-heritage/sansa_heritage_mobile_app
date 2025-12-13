import React from "react";
import { View, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";


interface RatingProps {
  value: number;  // rating value (e.g., 3.5)
  max?: number;   // default 5 stars
  size?: number;  // icon size
}

const Rating: React.FC<RatingProps> = ({ value, max = 5, size = 20 }) => {
  const stars: JSX.Element[] = [];

for (let i = 1; i <= 5; i++) {
  let iconName: "star" | "star-half" | "star-border" = "star-border";

  if (i <= value) {
    iconName = "star";
  } else if (i - value < 1) {
    iconName = "star-half";
  }

  stars.push(
    <MaterialIcons
      key={i}
      name={iconName}
      size={size}
      color="#FFD700"
    />
  );
}

return <View style={{ flexDirection: "row" }}>{stars}</View>;
  return <View style={styles.container}>{stars}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
});

export default Rating;
