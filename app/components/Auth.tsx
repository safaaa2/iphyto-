import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View, Image, ScrollView, TouchableOpacity, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button, Input, Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

type RootStackParamList = {
  Signup: { email: string };
};

export default function Auth(): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigation = useNavigation();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '681948067449-c0smtgqu5qjqdqjc5lqunci9454lr0kf.apps.googleusercontent.com',
    iosClientId: '681948067449-6ftaim231ke2ofolr03v928c5b8iiv1d.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({ scheme: 'iphyto' }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      signInWithGoogle(id_token);
    }
  }, [response]);

  async function signInWithGoogle(idToken: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;

      if (data?.session) {
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'An error occurred during Google sign in');
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail(): Promise<void> {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        Alert.alert('Error', sessionError.message);
      } else {
        await AsyncStorage.setItem('session', JSON.stringify(session));
        router.replace('/(tabs)/home');
      }
    }
    setLoading(false);
  }

  async function signUpWithEmail(): Promise<void> {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      await AsyncStorage.setItem('session', JSON.stringify(session));
    }
    setLoading(false);
  }

  async function resetPassword(): Promise<void> {
    if (!email) {
      Alert.alert('Error', 'Please enter your email to reset your password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'A password reset link has been sent to your email.');
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../../assets/images/iphyto.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>
        Bienvenue sur <Text style={styles.green}>IPHYTO</Text> 🌿
      </Text>

      <Input
        placeholder="Adresse e-mail"
        leftIcon={{ type: 'material', name: 'email' }}
        value={email}
        onChangeText={setEmail}
        containerStyle={styles.inputContainer}
        inputStyle={styles.inputText}
      />

      <Input
        placeholder="Mot de passe"
        leftIcon={{ type: 'font-awesome', name: 'lock' }}
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        inputStyle={styles.inputText}
        containerStyle={styles.inputContainer}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'visibility-off' : 'visibility'} />
          </TouchableOpacity>
        }
      />

      <TouchableOpacity onPress={resetPassword}>
        <Text style={styles.link}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <Button
        title="Se connecter"
        loading={loading}
        onPress={signInWithEmail}
        buttonStyle={styles.loginButton}
        titleStyle={styles.loginText}
        containerStyle={{ width: '100%', marginTop: 20 }}
      />

      <Text style={styles.or}>Ou</Text>

      <Button
        title="Créer un compte"
        type="outline"
        onPress={() => router.push('/(auth)/signup')}
        titleStyle={styles.signupText}
        buttonStyle={styles.signupButton}
        containerStyle={{ width: '100%' }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  logo: {
    width: 190,
    height: 160,
    marginBottom: 20,
    borderRadius: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  green: {
    color: '#008000',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  inputText: {
    fontSize: 16,
    paddingHorizontal: 10,
    color: '#333',
  },
  link: {
    alignSelf: 'flex-end',
    color: '#008000',
    fontWeight: '600',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#008000',
    borderRadius: 8,
    paddingVertical: 12,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
  },
  or: {
    marginVertical: 16,
    fontSize: 14,
    color: '#999',
  },
  signupButton: {
    borderColor: '#008000',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  signupText: {
    color: '#008000',
    fontWeight: '600',
    fontSize: 16,
  },
});