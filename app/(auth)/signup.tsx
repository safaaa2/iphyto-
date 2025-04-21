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
  const [full_name, fullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Erreur',
        'Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', "L'email n'est pas valide.");
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (userError) {
      Alert.alert('Erreur', "Erreur lors de la vérification du nom d'utilisateur.");
      return;
    }

    if (userData) {
      Alert.alert('Erreur', "Ce nom d'utilisateur est déjà pris.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            full_name: full_name
          }
        }
      });

      if (error) {
        console.error("Erreur lors de l'inscription:", error);
        setLoading(false);
        Alert.alert('Erreur', error.message);
        return;
      }

      if (!data?.user) {
        console.error("Pas d'utilisateur créé après l'inscription");
        setLoading(false);
        Alert.alert('Erreur', "L'inscription a échoué. Veuillez réessayer.");
        return;
      }

      // Vérifier si l'utilisateur existe déjà dans la table profiles
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error("Erreur lors de la vérification du profil:", profileCheckError);
        setLoading(false);
        Alert.alert('Erreur', "Erreur lors de la création du profil.");
        return;
      }

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            email,
            full_name: full_name
          });
         
        if (profileError) {
          console.error("Erreur lors de la création du profil:", profileError);
          setLoading(false);
          Alert.alert('Erreur', 'Erreur lors de la création du profil.');
          return;
        }
      }

      if (data?.session) {
        console.log("Session créée avec succès", data.session);
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
        setLoading(false);
        router.replace('/(tabs)/home');
      } else {
        console.log("Pas de session après inscription, tentative de connexion...");
        // Attendre un peu avant de tenter la connexion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error("Erreur de connexion après inscription:", signInError);
          setLoading(false);
          Alert.alert('Erreur', 'Compte créé mais problème de connexion: ' + signInError.message);
          return;
        }
        
        if (signInData?.session) {
          console.log("Connexion réussie après inscription", signInData.session);
          await AsyncStorage.setItem('session', JSON.stringify(signInData.session));
          setLoading(false);
          router.replace('/(tabs)/home');
        } else {
          console.error("Pas de session après tentative de connexion");
          setLoading(false);
          Alert.alert('Erreur', 'Compte créé mais problème de session. Veuillez vous connecter manuellement.');
        }
      }
    } catch (error: any) {
      console.error("Erreur inattendue lors de l'inscription:", error);
      setLoading(false);
      Alert.alert('Erreur', 'Une erreur est survenue: ' + error.message);
    }
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
            placeholder="full name"
            value={full_name}
            onChangeText={fullName}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#008000',
    borderRadius: 12,
    width: '90%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
