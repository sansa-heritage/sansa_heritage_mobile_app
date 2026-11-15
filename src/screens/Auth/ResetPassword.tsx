import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { resetPassword } from '../../api/authApi';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';
// import { Toast } from '../../components/common/Toast';
import { snackbar } from '../../components/common/Snackbar';


const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  type ResetPasswordRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;
  const route = useRoute<ResetPasswordRouteProp>();
  const { email } = route.params;

  // const handleResetPassword = async () => {
  //   if (!password || !confirmPassword) {
  //     Toast.show('Error', 'Please enter and confirm your new password.');
  //     return;
  //   }
  //   if (password !== confirmPassword) {
  //     Toast.show('Error', 'Passwords do not match.');
  //     return;
  //   }
  //   if (password.length < 6) {
  //     Toast.show('Error', 'Password must be at least 6 characters long.');
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const res = await resetPassword(password, email?.toLowerCase());
  //     Alert.alert('Success', res.message, [
  //       { text: 'OK', onPress: () => navigation.replace('Login') },
  //     ]);
  //   } catch (err: any) {
  //     Toast.show('Error', err || 'Password reset failed.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      snackbar.warning("Please enter and confirm your new password", "Missing Fields");
      return;
    }
    if (password !== confirmPassword) {
      snackbar.error("Passwords do not match", "Error");
      return;
    }
    if (password.length < 6) {
      snackbar.warning("Password must be at least 6 characters long", "Too Short");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(password, email?.toLowerCase());

      snackbar.success(res.message || "Password updated successfully", "Success");

      // ✅ small delay so the snackbar is visible before navigating
      setTimeout(() => {
        navigation.replace('Login');
      }, 1200);
    } catch (err: any) {
      snackbar.error(err || 'Password reset failed', 'Error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Enter your password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="***************"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#bbb"
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Re-Enter your password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="***************"
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor="#bbb"
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowConfirm(!showConfirm)}
          >
            <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>

        <TouchableOpacity
          style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.signUpText}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  label: {
    marginBottom: 6,
    marginTop: 18,
    fontSize: 15,
    color: '#222',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 10,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 17,
    letterSpacing: 4,
    color: '#222',
  },
  eyeButton: { padding: 4 },
  eyeIcon: { fontSize: 18, color: '#bbb' },
  signUpButton: {
    marginTop: 34,
    backgroundColor: '#111',
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 15,
  },
  signUpButtonDisabled: { opacity: 0.6 },
  signUpText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});