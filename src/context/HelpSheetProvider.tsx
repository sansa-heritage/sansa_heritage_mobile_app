// src/context/HelpSheetProvider.tsx
import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { HelpSheetContext } from './HelpSheetContext';
import { snackbar } from '../components/common/Snackbar';
import { updateOrderContact } from '../api/orderApi'; // ✅ NEW

interface Row {
  key: string;
  label: string;
  icon: string;
}

// ✅ WhatsApp business number (country code + number, digits only, no '+' or spaces)
const WHATSAPP_NUMBER = '917008940240';

const HELP_ROWS: Row[] = [
  { key: 'phone', label: 'Change Phone Number', icon: 'call-outline' },
  {
    key: 'address',
    label: 'Change delivery address',
    icon: 'location-outline',
  },
  // { key: 'cancel', label: 'Cancel Order', icon: 'close-circle-outline' },
  // {
  //   key: 'reschedule',
  //   label: 'Reschedule Delivery',
  //   icon: 'time-outline',
  // },
  {
    key: 'chat',
    label: 'Chat with us',
    icon: 'chatbubble-ellipses-outline',
  },
];

export const HelpSheetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // ✅ Track the orderId passed to openHelpSheet
  const [orderId, setOrderId] = useState<string | undefined>(undefined);

  // ✅ Change-phone modal state
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);

  const openHelpSheet = useCallback((oid?: string) => {
    setOrderId(oid);
    setVisible(true);
  }, []);

  const closeHelpSheet = useCallback(() => {
    setVisible(false);
  }, []);

  // ✅ Open WhatsApp (native app with wa.me fallback)
  const openWhatsApp = async (oid?: string) => {
    const message = oid
      ? `Hi Sansa Heritage, I need help with my order ${oid}.`
      : `Hi Sansa Heritage, I need help with my order.`;

    const encoded = encodeURIComponent(message);

    const appUrl = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;
    const webUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) {
        await Linking.openURL(appUrl);
        return;
      }
      await Linking.openURL(webUrl);
    } catch (err) {
      try {
        await Linking.openURL(webUrl);
      } catch {
        snackbar.info(`Reach us on WhatsApp at +${WHATSAPP_NUMBER}`);
      }
    }
  };

  // ✅ Submit phone change to the backend
  const submitPhoneChange = async () => {
    const trimmed = phoneValue.trim();

    if (!trimmed || trimmed.length < 6) {
      snackbar.warning('Please enter a valid phone number');
      return;
    }
    if (!orderId) {
      snackbar.error('Order not found');
      return;
    }

    try {
      setPhoneSaving(true);
      const res = await updateOrderContact(orderId, trimmed);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to update phone number');
      }

      snackbar.success('Phone number updated successfully');
      setPhoneModalVisible(false);
      setPhoneValue('');
    } catch (err: any) {
      snackbar.error(err?.message || 'Failed to update phone number');
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleRow = (key: string) => {
    setVisible(false);

    switch (key) {
      case 'phone':
        // ✅ open the phone-change modal
        setPhoneValue('');
        setPhoneModalVisible(true);
        break;
      case 'address':
        navigation.navigate('AddressScreen' as never);
        break;
      case 'cancel':
        snackbar.info('Cancel Order — please contact support');
        break;
      case 'reschedule':
        snackbar.info('Reschedule Delivery — please contact support');
        break;
      case 'chat':
        openWhatsApp(orderId);
        break;
      default:
        break;
    }
  };

  return (
    <HelpSheetContext.Provider value={{ openHelpSheet, closeHelpSheet }}>
      {children}

      {/* ============ HELP SHEET ============ */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={closeHelpSheet}
      >
        <Pressable style={styles.overlay} onPress={closeHelpSheet}>
          <Pressable
            style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Need help?</Text>
              <TouchableOpacity
                onPress={closeHelpSheet}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color="#151515" />
              </TouchableOpacity>
            </View>

            {HELP_ROWS.map((row, idx) => (
              <TouchableOpacity
                key={row.key}
                style={[
                  styles.row,
                  idx === HELP_ROWS.length - 1 && styles.rowLast,
                ]}
                activeOpacity={0.7}
                onPress={() => handleRow(row.key)}
              >
                <Ionicons
                  name={row.icon as any}
                  size={22}
                  color="#151515"
                  style={styles.rowIcon}
                />
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#8A8A8A"
                />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ============ CHANGE PHONE MODAL ============ */}
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.phoneOverlay}
        >
          <Pressable
            style={styles.phoneOverlayPress}
            onPress={() => setPhoneModalVisible(false)}
          >
            <Pressable
              style={styles.phoneCard}
              onPress={e => e.stopPropagation()}
            >
              <Text style={styles.phoneTitle}>Change Phone Number</Text>
              <Text style={styles.phoneHint}>
                We'll update the phone number on your order.
              </Text>

              <Text style={styles.phoneInputLabel}>New phone number</Text>
              <TextInput
                style={styles.phoneInput}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor="#9AA0A6"
                value={phoneValue}
                onChangeText={setPhoneValue}
                maxLength={15}
                editable={!phoneSaving}
              />

              <View style={styles.phoneActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setPhoneModalVisible(false)}
                  disabled={phoneSaving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={submitPhoneChange}
                  disabled={phoneSaving}
                >
                  {phoneSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </HelpSheetContext.Provider>
  );
};

const styles = StyleSheet.create({
  /* Help sheet */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#151515' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { marginRight: 14 },
  rowLabel: { flex: 1, fontSize: 15, color: '#151515', fontWeight: '400' },

  /* Change Phone modal */
  phoneOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  phoneOverlayPress: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  phoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  phoneTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 6,
  },
  phoneHint: {
    fontSize: 13,
    color: '#7A7A7A',
    lineHeight: 18,
    marginBottom: 16,
  },
  phoneInputLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 6,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#151515',
    backgroundColor: '#FAFAFA',
  },
  phoneActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5D5D5',
  },
  cancelBtnText: { fontSize: 14, color: '#333', fontWeight: '600' },
  primaryBtn: {
    minWidth: 90,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#9E0E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, color: '#FFF', fontWeight: '700' },
});