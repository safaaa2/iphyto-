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
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
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
    const { data: { session }, error } = await supabase.auth.signUp({ email, password });

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
        <LinearGradient colors={['#ffffff', '#e0f2e9']} style={styles.gradient}>
          <View style={styles.container}>
            <Image
              source={require('../../assets/images/iphyto.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Créer un compte</Text>

            <Input
              placeholder="Email"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              leftIcon={{ type: 'material', name: 'email', color: '#2E7D32' }}
              inputStyle={styles.input}
              labelStyle={styles.label}
              containerStyle={styles.inputContainer}
            />

            <Input
              placeholder="Mot de passe"
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={{ type: 'font-awesome', name: 'lock', color: '#2E7D32' }}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'visibility-off' : 'visibility'} color="#2E7D32" />
                </TouchableOpacity>
              }
              inputStyle={styles.input}
              labelStyle={styles.label}
              containerStyle={styles.inputContainer}
            />

            <Input
              placeholder="Confirmer mot de passe"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              leftIcon={{ type: 'font-awesome', name: 'lock', color: '#2E7D32' }}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    color="#2E7D32"
                  />
                </TouchableOpacity>
              }
              inputStyle={styles.input}
              labelStyle={styles.label}
              containerStyle={styles.inputContainer}
            />

            <Button
              title="Créer un compte"
              loading={loading}
              disabled={loading}
              onPress={handleSignUp}
              buttonStyle={styles.button}
            />

            <Button
              title="J'ai déjà un compte"
              type="clear"
              titleStyle={styles.link}
              onPress={() => router.back()}
            />
          </View>
        </LinearGradient>
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
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  link: {
    marginTop: 15,
    color: '#2E7D32',
  },
});
