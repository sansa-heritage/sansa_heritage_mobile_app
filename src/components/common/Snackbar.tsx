import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  Image,
  useWindowDimensions,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

/* ============================================================
   SNACKBAR — compact, auto-fit width, single-line, centered
   Location: src/components/common/Snackbar.tsx
   ============================================================ */

/* ---------- TYPES ---------- */
export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarMessage {
  id: string;
  type: SnackbarType;
  title?: string;
  message: string;
  duration?: number;
}

/* ---------- GLOBAL CONTROLLER ---------- */
let emit: ((msg: SnackbarMessage) => void) | null = null;

export const snackbar = {
  show(opts: {
    type?: SnackbarType;
    title?: string;
    message: string;
    duration?: number;
  }) {
    const msg: SnackbarMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: opts.type ?? 'info',
      title: opts.title,
      message: opts.message,
      duration: opts.duration ?? 3000,
    };
    if (emit) emit(msg);
    else console.warn('[snackbar] Not mounted yet');
  },
  success(message: string, title?: string) {
    snackbar.show({ type: 'success', message, title });
  },
  error(message: string, title?: string) {
    snackbar.show({ type: 'error', message, title, duration: 4000 });
  },
  warning(message: string, title?: string) {
    snackbar.show({ type: 'warning', message, title, duration: 3500 });
  },
  info(message: string, title?: string) {
    snackbar.show({ type: 'info', message, title });
  },
};

/* ---------- RESPONSIVE SCALE ---------- */
const BASE_WIDTH = 375;
const MAX_CONTENT_WIDTH = 420;

const makeScale = (w: number) => {
  const factor = Math.min(Math.max(w / BASE_WIDTH, 0.85), 1.3);
  return (n: number) => Math.round(n * factor);
};

/* ---------- COMPONENT ---------- */
const Snackbar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const s = makeScale(width);

  const maxWidth = Math.min(width - s(40), MAX_CONTENT_WIDTH);
  const minWidth = Math.min(width - s(80), s(220));

  const [queue, setQueue] = useState<SnackbarMessage[]>([]);
  const [current, setCurrent] = useState<SnackbarMessage | null>(null);

  const translateY = useRef(new Animated.Value(200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    emit = (msg) => setQueue((q) => [...q, msg]);
    return () => {
      emit = null;
    };
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
    }
  }, [queue, current]);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 200,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setCurrent(null));
  }, [translateY, opacity]);

  useEffect(() => {
    if (!current) return;

    translateY.setValue(200);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(hide, current.duration ?? 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, hide, translateY, opacity]);

  if (!current) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + s(14),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            borderRadius: s(8),
            paddingVertical: s(8),
            paddingHorizontal: s(10),
            minHeight: s(44),
            minWidth: minWidth,
            maxWidth: maxWidth,
          },
        ]}
      >
        {/* Circular logo */}
        <View
          style={{
            width: s(26),
            height: s(26),
            borderRadius: s(13),
            overflow: 'hidden',
            marginRight: s(8),
            backgroundColor: '#FDECEE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={require('../../../assets/images/icon.png')}
            style={{
              width: s(22),
              height: s(22),
            }}
            resizeMode="contain"
          />
        </View>

        {/* Message text — single line until it can't fit */}
        <View
          style={{
            flexShrink: 1,               // ✅ shrink instead of pushing
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {current.title ? (
            <Text
              style={[
                styles.title,
                { fontSize: s(13), lineHeight: s(16) },
              ]}
              numberOfLines={1}
            >
              {current.title}
            </Text>
          ) : null}
          <Text
            style={[
              styles.message,
              {
                fontSize: s(current.title ? 12 : 13),
                lineHeight: s(16),
              },
            ]}
            numberOfLines={2}            // ✅ 1 line preferred, up to 2 when needed
          >
            {current.message}
          </Text>
        </View>

        {/* Close button */}
        <TouchableOpacity
          onPress={hide}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            padding: s(3),
            marginLeft: s(6),
            alignSelf: 'center',
          }}
        >
          <Ionicons name="close" size={s(15)} color="#E5E5E5" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default Snackbar;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#212121',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 1,
  },
  message: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
});