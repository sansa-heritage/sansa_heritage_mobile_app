import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { registerWithGoogle } from '../../api/authApi';
import { authService } from '../../services/AuthService';
import { RootStackParamList } from '../../models/types';
import DeviceInfo from 'react-native-device-info';

// ✅ Configure Google Sign-In (No TypeScript errors)
GoogleSignin.configure({
  webClientId: '782904869146-0min0dn439lt2uprmv9q5qsnkfmdt3dv.apps.googleusercontent.com',
  iosClientId: '662462542419-f7bpa8ios3ji30b1svrljk7spc1oa72d.apps.googleusercontent.com',
  offlineAccess: false,
});

interface LoginProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
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

    const result = await GoogleSignin.signIn();

    if (!isSuccessResponse(result)) {
      throw new Error('Google Sign-In was cancelled');
    }

    const user = result.data.user;

    console.log('User:', user);

    const payload = {
      googleId: user.id,
      email: user.email,
      username: user.name,
    };

    const res = await registerWithGoogle(payload);

    if (res) {
      const token = res.token || res.idToken;
      const username = res.username || user.name;
      const email = res.email || user.email;
      const userId = res._id || '';

      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userID', userId],
        ['username', username],
        ['email', email],
      ]);

      await authService.login(token, username, email);

      onLoginSuccess();
    }
  } catch (error: any) {
    console.log(error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      Alert.alert('Cancelled', 'Google Sign-In was cancelled.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      Alert.alert('In Progress', 'Google Sign-In is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Error', 'Google Play Services are not available.');
    } else {
      Alert.alert('Login Failed', error.message);
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('All fields are required');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${config.baseURL}api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok || !data.token) {
        setError(data.message || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      const token = data.token;
      const username = data.username || '';
      const emailAddr = data.email || '';
      const userId = data._id || '';

      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userID', userId],
        ['username', username],
        ['email', emailAddr],
      ]);

      await authService.login(token, username, emailAddr);

      setError('');
      onLoginSuccess();

    } catch (error) {
      console.error('Error during login:', error);
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.brandLogo}
        source={require('../../../assets/images/logo.png')}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

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
          onPress={handleForgotPassword}
          style={styles.forgotWrapper}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Logging in...' : 'Log In'}
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
        Don’t have an account?{' '}
        <Text style={styles.signupLink} onPress={handleSignUp}>
          Sign Up
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
    width: 220,
    height: 45,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 30,
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
  forgotWrapper: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#151515',
    height: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
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

export default LoginPage;
