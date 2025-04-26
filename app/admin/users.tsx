import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

interface Profile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function UsersAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
          router.replace('/(auth)');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Erreur de vérification du profil:', profileError);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(profile?.role === 'admin');
        setIsLoadingAuth(false);
      } catch (error) {
        console.error('Erreur de vérification:', error);
        setIsAdmin(false);
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isAdmin
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Profile> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    }
  });

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        updates: { role: newRole }
      });
      Alert.alert('Succès', 'Le rôle a été mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le rôle');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        updates: { is_active: !currentStatus }
      });
      Alert.alert('Succès', 'Le statut a été mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  if (isLoadingAuth || isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text>Accès non autorisé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Utilisateurs</Text>
        <Text style={styles.subtitle}>{profiles?.length} utilisateurs au total</Text>
      </View>
      <ScrollView style={styles.userList}>
        {profiles?.map((profile) => (
          <View key={profile.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <Text style={styles.userName}>{profile.email}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: profile.is_active ? '#4CAF50' : '#FF5252' }
                ]}>
                  <Text style={styles.statusText}>
                    {profile.is_active ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </View>
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>Rôle:</Text>
                <Text style={[
                  styles.roleValue,
                  { color: profile.role === 'admin' ? '#2196F3' : '#666' }
                ]}>
                  {profile.role || 'Utilisateur'}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.roleButton]}
                onPress={() => {
                  Alert.alert(
                    'Changer le rôle',
                    'Sélectionnez le nouveau rôle',
                    [
                      { text: 'Admin', onPress: () => handleUpdateRole(profile.id, 'admin') },
                      { text: 'Utilisateur', onPress: () => handleUpdateRole(profile.id, 'user') },
                      { text: 'Annuler', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.actionButtonText}>Changer rôle</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  profile.is_active ? styles.deactivateButton : styles.activateButton
                ]}
                onPress={() => handleToggleStatus(profile.id, profile.is_active)}
              >
                <Text style={styles.actionButtonText}>
                  {profile.is_active ? 'Désactiver' : 'Activer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  userList: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  roleValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  roleButton: {
    backgroundColor: '#2196F3',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  deactivateButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 