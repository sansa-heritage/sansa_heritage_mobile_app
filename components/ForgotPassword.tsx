import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { sendOtp, verifyOtp } from "./apiHelper/apiService";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./models/types";
import { Toast } from "./screens/Toast";


const ForgotVerifyOtp = () => {
  const [step, setStep] = useState<"forgot" | "verify">("forgot");
  const [mail, setGmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleGetOtp = async () => {
    if (!mail) return Toast.show("Error", "Please enter your mail Id");
    setLoading(true);
    try {
      await sendOtp(mail);
      setStep("verify");
      setLoading(false);
      startTimer();
    } catch (err: any) {
      setLoading(false);
      Toast.show("Error", err);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return Toast.show("Error", "Please enter OTP");
    setLoading(true);
    try {
      const res = await verifyOtp(mail, otp);
      setLoading(false);
      Alert.alert("Success", res.message);
      // Redirect to reset password or login
      navigation.navigate('ResetPassword', { email: mail });
    } catch (err: any) {
      setLoading(false);
      Toast.show("Error", err);
    }
  };

  const startTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = () => {
    handleGetOtp();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.innerContainer}>

        {step === "forgot" ? <Image
          source={require("../assets/images/forgotpassword.png")}
          style={styles.image}
          resizeMode="contain"
        /> : <Image
          source={require("../assets/images/enter-otp.png")}
          style={styles.image}
          resizeMode="contain"
        />}
        

        <Text style={styles.title}>
          {step === "forgot" ? "Forgot Password?" : "Enter OTP"}
        </Text>
        {step === "forgot" ? (
          <>
            <Text style={styles.subText}>
              Enter your Email Id associated with your account
            </Text>
            <TextInput
              placeholder="example@gmail.com"
              style={styles.input}
              value={mail}
              onChangeText={setGmail}
              placeholderTextColor="#888"

            />
            <TouchableOpacity style={styles.button} onPress={handleGetOtp}>
              <Text style={styles.buttonText}>{loading ? "Sending..." : "Get OTP"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subText}>
              An OTP has been sent to {mail}
            </Text>
            <TextInput
              placeholder="Enter OTP"
              style={styles.input}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
              <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={timer > 0}
              onPress={handleResend}
              style={{ marginTop: 10 }}
            >
              <Text style={[styles.resendText, timer > 0 && { opacity: 0.5 }]}>
                Resend OTP {timer > 0 ? `(${timer})` : ""}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ForgotVerifyOtp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  innerContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resendText: {
    color: "#000",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
