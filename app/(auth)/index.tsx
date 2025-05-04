import React, { useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Text,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { Button, Input, Icon } from "@rneui/themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { changeLanguage, getSavedLanguage } from "../../lib/i18n";

WebBrowser.maybeCompleteAuthSession();

type RootStackParamList = {
  Signup: { email: string };
};

export default function Auth(): JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState("fr");
  const navigation = useNavigation();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "681948067449-c0smtgqu5qjqdqjc5lqunci9454lr0kf.apps.googleusercontent.com",
    iosClientId:
      "681948067449-6ftaim231ke2ofolr03v928c5b8iiv1d.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({ scheme: "iphyto" }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      signInWithGoogle(id_token);
    }
  }, [response]);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    const savedLanguage = await getSavedLanguage();
    setCurrentLanguage(savedLanguage);
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await changeLanguage(language);
      setCurrentLanguage(language);
      // Suppression du rechargement de l'application
      // router.replace('/');
    } catch (error) {
      console.error("Erreur lors du changement de langue:", error);
      Alert.alert(t("error"), t("languageChangeError"));
    }
  };

  async function signInWithGoogle(idToken: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) throw error;

      if (data?.session) {
        await AsyncStorage.setItem("session", JSON.stringify(data.session));
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "An error occurred during Google sign in"
      );
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail(): Promise<void> {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        Alert.alert("Error", sessionError.message);
      } else {
        await AsyncStorage.setItem("session", JSON.stringify(session));
        router.replace("/(tabs)/home");
      }
    }
    setLoading(false);
  }

  async function signUpWithEmail(): Promise<void> {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      await AsyncStorage.setItem("session", JSON.stringify(session));
    }
    setLoading(false);
  }

  async function resetPassword(): Promise<void> {
    if (!email) {
      Alert.alert("Error", "Please enter your email to reset your password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "Success",
        "A password reset link has been sent to your email."
      );
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../../assets/images/iphyto.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>{t("welcomeToIPhyto")}</Text>

      <Input
        placeholder={t("email")}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        leftIcon={{ type: "material", name: "email", color: "#008000" }}
        inputStyle={styles.input}
        containerStyle={styles.inputContainer}
        labelStyle={styles.label}
      />

      <Input
        placeholder={t("password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        leftIcon={{ type: "font-awesome", name: "lock", color: "#008000" }}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? "visibility-off" : "visibility"}
              color="#008000"
            />
          </TouchableOpacity>
        }
        inputStyle={styles.input}
        containerStyle={styles.inputContainer}
        labelStyle={styles.label}
      />

      <TouchableOpacity onPress={() => router.push("/(auth)")}>
        <Text style={styles.forgotPassword}>{t("forgotPassword")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={signInWithEmail}
        disabled={loading}
        style={[styles.buttonContainer, loading && { opacity: 0.7 }]}
      >
        <View style={styles.button}>
          <Text style={styles.buttonText}>
            {loading ? t("loading") : t("login")}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>{t("or")}</Text>
        <View style={styles.separatorLine} />
      </View>

      <TouchableOpacity
        onPress={() => router.push("/(auth)/signup")}
        disabled={loading}
        style={[styles.buttonContainer, loading && { opacity: 0.7 }]}
      >
        <View style={[styles.button, styles.signupButton]}>
          <Text style={[styles.buttonText, styles.signupButtonText]}>
            {t("signup")}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.languageSelector}>
        <Text style={styles.languageLabel}>{t("selectLanguage")}</Text>
        <View style={styles.languageButtons}>
          <Button
            title="Français"
            onPress={() => handleLanguageChange("fr")}
            buttonStyle={[
              styles.languageButton,
              currentLanguage === "fr" && styles.selectedLanguageButton,
            ]}
            titleStyle={[
              styles.languageButtonText,
              currentLanguage === "fr" && styles.selectedLanguageButtonText,
            ]}
          />
          <Button
            title="العربية"
            onPress={() => handleLanguageChange("ar")}
            buttonStyle={[
              styles.languageButton,
              currentLanguage === "ar" && styles.selectedLanguageButton,
            ]}
            titleStyle={[
              styles.languageButtonText,
              currentLanguage === "ar" && styles.selectedLanguageButtonText,
            ]}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff",
    paddingBottom: 20,
  },
  logo: {
    width: 190,
    height: 160,
    marginBottom: 20,
    borderRadius: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 10,
    color: "#333",
  },
  label: {
    color: "#666",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    color: "#008000",
    fontWeight: "600",
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#008000",
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "#999",
  },
  signupButton: {
    backgroundColor: "#ffffff",
    borderColor: "#008000",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  signupButtonText: {
    color: "#008000",
    fontWeight: "600",
    fontSize: 16,
  },
  languageSelector: {
    width: "100%",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginBottom: 150,
  },
  languageLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  languageButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  languageButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedLanguageButton: {
    backgroundColor: "#008000",
    borderColor: "#008000",
  },
  languageButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedLanguageButtonText: {
    color: "#ffffff",
  },
});
