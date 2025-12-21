import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

let toastRef: any;

export const AlertComponent = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('info');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    toastRef = { show };
  }, []);

  const show = (msgType: 'success' | 'error' | 'info', msg: string) => {
    setType(msgType);
    setMessage(msg);
    setVisible(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    setTimeout(hide, 3000);
  };

  const hide = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.left}>
        <Icon
          name={getIconName(type)}
          size={24}
          color={getIconColor(type)}
        />
        <Text style={styles.message}>{message}</Text>
      </View>

      <TouchableOpacity onPress={hide}>
        <Icon name="close" size={20} color="#aaa" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// 🔹 Icon mapping
const getIconName = (type: string) => {
  switch (type) {
    case 'success':
      return 'check-circle';
    case 'error':
      return 'error';
    case 'info':
    default:
      return 'warning';
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'success':
      return '#4CAF50'; // green
    case 'error':
      return '#F44336'; // red
    case 'info':
    default:
      return '#FFC107'; // yellow
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    width: width - 40,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#000', // 🖤 black toast
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    zIndex: 9999,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 15,
    flexShrink: 1,
  },
});

// 🌍 Global usage
export const Toast = {
  show: (type: 'success' | 'error' | 'info', msg: string) => {
    toastRef?.show(type, msg);
  },
};
