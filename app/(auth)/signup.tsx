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
  TextInput,
} from 'react-native';
import { Input, Button, Icon } from '@rneui/themed';
import { router, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function SignUp() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<'supplier' | 'farmer'>('farmer');
  const [companyName, setCompanyName] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      setLoading(true);
      console.log('Début de l\'inscription avec le rôle:', userType);

      // Vérifier si tous les champs requis sont remplis
      if (!email || !password || !username || !fullName) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      // Vérifier la longueur du nom d'utilisateur
      if (username.length < 3 || username.length > 50) {
        Alert.alert('Erreur', 'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères');
        setLoading(false);
        return;
      }

      // Pour les fournisseurs, utiliser le nom de l'entreprise comme nom d'utilisateur
      const finalUsername = userType === 'supplier' ? companyName : username;

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (existingUser?.user) {
        console.log('Utilisateur déjà existant');
        Alert.alert('Erreur', 'Un compte existe déjà avec cet email');
        setLoading(false);
        return;
      }

      // Créer le compte
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Erreur lors de la création du compte:', error);
        Alert.alert('Erreur', error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        console.error('Pas d\'utilisateur créé');
        Alert.alert('Erreur', 'Erreur lors de la création du compte');
        setLoading(false);
        return;
      }

      console.log('Compte créé avec succès, ID:', data.user.id);

      // Vérifier si un profil existe déjà
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification du profil:', checkError);
        Alert.alert('Erreur', 'Erreur lors de la vérification du profil');
        setLoading(false);
        return;
      }

      const profileData = {
        id: data.user.id,
        email: email,
        username: finalUsername,
        full_name: fullName,
        role: userType,
        fournisseur: userType === 'supplier' ? companyName : null,
        updated_at: new Date().toISOString()
      };

      let profileError;
      if (existingProfile) {
        // Mettre à jour le profil existant
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', data.user.id);
        profileError = updateError;
      } else {
        // Créer un nouveau profil
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);
        profileError = insertError;
      }

      if (profileError) {
        console.error('Erreur lors de la création/mise à jour du profil:', profileError);
        Alert.alert('Erreur', 'Erreur lors de la création du profil');
        setLoading(false);
        return;
      }

      console.log('Profil créé/mis à jour avec succès');

      // Attendre un peu pour s'assurer que tout est synchronisé
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Vérifier la session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('Pas de session après l\'inscription');
        Alert.alert('Erreur', 'Erreur lors de la connexion');
        setLoading(false);
        return;
      }

      console.log('Session créée avec succès');

      // Rediriger selon le rôle
      if (userType === 'supplier') {
        console.log('Redirection vers l\'interface fournisseur');
        router.replace('/(supplier)/products');
      } else if (userType === 'farmer') {
        console.log('Redirection vers l\'interface farmer');
        router.replace('/(tabs)/search');
      } else {
        console.log('Redirection vers l\'interface utilisateur');
        router.replace('/(tabs)/search');
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Erreur inattendue:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
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
            value={fullName}
            onChangeText={setFullName}
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

          <View style={styles.userTypeContainer}>
            <Text style={styles.userTypeLabel}>{t('userType')}</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'farmer' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('farmer')}
              >
                <Ionicons 
                  name="leaf-outline" 
                  size={24} 
                  color={userType === 'farmer' ? '#fff' : '#008000'} 
                />
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'farmer' && styles.userTypeButtonTextActive
                ]}>
                  {t('farmer')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'supplier' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('supplier')}
              >
                <Ionicons 
                  name="business-outline" 
                  size={24} 
                  color={userType === 'supplier' ? '#fff' : '#008000'} 
                />
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'supplier' && styles.userTypeButtonTextActive
                ]}>
                  {t('supplier')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {userType === 'supplier' && (
            <Input
              placeholder={t('companyName')}
              value={companyName}
              onChangeText={setCompanyName}
              autoCapitalize="none"
              leftIcon={{ type: 'material', name: 'business', color: '#008000' }}
              inputStyle={styles.input}
              containerStyle={styles.inputContainer}
              labelStyle={styles.label}
            />
          )}

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
  userTypeContainer: {
    marginBottom: 20,
    width: '90%',
  },
  userTypeLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#008000',
    gap: 8,
    height: 50,
    backgroundColor: '#fff',
  },
  userTypeButtonActive: {
    backgroundColor: '#008000',
    borderColor: '#008000',
  },
  userTypeButtonText: {
    fontSize: 15,
    color: '#008000',
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: '#fff',
  },
  inputIcon: {
    padding: 12,
  },
});
