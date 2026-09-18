import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // ============ HANGER ICON ANIMATIONS ============
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconTranslateY = useRef(new Animated.Value(-80)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;

  // ============ GLOW HALO (behind icon) ============
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.6)).current;

  // ============ TEXT LOGO ANIMATIONS ============
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const textScale = useRef(new Animated.Value(0.7)).current;
  const textSkew = useRef(new Animated.Value(0)).current;

  // ============ GLOBAL FADE FOR EXIT ============
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // ============================================
    // STAGE 0 — Halo blooms in
    // ============================================
    Animated.parallel([
      Animated.timing(haloOpacity, {
        toValue: 0.35,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(haloScale, {
        toValue: 1.15,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    // ============================================
    // STAGE 1 — Icon drops in
    // ============================================
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 4,
        tension: 55,
        useNativeDriver: true,
      }),
      Animated.timing(iconTranslateY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(iconRotate, {
          toValue: 0,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ============================================
    // STAGE 1.5 — Icon gentle float
    // ============================================
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloat, {
          toValue: -6,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconFloat, {
          toValue: 6,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ============================================
    // STAGE 2 — Text logo slides in
    // ============================================
    Animated.sequence([
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.spring(textScale, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(textSkew, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(textSkew, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // ============================================
    // STAGE 3 — Exit
    // ============================================
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(exitScale, {
          toValue: 1.08,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, 2600);

    return () => clearTimeout(timer);
  }, [
    onFinish,
    iconOpacity,
    iconScale,
    iconTranslateY,
    iconRotate,
    iconFloat,
    haloOpacity,
    haloScale,
    textOpacity,
    textTranslateY,
    textScale,
    textSkew,
    containerOpacity,
    exitScale,
  ]);

  // ============ INTERPOLATIONS ============
  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-12deg"],
  });

  const textSkewTransform = textSkew.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-6deg"],
  });

  const combinedIconTranslateY = Animated.add(iconTranslateY, iconFloat);

  // Halo size (larger than icon so it acts as a glow behind it)
  const HALO_SIZE = width * 0.55;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ scale: exitScale }],
        },
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      {/* ============ ICON + HALO TOGETHER ============ */}
      <Animated.View
        style={[
          styles.iconWrap,
          {
            opacity: iconOpacity,
            transform: [
              { translateY: combinedIconTranslateY },
              { scale: iconScale },
              { rotate: iconRotation },
            ],
          },
        ]}
      >
        {/* ✅ Halo centered inside iconWrap — always behind icon */}
        <Animated.View
          style={[
            styles.halo,
            {
              width: HALO_SIZE,
              height: HALO_SIZE,
              borderRadius: HALO_SIZE / 2,
              marginLeft: -HALO_SIZE / 2,
              marginTop: -HALO_SIZE / 2,
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />

        <Image
          source={require("../../../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* ============ TEXT LOGO ============ */}
      <Animated.View
        style={[
          styles.textWrap,
          {
            opacity: textOpacity,
            transform: [
              { translateY: textTranslateY },
              { scale: textScale },
              { skewX: textSkewTransform },
            ],
          },
        ]}
      >
        <Image
          source={require("../../../assets/images/logo-text.png")}
          style={styles.textLogo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  // Icon wrapper — relative so halo can anchor to it
  iconWrap: {
    width: width * 0.34,
    height: width * 0.34,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  // ✅ Halo — absolutely centered on the icon
  // Dimensions are set dynamically in JSX (width/height/marginTop/marginLeft)
  halo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    backgroundColor: "#FFF0F3",
  },

  icon: {
    width: "100%",
    height: "100%",
  },

  // Text logo
  textWrap: {
    marginTop: 32,
    width: width * 0.5,
    height: width * 0.13,
    justifyContent: "center",
    alignItems: "center",
  },
  textLogo: {
    width: "100%",
    height: "100%",
  },
});