import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Button, Input, Text, Card } from '@rneui/themed';
import { useSession } from '../session/sessionContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Profile = () => {
  const { session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl ] = useState('');

  useEffect(() => {
    if (session?.user) {
      getProfile();
    }
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error,status } = await supabase
        .from('profiles')
        .select(`username', avatar_url`)
        .eq('id', session?.user.id)
        .single();

        if (error && status!== 406) {
          throw error;
        }
  
      
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert(error.message);
        }
      } finally {
        setLoading(false);
      }
    }
  

  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session?.user.id,
        username,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      Alert.alert('Profile updated successfully!');
    } catch (error) {
   
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }
  if (!session || !session.user) {
    return (
      <View style={styles.container}>
        <Text>No user is logged in</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* En-tête blanche */}
      <View style={styles.headerContainer}>
        <Text h3 style={styles.headerText}>Mon Profil</Text>
      </View>

      {/* Photo de profil avec option de modification */}
      <TouchableOpacity style={styles.profileWrapper}>
        <Image 
          source={{ uri: avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
          style={styles.profileImage} 
        />
      </TouchableOpacity>

      {/* Carte d'informations utilisateur */}
      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>Informations personnelles</Card.Title>
        <Card.Divider />

        <Input 
          label="Email" 
          value={session.user.email} 
          disabled 
          inputStyle={styles.inputText}
          leftIcon={<Ionicons name="mail-outline" size={20} color="green" />}
        />

        <Input 
          label="Nom d'utilisateur"
          placeholder='nom user' 
          value={username} 
          onChangeText={setUsername} 
          inputStyle={styles.inputText}
          leftIcon={<Ionicons name="person-outline" size={20} color="green" />}
        />

        {/* Bouton Modifier */}
        <Button 
          title={loading ? 'Mise à jour...' : 'Mettre à jour'} 
          onPress={updateProfile} 
          disabled={loading} 
          buttonStyle={styles.updateButton}
          icon={<Ionicons name="save-outline" size={22} color="white" style={{ marginRight: 10 }} />}
        />
      </Card>

      {/* Bouton Déconnexion */}
      <Button 
        title="Déconnexion" 
        onPress={signOut} 
        buttonStyle={styles.signOutButton} 
        icon={<Ionicons name="log-out-outline" size={22} color="white" style={{ marginRight: 10 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Fond blanc
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  headerText: {
    color: '#333',
    fontSize: 26,
    fontWeight: 'bold',
  },
  profileWrapper: {
    marginTop: -25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  inputText: {
    fontSize: 16,
    color: '#555',
  },
  updateButton: {
    backgroundColor: '#008000',
    borderRadius: 12,
    marginVertical: 10,
    paddingVertical: 12,
  },
  signOutButton: {
    backgroundColor: '#b82b2b',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 12,
    marginTop: 20,
  },
});

export default Profile;
