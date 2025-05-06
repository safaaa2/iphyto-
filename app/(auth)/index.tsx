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
const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    // D'abord, obtenir l'email de l'utilisateur
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user?.email) {
      console.error("Erreur lors de la récupération de l'email :", userError?.message);
      return null;
    }

    const userEmail = userData.user.email;
    console.log("Email de l'utilisateur:", userEmail);

    // Essayer de trouver l'utilisateur dans la table profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", userEmail)
      .single();

    if (!profileError && profileData) {
      console.log("Rôle trouvé dans profiles:", profileData.role);
      return profileData.role;
    }

    // Si pas trouvé dans profiles, essayer dans users
    const { data: userRoleData, error: userRoleError } = await supabase
      .from("users")
      .select("role")
      .eq("email", userEmail)
      .single();

    if (userRoleError) {
      console.error("Erreur lors de la récupération du rôle :", userRoleError.message);
      return null;
    }

    console.log("Rôle trouvé dans users:", userRoleData?.role);
    return userRoleData?.role || null;

  } catch (error) {
    console.error("Erreur inattendue :", error);
    return null;
  }
};





export default function Auth(): JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState("fr");
  const navigation = useNavigation();

  const [request, response] = Google.useAuthRequest({
    clientId:
      "681948067449-c0smtgqu5qjqdqjc5lqunci9454lr0kf.apps.googleusercontent.com",
    iosClientId:
      "681948067449-6ftaim231ke2ofolr03v928c5b8iiv1d.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({ scheme: "iphyto" }),
  });

  useEffect(() => {
    if (response?.type === "success") {
     
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

    } catch (error) {
      console.error("Erreur lors du changement de langue:", error);
      Alert.alert(t("error"), t("languageChangeError"));
    }
  };

  async function signInWithEmail(): Promise<void> {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      Alert.alert("Erreur", error.message);
      setLoading(false);
      return;
    }
  
    const session = data.session;
    if (!session) {
      Alert.alert("Erreur", "Session non trouvée");
      setLoading(false);
      return;
    }
  
    await AsyncStorage.setItem("session", JSON.stringify(session));
  
    const userId = session.user.id;
  
    if (!userId) {
      Alert.alert("Erreur", "ID de l'utilisateur non trouvé dans la session");
      setLoading(false);
      return;
    }
  
    const role = await getUserRole(userId);
    console.log("Rôle de l'utilisateur:", role); // Pour le débogage
  
    if (role === "admin") {
      router.replace("/admin");
    } else if (role === "fournisseur") {
      router.replace("/(supplier)/products");
    } else {
      router.replace("/(tabs)/home");
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
