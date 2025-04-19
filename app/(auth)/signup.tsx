import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input, Button, Icon } from '@rneui/themed';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    // Vérification si tous les champs sont remplis
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
  
    // Vérification si les mots de passe sont identiques
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    // Explication de l'expression régulière :
    // (?=.*[a-zA-Z]) => Au moins une lettre (majuscule ou minuscule)
    // (?=.*\d) => Au moins un chiffre
    // (?=.*[!@#$%^&*(),.?":{}|<>]) => Au moins un caractère spécial
    // .{6,} => Minimum 6 caractères
    if (!passwordRegex.test(password)) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial.');
      return;
    }
    // Vérification si le mot de passe a au moins 6 caractères
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
  
    // Validation de l'email avec une expression régulière
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'L\'email n\'est pas valide.');
      return;
    }
  
    setLoading(true);
  
    // Tentative de création de compte avec Supabase
    const { data: { session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
  
    // Gestion des erreurs de Supabase
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      // Si l'inscription est réussie, on stocke la session et redirige l'utilisateur
      await AsyncStorage.setItem('session', JSON.stringify(session));
      router.replace('/(tabs)/home');
    }
  
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image
            source={require('../../assets/images/iphyto.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Bienvenue sur iPhyto!</Text>
          <Text style={styles.subtitle}>
            Créez votre compte pour accéder à toutes les fonctionnalités de iPhyto 🌱
          </Text>

          <Input
            placeholder="Nom d'utilisateur"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            leftIcon={{ type: 'material', name: 'person', color: '#008000' }}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
          />

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            leftIcon={{ type: 'material', name: 'email', color: '#008000' }}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
          />

          <Input
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            leftIcon={{ type: 'font-awesome', name: 'lock', color: '#008000' }}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'visibility-off' : 'visibility'} color="#008000" />
              </TouchableOpacity>
            }
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
          />

          <Input
            placeholder="Confirmer mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            leftIcon={{ type: 'font-awesome', name: 'lock', color: '#008000' }}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                  color="#008000"
                />
              </TouchableOpacity>
            }
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
          />

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            style={[styles.buttonContainer, loading && { opacity: 0.7 }]}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>
                {loading ? 'Chargement...' : 'Créer un compte'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkContainer}>
            <Text style={styles.link}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'white',
    paddingTop: 40,
    paddingBottom: 60,
  },
  logo: {
    width: 150,
    height: 120,
    marginBottom: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#008000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 25,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  inputContainer: {
    width: '90%',
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
  },
  label: {
    color: 'gray',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center', // مركز الزر
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#008000',
    borderRadius: 12,
    width: '90%',
    height: 50,
    justifyContent: 'center', // مركز النص داخل الزر
    alignItems: 'center',
    marginTop: 20,   // مركز النص داخل الزر
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  linkContainer: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
  },
  link: {
    color: '#008000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
