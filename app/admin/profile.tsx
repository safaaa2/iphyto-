import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('id', session?.user?.id)
        .single();

      if (error) {
        console.error('Erreur détaillée:', error);
        throw error;
      }

      if (user) {
        setEmail(user.email || session?.user?.email || '');
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
        .from('users')
        .update({
          email: email,
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="user-circle" size={100} color="green" />
        <Text style={styles.title}>Profil Administrateur</Text>
      </View>

      <View style={styles.content}>
        {isEditing ? (
          <>
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

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoGroup}>
              <Icon name="envelope" size={20} color="#666" />
              <Text style={styles.infoText}>{email || 'Non défini'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Icon name="pencil" size={20} color="white" />
              <Text style={styles.buttonText}>Modifier le profil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Icon name="sign-out" size={20} color="white" />
              <Text style={styles.buttonText}>Se déconnecter</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop:50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    color: '#333',
  },
  content: {
    padding: 20,
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
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  infoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
    marginTop: 10,
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
}); 