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
    try {
      setLoading(true);
      console.log('Tentative de connexion avec:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    
      if (error) {
        console.error('Erreur de connexion:', error);
        Alert.alert('Erreur', error.message);
        setLoading(false);
        return;
      }
    
      // Si la connexion réussit, récupérer le profil pour vérifier le statut actif
      const userId = data.user?.id;

      if (!userId) {
        console.error('ID utilisateur non trouvé après connexion');
        Alert.alert('Erreur', 'Erreur lors de la récupération de l\'ID utilisateur.');
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Erreur lors de la récupération du profil pour vérifier l\'activité:', profileError);
        Alert.alert('Erreur', 'Impossible de vérifier le statut de votre compte.');
        setLoading(false);
        return;
      }

      // Vérifier si l'utilisateur est actif AVANT de créer la session
      if (profileData && profileData.is_active === false) {
        console.log('Compte utilisateur désactivé:', userId);
        // Déconnecter explicitement l'utilisateur
        await supabase.auth.signOut();
        // Ne pas créer de session, juste afficher l'alerte
        Alert.alert('Erreur de connexion', 'Votre compte a été désactivé par l\'administrateur.');
        setLoading(false);
        return;
      }

      // Si l'utilisateur est actif, procéder à la création de la session et à la navigation
      const session = data.session;
      if (!session) {
        console.error('Session non trouvée après vérification d\'activité');
        Alert.alert('Erreur', 'Session non trouvée après vérification.');
        setLoading(false);
        return;
      }

      console.log('Session créée avec succès et utilisateur actif');
      await AsyncStorage.setItem("session", JSON.stringify(session));

      console.log('Rôle trouvé:', profileData?.role);

      if (profileData?.role === "admin") {
        router.replace("/admin");
      } else if (profileData?.role === "supplier") {
        router.replace("/(supplier)/dashboard");
      } else if (profileData?.role === "farmer") {
        router.replace("/(tabs)/search");
      } else {
        router.replace("/(tabs)/search");
      }
    
      setLoading(false);
    } catch (error: any) {
      console.error('Erreur inattendue:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
      setLoading(false);
    }
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
        <View style={[styles.button, styles.loginButton]}>
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
        style={styles.createAccountButton}
      >
        <Text style={styles.createAccountText}>{t("createAccount")}</Text>
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
    alignItems: "center",
  },
  loginButton: {
    width: "100%",
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
  createAccountButton: {
    backgroundColor: "#ffffff",
    borderColor: "#008000",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  createAccountText: {
    color: "#008000",
    fontSize: 16,
    fontWeight: "600",
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
