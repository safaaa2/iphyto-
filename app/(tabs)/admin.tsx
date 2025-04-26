import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Switch, Modal, Button, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/FontAwesome'; // Importer des icônes

export default function UserManagementScreen() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('id, full_name, username, email, role, is_active');
    if (error) {
      console.error('Error fetching users:', error.message);
    } else {
      setUsers(data);
      setFilteredUsers(data);
    }
  };

  const filterUsers = (query) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    const filtered = users.filter((user) =>
      (user.full_name || '').toLowerCase().includes(lowerQuery) ||
      (user.email || '').toLowerCase().includes(lowerQuery)
    );
    setFilteredUsers(filtered);
  };

  const toggleUserActive = async (userId, isActive) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isActive })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error.message);
    } else {
      fetchUsers(); // Refresh
    }
  };

  const openEditModal = (user) => {
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
    console.log("Modifier l'utilisateur:", userToEdit.id, fullName, username, email, role);  // Log des valeurs avant la mise à jour

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username,
        email: email,
        role: role
      })
      .eq('id', userToEdit.id);  // On s'assure que l'ID est bien utilisé

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error.message);  // Log en cas d'erreur
    } else {
      console.log('Utilisateur mis à jour avec succès!');
      fetchUsers(); // Actualise la liste des utilisateurs après la mise à jour
      closeEditModal();
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.userName, { fontWeight: 'bold' }]}>
          {item.full_name || 'Nom inconnu'}
        </Text>
        <Text style={styles.userEmail}>Email : {item.email || 'Email inconnu'}</Text>
        <Text style={styles.userRole}>Rôle : {item.role || 'Utilisateur'}</Text>
        <Text style={styles.userName}>Nom d'utilisateur : {item.username || 'Nom inconnu'}</Text>
      </View>

      <Switch
        value={item.is_active ?? true}
        onValueChange={() => toggleUserActive(item.id, item.is_active ?? true)}
      />

      <TouchableOpacity
        style={styles.blockButton}
        onPress={() => toggleUserActive(item.id, item.is_active ?? true)} // Bloque/débloque l'utilisateur
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
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher par nom ou email..."
        value={searchQuery}
        onChangeText={filterUsers}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>}
      />

      {/* Modal for editing user */}
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
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
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
    backgroundColor: '#8B0000', // Dark red
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
