import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
} from 'react-native';
import eventBus from '../../services/eventBus';
import { LOADING_EVENTS } from '../../services/LoadingService';

const AnimatedLogoLoader: React.FC = () => {
  const [visible, setVisible] = useState(false);

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const onShow = () => {
      setVisible(true);
      startAnimations();
    };

    const onHide = () => {
      stopAnimations();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    };

    eventBus.on(LOADING_EVENTS.SHOW, onShow);
    eventBus.on(LOADING_EVENTS.HIDE, onHide);

    return () => {
      eventBus.off(LOADING_EVENTS.SHOW, onShow);
      eventBus.off(LOADING_EVENTS.HIDE, onHide);
      stopAnimations();
    };
  }, []);

  const startAnimations = () => {
    // Fade in overlay
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Continuous rotation of the maroon arc
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Gentle breathing scale on the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.97,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    rotateAnim.stopAnimation();
    scaleAnim.stopAnimation();
    fadeAnim.stopAnimation();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.loaderWrap}>
          {/* Rotating maroon arc — hugs the inner circle */}
          <Animated.View
            style={[
              styles.arcWrap,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={styles.arc} />
          </Animated.View>

          {/* Inner white circle with the Sansa logo — zoomed in */}
          <Animated.View
            style={[
              styles.logoCircle,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const ARC_THICKNESS = 3;           // spinner stroke width
const OUTER_SIZE = 50;             // overall loader size (smaller than before)
const INNER_SIZE = OUTER_SIZE - ARC_THICKNESS * 2 - 2;  // ~60px — logo circle
const LOGO_SIZE = INNER_SIZE - 10; // logo fits snug with a small padding

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 999 },
      ios: { zIndex: 999 },
    }),
  },
  loaderWrap: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  // Rotating arc — same size as outer, sits exactly at the edge
  arcWrap: {
    position: 'absolute',
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arc: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    borderWidth: ARC_THICKNESS,
    // White base ring (invisible against white bg, but gives contrast for the spinner)
    borderColor: '#FFFFFF',
    // Maroon arc — same as logo color
    borderTopColor: '#9E0E26',
    borderRightColor: '#9E0E26',
  },

  // Inner white circle holding the logo — smaller than outer to sit tight
  logoCircle: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});

export default AnimatedLogoLoader;