import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View, Image, ScrollView, TouchableOpacity, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button, Input, Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Signup'>>();

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
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'visibility-off' : 'visibility'} />
              </TouchableOpacity>
            }
          />

          <Button
            title="Forgot Password?"
            type="clear"
            onPress={resetPassword}
            titleStyle={{ color: 'black', fontSize: 13, fontWeight: 'bold' }}
            buttonStyle={{ alignSelf: 'flex-start', marginTop: -10 }}
          />
        </View>

        <View style={styles.verticallySpaced}>
          <Button
            title="Sign in"
            disabled={loading}
            onPress={signInWithEmail}
            buttonStyle={styles.signInButton}
          />
        </View>

        <View style={styles.verticallySpaced}>
          <Button
            title="Create account"
            disabled={loading}
            onPress={() => router.push('/(auth)/signup')}
            buttonStyle={styles.signUpButton}
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
    paddingVertical: 150,
    backgroundColor: '#ffffff',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    paddingVertical: 7,
    alignSelf: 'stretch',
  },
  signInButton: {
    backgroundColor: '#008000',
    borderRadius: 100,
    width: 150,
    alignSelf: 'center',
  },
  signUpButton: {
    backgroundColor: '#008000',
    borderRadius: 100,
    width: 150,
    alignSelf: 'center',
  },
});
