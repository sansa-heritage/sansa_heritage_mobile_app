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
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Gentle breathing scale on the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.96,
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
          {/* Rotating maroon arc (outer ring) */}
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

          {/* Inner white circle with the Sansa logo */}
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

const SIZE = 78;            // outer loader diameter
const INNER = 60;           // inner white circle diameter
const BORDER = 3;           // arc thickness

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
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  // Rotating arc
  arcWrap: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  arc: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: BORDER,
    borderColor: '#F2E1C0',     // light cream full ring (background)
    borderTopColor: '#9E0E26',  // maroon arc on top (visible rotating segment)
    borderRightColor: '#9E0E26',
  },

  // Inner white circle holding the logo
  logoCircle: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  logo: {
    width: 38,
    height: 38,
  },
});

export default AnimatedLogoLoader;