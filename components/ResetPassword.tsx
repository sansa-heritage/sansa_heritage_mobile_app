import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { resetPassword } from './apiHelper/apiService';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './models/types';
import { Toast } from './screens/Toast';


const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;
  const route = useRoute<ProductDetailsRouteProp>();
  const { email } = route.params;
  const [errorMsg, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false);
  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Toast.show("error", "Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      Toast.show("error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(password, email?.toLowerCase());
      Alert.alert("Success", res.message, [
        {
          text: "OK",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (err: any) {
      const errorMessage =
       err || err.response?.data?.message || 'Something went wrong';
      Toast.show("error", errorMessage);
      console.log(err);
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter your password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="***************"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁"}</Text>
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
        />
        <Pressable
          style={styles.eyeButton}
          onPress={() => setShowConfirm(!showConfirm)}
        >
          <Text style={styles.eyeIcon}>{showConfirm ? "🙈" : "👁"}</Text>
        </Pressable>
      </View>
      <View>
        {errorMsg &&
          <Text style={styles.error}>{errorMsg}</Text>
        }
      </View>
      <TouchableOpacity style={styles.signUpButton} onPress={handleResetPassword}>
        <Text style={styles.signUpText}>Reset Password</Text>
      </TouchableOpacity>
      {loading && (
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.3)"
        }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

    </View>
  );
}

// Styles based on the visual
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 40,
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
    marginBottom: 4,
    paddingHorizontal: 10,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 17,
    letterSpacing: 4,
    color: '#222',
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
    color: '#bbb',
  },
  error: {
    color: 'red',
    padding: 10
  },
  signUpButton: {
    marginTop: 34,
    backgroundColor: '#111',
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 15,
  },
  signUpText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default ResetPassword;