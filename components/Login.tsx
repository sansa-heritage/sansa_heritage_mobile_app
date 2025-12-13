import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Button, Alert } from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { StackActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { registerWithGoogle } from './apiHelper/apiService';
import { authService } from './apiHelper/AuthService';
import { RootStackParamList } from './models/types';

GoogleSignin.configure({
  webClientId:
    '147593176805-qsl4i8ctc9uejohoqhgdcio8spi1b4nt.apps.googleusercontent.com',
  iosClientId:
    '662462542419-f7bpa8ios3ji30b1svrljk7spc1oa72d.apps.googleusercontent.com',
  offlineAccess: false,
});
// 147593176805-tsuet5qaqe17d5hs9melpcal39gbs6km.apps.googleusercontent.com - android
// 147593176805-qsl4i8ctc9uejohoqhgdcio8spi1b4nt.apps.googleusercontent.com - web
interface LoginProps {
  onLoginSuccess: () => void;
  navigation: any;
}
const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [errorMsg, setError] = useState<string | null>(null)
  const [secureText, setSecureText] = useState(true);

  const onSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const userInfo = await GoogleSignin.getCurrentUser();
      console.log('User Info:', userInfo);

      if (!userInfo) throw new Error("Google login failed");

      const payload = {
        googleId: userInfo.user.id,
        email: userInfo.user.email,
        username: userInfo.user.name,
      };

      const res = await registerWithGoogle(payload);
      if (res) {
        console.log("Google login response:", res);

        const token = res?.token || res?.idToken;
        const username = res?.username || userInfo.user.name;
        const email = res?.email || userInfo.user.email;
        const userId = res?._id || '';

        // Store all required info in AsyncStorage
        await AsyncStorage.multiSet([
          ['authToken', token],
          ['userID', userId],
          ['username', username],
          ['email', email],
        ]);

        // Optional: store in authService if needed
        await authService.login(token, username, email);

        // Navigate after storage
        onLoginSuccess();
        navigation.dispatch(StackActions.replace('Dashboard'));
      }
    } catch (error: any) {
      console.log('Google Sign-in Error:', error);
      Alert.alert('Login Failed', error.message || 'Unknown error');
    }
  };

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        setError("All fields are required");
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
        return;
      }

      // Save all required info
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

      // Optional: store in authService
      await authService.login(token, username, emailAddr);

      setError('');
      onLoginSuccess();
      navigation.dispatch(StackActions.replace('Dashboard'));

    } catch (error) {
      console.error('Error during login:', error);
      setError('Invalid credentials');
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
      <Image style={styles.brandLogo} source={require('../assets/images/logo.png')} />
      <Text style={styles.title}>Log in</Text>

      <View style={styles.inputContainer}>
        <FontAwesome name="envelope" size={24} color="#151515" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock" size={24} color="#151515" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry={secureText}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#888"
        />

        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setSecureText(!secureText)}
        >
          <MaterialCommunityIcons
            name={secureText ? "eye-off" : "eye"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      <View>
        {errorMsg &&
          <Text style={styles.error}>{errorMsg}</Text>
        }
      </View>
      <View style={{ alignItems: 'flex-end', marginBottom: 10 }}>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={{ color: '#007AFF', fontWeight: '500' }}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log in</Text>
      </TouchableOpacity>
      <Text style={styles.orText}>--------------- Or --------------</Text>
      <TouchableOpacity style={styles.socialButton} onPress={onSignIn}>
        <Image
          source={require('../assets/images/Google.png')}   
          style={[styles.socialIcon, { width: 20, height: 20 }]}
        />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
      <Text style={styles.signupText} onPress={handleSignUp}>
        Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: 10,
    zIndex: 1,

  },
  socialIcon: {
    marginRight: 10,
  },
  error: {
    color: 'red',
    padding: 10
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingLeft: 40,
    paddingRight: 40,
    borderRadius: 10,
    color: '#000',
  },
  loginButton: {
  backgroundColor: '#151515',
  paddingVertical: 15,    
  paddingHorizontal: 15,  
  borderRadius: 30,
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
},
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    marginTop: 20,
    marginBottom: 10,
  },
  socialButton: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 30,
  paddingVertical: 15,     
  paddingHorizontal: 15,
  backgroundColor: "#fff",
  justifyContent: "center",
  width: '100%',
  gap: 10,
},
  buttonText: {
    fontSize: 16,
    color: "#151515",
    fontWeight: "500",
    marginRight: 40
  },
  signupText: {
    marginTop: 20,
  },
  signupLink: {
    color: 'blue',
    textDecorationLine: 'none',
  },
  brandLogo: {
    width: 300,
    height: 50,
    resizeMode: "contain",
    marginBottom: 20,
  },
});

export default LoginPage;
