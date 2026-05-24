import React, { FunctionComponent } from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

interface Props {
  onFinish: (param: boolean) => void;
}

const SplashScreen: FunctionComponent<Props> = ({ onFinish }) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/lottie-animation.json")}
        autoPlay
        loop={false}
        resizeMode="cover"
        onAnimationFinish={() => onFinish(true)}
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animation: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default SplashScreen;