import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

let toastRef;
export const AlertComponent = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'success', 'error', 'info'
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    toastRef = { show };
  }, []);

  const show = (msgType, msg) => {
    setType(msgType.toLowerCase());
    setMessage(msg);
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => hide(), 3000);
  };

  const hide = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, backgroundColor: getBackgroundColor(type) },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={hide}>
        <Text style={styles.change}>CHANGE</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Helper function to get color based on type
const getBackgroundColor = (type) => {
  switch (type) {
    case 'success':
      return '#4CAF50';
    case 'error':
      return '#F44336';
    case 'info':
    default:
      return '#333';
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    width: width - 40,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 9999,
  },
  message: {
    color: '#fff',
    fontSize: 16,
  },
  change: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
});

// Exported function to use anywhere
export const Toast = {
  show: (type, msg) => {
    toastRef?.show(type, msg);
  },
};