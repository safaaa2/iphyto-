import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, Button, Alert } from 'react-native';
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
  const [activeTab, setActiveTab] = useState('suppliers');
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
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, username, email, role, is_active')
        .order('full_name', { ascending: true });

      if (activeTab === 'suppliers') {
        query = query.eq('role', 'supplier');
      } else {
        query = query.in('role', ['user', 'farmer']);
      }

      const { data, error } = await query;

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
      console.error('Erreur lors de la mise à jour:', error.message);
    } else {
      fetchUsers();
      closeEditModal();
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.userName, { fontWeight: 'bold' }]}>
          {item.full_name || 'Nom inconnu'}
        </Text>
        <Text style={styles.userEmail}>Email : {item.email || 'Email inconnu'}</Text>
        <Text style={styles.userRole}>Rôle : {item.role === 'supplier' ? 'Fournisseur' : item.role === 'farmer' ? 'Fermier' : 'Utilisateur'}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Utilisateurs</Text>
        <Text style={styles.subtitle}>{session?.user.email}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'suppliers' && styles.activeTab]} 
          onPress={() => setActiveTab('suppliers')}
        >
          <Text style={[styles.tabText, activeTab === 'suppliers' && styles.activeTabText]}>Fournisseurs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Utilisateurs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'suppliers' ? "Rechercher un fournisseur..." : "Rechercher un utilisateur..."}
          value={searchQuery}
          onChangeText={filterUsers}
        />
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListEmptyComponent={<Text style={styles.emptyText}>
            {activeTab === 'suppliers' ? "Aucun fournisseur trouvé." : "Aucun utilisateur trouvé."}
          </Text>}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {activeTab === 'suppliers' ? "Modifier le fournisseur" : "Modifier l'utilisateur"}
            </Text>

            <Text>Email : </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />

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

            <Text>Rôle : </Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'supplier' && styles.activeRoleButton]}
                onPress={() => setRole('supplier')}
              >
                <Text style={[styles.roleButtonText, role === 'supplier' && styles.activeRoleButtonText]}>
                  Fournisseur
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'user' && styles.activeRoleButton]}
                onPress={() => setRole('user')}
              >
                <Text style={[styles.roleButtonText, role === 'user' && styles.activeRoleButtonText]}>
                  Utilisateur
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={closeEditModal}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleEditUser}
              >
                <Text style={styles.modalButtonText1}>Enregistrer</Text>
              </TouchableOpacity>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 25,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginTop: -15,
    marginHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 0,
  },
  tabText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchInput: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userName: {
    fontSize: 16,
    flexWrap: 'nowrap',
    overflow: 'hidden',
    color: '#333',
  },
  userEmail: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  userRole: {
    color: '#2E7D32',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  blockButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  modalButtonText1: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  modifyButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E7D32',
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  activeRoleButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  roleButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeRoleButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
  },
  modalButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
}); 