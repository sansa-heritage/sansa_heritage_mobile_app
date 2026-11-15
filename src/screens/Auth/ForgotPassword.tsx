import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  // Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { sendOtp, verifyOtp } from "../../api/authApi";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../models/types";
// import { Toast } from "../../components/common/Toast";
import { snackbar } from "../../components/common/Snackbar";


const ForgotVerifyOtp = () => {
  const [step, setStep] = useState<"forgot" | "verify">("forgot");
  const [mail, setGmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGetOtp = async () => {
    if (!mail.trim()) {
      // Toast.show("Error", "Please enter your email ID");
      snackbar.warning("Please enter your email ID", "Missing Field");

      return;
    }
    setLoading(true);
    try {
      await sendOtp(mail.trim());
      setStep("verify");
      startTimer();
      snackbar.success("OTP sent successfully", "Check your inbox");

    } catch (err: any) {
      // Toast.show("Error", err || "Failed to send OTP");
      snackbar.error(err || "Failed to send OTP", "Error");

    } finally {
      setLoading(false);
    }
  };

  // const handleVerifyOtp = async () => {
  //   if (!otp.trim()) {
  //     // Toast.show("Error", "Please enter OTP");
  //         snackbar.warning("Please enter the OTP", "Missing Field");

  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     const res = await verifyOtp(mail.trim(), otp.trim());
  //     Alert.alert("Success", res.message, [
  //       {
  //         text: "OK",
  //         onPress: () =>
  //           navigation.navigate("ResetPassword", { email: mail.trim() }),
  //       },
  //     ]);
  //   } catch (err: any) {
  //     Toast.show("Error", err || "Invalid OTP");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      snackbar.warning("Please enter the OTP", "Missing Field");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(mail.trim(), otp.trim());

      snackbar.success(res.message || "OTP verified successfully", "Success");

      // ✅ small delay so the snackbar is visible before navigating
      setTimeout(() => {
        navigation.navigate("ResetPassword", { email: mail.trim() });
      }, 800);
    } catch (err: any) {
      snackbar.error(err || "Invalid OTP", "Verification Failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          <Image
            source={
              step === "forgot"
                ? require("../../../assets/images/forgotpassword.png")
                : require("../../../assets/images/enter-otp.png")
            }
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            {step === "forgot" ? "Forgot Password?" : "Enter OTP"}
          </Text>

          {step === "forgot" ? (
            <>
              <Text style={styles.subText}>
                Enter your Email ID associated with your account
              </Text>

              <TextInput
                placeholder="example@gmail.com"
                style={styles.input}
                value={mail}
                onChangeText={setGmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#888"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleGetOtp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending..." : "Get OTP"}
                </Text>
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
                placeholderTextColor="#888"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Verifying..." : "Verify"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={timer > 0 || loading}
                onPress={handleGetOtp}
                style={{ marginTop: 14 }}
              >
                <Text
                  style={[styles.resendText, (timer > 0 || loading) && { opacity: 0.5 }]}
                >
                  Resend OTP {timer > 0 ? `(${timer})` : ""}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotVerifyOtp;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  innerContainer: { alignItems: "center" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 16,
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 15,
    color: "#111",
  },
  button: {
    width: "100%",
    backgroundColor: "#111",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  resendText: {
    color: "#111",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});