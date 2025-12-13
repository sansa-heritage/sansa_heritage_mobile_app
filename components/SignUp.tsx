import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { StackActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios'
import config from '../config/config'
import { registerWithGoogle } from './apiHelper/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { RootStackParamList } from './models/types';
import { Toast } from './screens/Toast';
const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [username, serUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [errorMsg, setError] = useState<string | null>(null)
  const [secureText, setSecureText] = useState(true);

  const onSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const userInfo = await GoogleSignin.getCurrentUser();
      let payload = {
        googleId: userInfo?.user.id,
        email: userInfo?.user.email,
        username: userInfo?.user.name
      }

      const res = await registerWithGoogle(payload);
      if (res) {
        console.log(res);
        await AsyncStorage.setItem('authToken', res?.token);
        await AsyncStorage.setItem('userID', res?._id);
        await AsyncStorage.setItem('username', res?.username || '');
        await AsyncStorage.setItem('email', res?.email || '');
        navigation.dispatch(StackActions.replace('Dashboard'));
        
      }
    } catch (error: any) {
      console.log('Google Sign-in Error:', error);
      Alert.alert('Login Failed', error.message);
    }
  };
  const handleSignUp = async () => {
    try {
      const response = await axios.post(`${config.baseURL}api/auth/register`, {
        email,
        password,
        username
      });

      if (response.status === 201) {
        Toast.show('Success', 'You have successfully signed up!');
        setError('');
        navigation.navigate('Login');
      }
    } catch (error: any) {
      console.error("SIGNUP ERROR:", error.response?.data);
      if (error.response) {
        const message = error.response.data.message || "Signup failed";
        setError(message);
        Toast.show("Error", message);
      } else {
        setError("Network error. Please try again.");
        Toast.show("Error", "Network error.");
      }
    }
  };


  const redirectToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Image style={styles.brandLogo} source={require('../assets/images/Sansa_1.svg')} />
      <Text style={styles.title}>Sign up</Text>
      <View style={styles.inputContainer}>
        <FontAwesome name="user" size={24} color="#151515" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={username}
          onChangeText={serUsername}
          keyboardType="default"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />
      </View>
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
      <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
        <Text style={styles.loginButtonText}>Sign up</Text>
      </TouchableOpacity>
      <Text style={styles.orText}>---------------  Or  --------------</Text>
      {/* <View>
        <TouchableOpacity style={styles.socialButton} onPress={onSignIn}>
          <MaterialCommunityIcons name="google" size={24} color="#d1c7c7ff" />
        </TouchableOpacity>
      </View> */}
      <TouchableOpacity style={styles.socialButton} onPress={onSignIn}>
        <Image
          source={require('../assets/images/Google.png')}
          style={[styles.socialIcon, { width: 20, height: 20 }]}
        />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
      <Text style={styles.signupText} onPress={redirectToLogin}>
        Already have an account? <Text style={styles.signupLink}>Log in</Text>
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
  error: {
    color: 'red',
    padding: 10
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
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingLeft: 40,
    paddingRight: 10,
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
  eyeIcon: {
    position: 'absolute',
    right: 10,
    zIndex: 1,
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
  socialIcon: {
    marginRight: 10,
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
    marginBottom: 20,
    height: 70,
    width: 100,
  },
});

export default SignUpPage;
