import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Switch, Modal, Button, Alert } from 'react-native';
import { useSession } from '../session/sessionContext';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/FontAwesome';

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function AdminPage() {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, full_name, username, email, role, is_active');
      if (error) {
        console.error('Error fetching users:', error.message);
        Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
      } else {
        setUsers(data as User[]);
        setFilteredUsers(data as User[]);
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du chargement des utilisateurs');
    }
  };

  const filterUsers = (query: string) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    const filtered = users.filter((user: User) =>
      (user.full_name || '').toLowerCase().includes(lowerQuery) ||
      (user.email || '').toLowerCase().includes(lowerQuery)
    );
    setFilteredUsers(filtered);
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isActive })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error.message);
    } else {
      fetchUsers();
    }
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setFullName(user.full_name);
    setUsername(user.username);
    setEmail(user.email);
    setRole(user.role);
    setModalVisible(true);
  };

  const closeEditModal = () => {
    setModalVisible(false);
    setUserToEdit(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setRole('');
  };

  const handleEditUser = async () => {
    if (!userToEdit) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username,
        email: email,
        role: role
      })
      .eq('id', userToEdit.id);

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error.message);
    } else {
      fetchUsers();
      closeEditModal();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Erreur lors de la suppression:', error.message);
        Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
      } else {
        fetchUsers();
        Alert.alert('Succès', 'Utilisateur supprimé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.userName, { fontWeight: 'bold' }]}>
          {item.full_name || 'Nom inconnu'}
        </Text>
        <Text style={styles.userEmail}>Email : {item.email || 'Email inconnu'}</Text>
        <Text style={styles.userRole}>Rôle : {item.role || 'Utilisateur'}</Text>
        <Text style={styles.userName}>Nom d'utilisateur : {item.username || 'Nom inconnu'}</Text>
      </View>

      <TouchableOpacity
        style={styles.blockButton}
        onPress={() => toggleUserActive(item.id, item.is_active ?? true)}
      >
        <Icon name={item.is_active ? 'lock' : 'unlock'} size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modifyButton}
        onPress={() => openEditModal(item)}
      >
        <Icon name="pencil" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Tableau de bord</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>10</Text>
                <Text style={styles.statLabel}>Utilisateurs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>45</Text>
                <Text style={styles.statLabel}>Plantes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Alertes</Text>
              </View>
            </View>
          </View>
        );
      case 'users':
        return (
          <View style={styles.content}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChangeText={filterUsers}
            />
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Administration</Text>
        <Text style={styles.subtitle}>Bienvenue, {session?.user.email}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Tableau de bord</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Utilisateurs</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Modifier l'utilisateur</Text>

            <Text>Email : </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />

            <Text>Role :</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity style={styles.roleButton} onPress={() => setRole('user')}>
                <Text style={styles.roleText}>User</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.roleButton} onPress={() => setRole('admin')}>
                <Text style={styles.roleText}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.roleButton} onPress={() => setRole('fournisseur')}>
                <Text style={styles.roleText}>Fournisseur</Text>
              </TouchableOpacity>
            </View>

            <Text>Nom d'utilisateur : </Text>
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur"
              value={username}
              onChangeText={setUsername}
            />

            <Text>Nom complet : </Text>
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              value={fullName}
              onChangeText={setFullName}
            />

            <View style={styles.modalActions}>
              <Button title="Annuler" onPress={closeEditModal} />
              <Button title="Enregistrer" onPress={handleEditUser} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'green',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'green',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
  },
  activeTabText: {
    color: 'green',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  searchInput: {
    height: 40,
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  userName: {
    fontSize: 14,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  userEmail: {
    color: 'black',
    fontSize: 14,
  },
  userRole: {
    color: 'black',
    fontSize: 14,
    marginTop: 5,
  },
  blockButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modifyButton: {
    backgroundColor: 'green',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'black',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  roleButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  roleText: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}); 