import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import eventBus from '../../services/eventBus';
import { LOADING_EVENTS } from '../../services/LoadingService';

const { width } = Dimensions.get('window');

interface LoadingState {
  visible: boolean;
}

const AnimatedLogoLoader: React.FC = () => {
  const [visible, setVisible] = useState(false);
  
  // Simple animations
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
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Simple rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Gentle breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 800,
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
        <View style={styles.container}>
          {/* Logo with rotation and breathing */}
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                transform: [{ rotate: spin }, { scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require('../../../assets/images/Loader-Logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 999,
      },
      ios: {
        zIndex: 999,
      },
    }),
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 90,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
  },
});

export default AnimatedLogoLoader;