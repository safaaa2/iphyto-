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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/iphyto.png')} style={styles.image} />
        <Text style={styles.welcomeText}>
          <Text style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: 16 }}>Bienvenue chez IPHYTO !</Text>
        </Text>

        <View style={styles.verticallySpaced}>
          <Input
            label="Email"
            leftIcon={{ type: 'material', name: 'email' }}
            onChangeText={setEmail}
            value={email}
            placeholder="email@address.com"
            autoCapitalize="none"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
          />
        </View>

        <View style={styles.verticallySpaced}>
          <Input
            label="Password"
            leftIcon={{ type: 'font-awesome', name: 'lock' }}
            onChangeText={setPassword}
            value={password}
            secureTextEntry={!showPassword}
            placeholder="Password"
            autoCapitalize="none"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'visibility-off' : 'visibility'} />
              </TouchableOpacity>
            }
          />

          <Button
            title="Mot de passe oublié ?"
            type="clear"
            onPress={resetPassword}
            titleStyle={styles.forgotPasswordText}
            buttonStyle={styles.forgotPasswordButton}
            containerStyle={{ padding: 0, margin: 0 }}
          />
        </View>

        <View style={styles.verticallySpaced}>
          <Button
            title="Se connecter"
            disabled={loading}
            onPress={signInWithEmail}
            buttonStyle={styles.signInButton}
            titleStyle={styles.buttonText}
            loading={loading}
            raised={false}
            containerStyle={{ padding: 0, margin: 0 }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.text}>Vous n'avez pas de compte ?</Text>
          <Button
            title="Créer un compte"
            disabled={loading}
            onPress={() => router.push('/(auth)/signup')}
            buttonStyle={styles.signUpButton}
            titleStyle={styles.buttonText}
            containerStyle={{ padding: 0, margin: 0 }}
            raised={false}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#f5f5f5',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 100,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#008000',
  },
  verticallySpaced: {
    paddingVertical: 10,
    alignSelf: 'stretch',
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputText: {
    fontSize: 16,
    paddingHorizontal: 10,
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#008000',
    borderRadius: 8,
    width: '70%',
    height: 42,
    marginVertical: 8,
    elevation: 0,
    shadowColor: 'transparent',
    borderWidth: 0,
    borderColor: '#008000',
    padding: 0,
    margin: 0,
    alignSelf: 'center',
  },
  signUpButton: {
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
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'transparent',
    padding: 0,
    borderWidth: 0,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#008000',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    padding: 0,
  },
});

