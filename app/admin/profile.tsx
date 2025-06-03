import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { useSession } from '../session/sessionContext';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

export default function AdminProfile() {
  const { session } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile for user ID:', session?.user?.id);

      // D'abord, vérifions si l'utilisateur existe dans la table profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .maybeSingle();

      console.log('Profile data:', profile);
      console.log('Profile error:', error);

      if (error) {
        console.error('Erreur détaillée:', error);
        throw error;
      }

      if (!profile) {
        // Si le profil n'existe pas, vérifions d'abord si l'email existe déjà
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', session?.user?.email)
          .maybeSingle();

        if (existingProfile) {
          // Si un profil avec cet email existe déjà, mettons à jour son ID
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ id: session?.user?.id })
            .eq('email', session?.user?.email);

          if (updateError) {
            console.error('Erreur lors de la mise à jour du profil:', updateError);
            throw updateError;
          }

          setEmail(existingProfile.email || session?.user?.email || '');
          setUsername(existingProfile.username || '');
          setFullName(existingProfile.full_name || '');
        } else {
          // Si aucun profil n'existe avec cet email, créons-en un nouveau
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: session?.user?.id,
                email: session?.user?.email,
                username: session?.user?.email?.split('@')[0] || '',
                full_name: '',
                role: 'admin',
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('Erreur lors de la création du profil:', createError);
            throw createError;
          }

          if (newProfile) {
            setEmail(newProfile.email || session?.user?.email || '');
            setUsername(newProfile.username || '');
            setFullName(newProfile.full_name || '');
          }
        }
      } else {
        setEmail(profile.email || session?.user?.email || '');
        setUsername(profile.username || '');
        setFullName(profile.full_name || '');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du profil:', error.message);
      Alert.alert(
        'Erreur',
        `Impossible de charger le profil: ${error.message || 'Erreur inconnue'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!session?.user?.id) {
        throw new Error('Utilisateur non connecté');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          email: email,
          username: username,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Erreur détaillée:', error);
        throw error;
      }

      Alert.alert('Succès', 'Profil mis à jour avec succès');
      setIsEditing(false);
      fetchProfile(); // Recharger le profil après la mise à jour
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error.message);
      Alert.alert(
        'Erreur',
        `Impossible de mettre à jour le profil: ${error.message || 'Erreur inconnue'}`
      );
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error.message);
      Alert.alert('Erreur', 'Impossible de se déconnecter');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      setLoading(true);

      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session?.user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Erreur', 'Mot de passe actuel incorrect');
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert('Succès', 'Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error.message);
      Alert.alert('Erreur', 'Impossible de modifier le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editImageButton}>
            <Icon name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Profil Administrateur</Text>
        <Text style={styles.subtitle}>{email}</Text>
      </View>

      {isEditing ? (
        <ScrollView 
          style={styles.editScrollView}
          contentContainerStyle={styles.editScrollViewContent}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Votre email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Votre nom d'utilisateur"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom complet"
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Icon name="times" size={20} color="white" />
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Icon name="check" size={20} color="white" />
                <Text style={styles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            <View style={styles.infoGroup}>
              <Icon name="envelope" size={20} color="green" />
              <Text style={styles.infoText}>{email || 'Non défini'}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Icon name="user" size={20} color="green" />
              <Text style={styles.infoText}>{username || 'Non défini'}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Icon name="id-card" size={20} color="green" />
              <Text style={styles.infoText}>{fullName || 'Non défini'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Icon name="pencil" size={20} color="white" />
              <Text style={styles.buttonText}>Modifier le profil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Changer le mot de passe</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe actuel</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Votre mot de passe actuel"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Votre nouveau mot de passe"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon name={showNewPassword ? 'eye-slash' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmez votre nouveau mot de passe"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.changePasswordButton]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Icon name="key" size={20} color="white" />
              <Text style={styles.buttonText}>
                {loading ? 'Modification...' : 'Changer le mot de passe'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actions</Text>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Icon name="sign-out" size={20} color="white" />
              <Text style={styles.buttonText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'green',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'green',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  infoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  editButton: {
    backgroundColor: 'green',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: 'green',
  },
  logoutButton: {
    backgroundColor: '#8B0000',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
  },
  eyeIcon: {
    padding: 10,
  },
  changePasswordButton: {
    backgroundColor: 'green',
    marginTop: 10,
  },
  editScrollView: {
    flex: 1,
  },
  editScrollViewContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
}); 