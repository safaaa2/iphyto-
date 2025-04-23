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
import { useTranslation } from 'react-i18next';

export default function SignUp() {
  const { t } = useTranslation();
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
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDontMatch'));
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        t('error'),
        t('passwordRequirements')
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordLength'));
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), t('invalidEmail'));
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (userError) {
      Alert.alert(t('error'), t('usernameCheckError'));
      return;
    }

    if (userData) {
      Alert.alert(t('error'), t('usernameTaken'));
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
        console.error(t('signupError'), error);
        setLoading(false);
        Alert.alert(t('error'), error.message);
        return;
      }

      if (!data?.user) {
        console.error(t('noUserCreated'));
        setLoading(false);
        Alert.alert(t('error'), t('signupFailed'));
        return;
      }

      // Vérifier si l'utilisateur existe déjà dans la table profiles
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error(t('profileCheckError'), profileCheckError);
        setLoading(false);
        Alert.alert(t('error'), t('profileCreationError'));
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
          console.error(t('profileCreationError'), profileError);
          setLoading(false);
          Alert.alert(t('error'), t('profileCreationError'));
          return;
        }
      }

      if (data?.session) {
        console.log(t('sessionCreated'), data.session);
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
        setLoading(false);
        router.replace('/(tabs)/home');
      } else {
        console.log(t('noSessionAfterSignup'));
        // Attendre un peu avant de tenter la connexion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error(t('signInErrorAfterSignup'), signInError);
          setLoading(false);
          Alert.alert(t('error'), t('accountCreatedButLoginError') + signInError.message);
          return;
        }
        
        if (signInData?.session) {
          console.log(t('loginSuccessAfterSignup'), signInData.session);
          await AsyncStorage.setItem('session', JSON.stringify(signInData.session));
          setLoading(false);
          router.replace('/(tabs)/home');
        } else {
          console.error(t('noSessionAfterLoginAttempt'));
          setLoading(false);
          Alert.alert(t('error'), t('accountCreatedButSessionError'));
        }
      }
    } catch (error: any) {
      console.error(t('unexpectedError'), error);
      setLoading(false);
      Alert.alert(t('error'), t('unexpectedError') + ': ' + error.message);
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

          <Text style={styles.title}>{t('welcomeToIPhyto')}</Text>
          <Text style={styles.subtitle}>
            {t('createAccountMessage')} 🌱
          </Text>

          <Input
            placeholder={t('username')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            leftIcon={{ type: 'material', name: 'person', color: '#008000' }}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
          />
          <Input
            placeholder={t('fullName')}
            value={full_name}
            onChangeText={fullName}
            autoCapitalize="none"
            leftIcon={{ type: 'material', name: 'person', color: '#008000' }}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
          />

          <Input
            placeholder={t('email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            leftIcon={{ type: 'material', name: 'email', color: '#008000' }}
            inputStyle={styles.input}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
          />

          <Input
            placeholder={t('password')}
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
            placeholder={t('confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            leftIcon={{ type: 'font-awesome', name: 'lock', color: '#008000' }}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon name={showConfirmPassword ? 'visibility-off' : 'visibility'} color="#008000" />
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
                {loading ? t('loading') : t('createAccount')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkContainer}>
            <Text style={styles.link}>{t('alreadyHaveAccount')}</Text>
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
