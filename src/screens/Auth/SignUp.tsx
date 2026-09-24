import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { StackActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import config from '../../config/config';
import { registerWithGoogle } from '../../api/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { RootStackParamList } from '../../models/types';
import { snackbar } from '../../components/common/Snackbar';
import DeviceInfo from 'react-native-device-info';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [errorMsg, setError] = useState<string | null>(null);
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const appVersion = DeviceInfo.getVersion();

  const onSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();

      const userInfo = await GoogleSignin.getCurrentUser();
      const payload = {
        googleId: userInfo?.user.id,
        email: userInfo?.user.email,
        username: userInfo?.user.name,
      };

      const res = await registerWithGoogle(payload);
      if (res) {
        console.log(res);
        await AsyncStorage.setItem('authToken', res?.token);
        await AsyncStorage.setItem('userID', res?._id);
        await AsyncStorage.setItem('username', res?.username || '');
        await AsyncStorage.setItem('email', res?.email || '');

        snackbar.success('Account created successfully');
        navigation.dispatch(StackActions.replace('Dashboard'));
      }
    } catch (error: any) {
      console.log('Google Sign-in Error:', error);
      snackbar.error(error.message || 'Google Sign-In failed', 'Login Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (isLoading) return;

    if (!username || !email || !password) {
      setError('All fields are required');
      snackbar.warning('Please fill all fields', 'Missing Fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${config.baseURL}api/auth/register`, {
        email,
        password,
        username,
      });

      if (response.status === 201) {
        setError('');
        snackbar.success('You have successfully signed up!');
        navigation.navigate('Login');
      }
    } catch (error: any) {
      console.error('SIGNUP ERROR:', error.response?.data);
      if (error.response) {
        const message = error.response.data.message || 'Signup failed';
        setError(message);
        snackbar.error(message, 'Signup Failed');
      } else {
        setError('Network error. Please try again.');
        snackbar.error('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.brandLogo}
        source={require('../../../assets/images/SANSA-final-logo.png')}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Create Account ✨</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        {/* Name */}
        <View style={styles.inputWrapper}>
          <FontAwesome name="user" size={18} color="#777" />
          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            placeholderTextColor="#999"
          />
        </View>

        {/* Email */}
        <View style={styles.inputWrapper}>
          <FontAwesome name="envelope" size={18} color="#777" />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="lock-outline" size={18} color="#777" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={secureText}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <MaterialCommunityIcons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#777"
            />
          </TouchableOpacity>
        </View>

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={onSignIn}
          disabled={isLoading}
        >
          <Image
            source={require('../../../assets/images/Google.png')}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.signupText}>
        Already have an account?{' '}
        <Text style={styles.signupLink} onPress={redirectToLogin}>
          Log in
        </Text>
      </Text>

      <Text style={styles.versionText}>Version {appVersion}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  brandLogo: {
    width: 310,
    height: 130,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(149, 12, 33, 0.12)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
    height: 50,
    backgroundColor: '#FAFAFA',
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    color: '#000',
    fontSize: 15,
  },
  error: {
    color: '#E53935',
    fontSize: 13,
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#151515',
    height: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#888',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 30,
    height: 50,
    backgroundColor: '#fff',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  signupText: {
    textAlign: 'center',
    marginTop: 25,
    fontSize: 14,
    color: '#555',
  },
  signupLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default SignUpPage;