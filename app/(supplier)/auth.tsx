import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Input } from '@rneui/themed';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export default function SupplierAuth() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'fournisseur'
            }
          }
        });

        if (error) throw error;

        if (data?.session) {
          await AsyncStorage.setItem('session', JSON.stringify(data.session));
          router.replace('/(supplier)/products');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.session) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('email', email)
            .single();

          if (userError) throw userError;

          await AsyncStorage.setItem('session', JSON.stringify(data.session));

          if (userData.role === 'fournisseur') {
            await AsyncStorage.setItem('session', JSON.stringify(data.session));
            router.push('/(supplier)/products');
          } else if (userData.role === 'admin') {
            await AsyncStorage.setItem('session', JSON.stringify(data.session));
            router.push('/admin');
          } else {
            await AsyncStorage.setItem('session', JSON.stringify(data.session));
            router.push('/(tabs)/home');
          }
        }
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
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

          <Text style={styles.title}>
            {isSignUp ? t('createSupplierAccount') : t('supplierLogin')}
          </Text>

          <Input
            placeholder={t('email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={{ type: 'material', name: 'email', color: '#008000' }}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder={t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            leftIcon={{ type: 'material', name: 'lock', color: '#008000' }}
            rightIcon={{
              type: 'material',
              name: showPassword ? 'visibility-off' : 'visibility',
              color: '#008000',
              onPress: () => setShowPassword(!showPassword),
            }}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
          />

          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            style={[styles.buttonContainer, loading && { opacity: 0.7 }]}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>
                {loading ? t('loading') : (isSignUp ? t('signup') : t('login'))}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.linkContainer}
          >
            <Text style={styles.link}>
              {isSignUp ? t('alreadyHaveAccount') : t('createAccount')}
            </Text>
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
    paddingBottom: 20,
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
  inputContainer: {
    width: '90%',
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
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