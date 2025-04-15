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
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    const { data: { session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Image
            source={require('../../assets/images/iphyto.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>S'inscrire à iPhyto!</Text>

          <Input
            placeholder="Nom d'utilisateur"
            label="Nom d'utilisateur"
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
            label="Email"
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
            label="Mot de passe"
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
            label="Confirmer le mot de passe"
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

          <Button
            title="Créer un compte"
            loading={loading}
            disabled={loading}
            onPress={handleSignUp}
            buttonStyle={styles.button}
            titleStyle={styles.buttonText}
            containerStyle={{ padding: 0, margin: 0 }}
            raised={false}
          />

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
    width: 200,
    height: 150,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008000',
    marginBottom: 30,
    fontStyle:'italic'
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
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
  button: {
    backgroundColor: '#008000',
    borderRadius: 8,
    width: '80%',
    height: 45,
    marginVertical: 8,
    elevation: 0,
    shadowColor: 'transparent',
    borderWidth: 0,
    borderColor: '#008000',
    padding: 0,
    margin: 0,
    alignSelf: 'center',
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
