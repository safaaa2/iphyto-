import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Product {
  id: string;
  Categorie: string;
  Détenteur: string;
  Formulation: string;
  Fournisseur: string;
  "Matière active": string;
  "Numéro homologation": string;
  Produits: string;
  "Tableau toxicologique": string;
  Teneur: string;
  "Valable jusqu'au": string;
}

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    detenteur: '',
    numero_homologation: '',
    valable_jusqu_au: '',
    tableau_toxicologique: '',
    formulation: '',
    matiere_active: '',
    teneur: '',
    categorie: '',
  });
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products...');
      
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les informations du fournisseur depuis la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('fournisseur')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData.fournisseur) {
        throw new Error('Utilisateur non autorisé');
      }

      // Récupérer les produits du fournisseur
      const { data, error } = await supabase
        .from('Produits')
        .select('*')
        .eq('Fournisseur', profileData.fournisseur);

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Products fetched:', data);
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error in fetchProducts:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      console.log('Utilisateur connecté:', user.id);

      // Récupérer le nom du fournisseur depuis la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('fournisseur')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        throw profileError;
      }

      if (!profileData || !profileData.fournisseur) {
        console.error('Profil ou fournisseur non trouvé');
        Alert.alert('Erreur', 'Profil fournisseur non trouvé');
        return;
      }

      console.log('Données du profil:', profileData);

      const productData = {
        "Produits": newProduct.name,
        "Détenteur": newProduct.detenteur,
        "Numéro homologation": newProduct.numero_homologation,
        "Valable jusqu'au": newProduct.valable_jusqu_au,
        "Tableau toxicologique": newProduct.tableau_toxicologique,
        "Formulation": newProduct.formulation,
        "Matière active": newProduct.matiere_active,
        "Teneur": newProduct.teneur,
        "Categorie": newProduct.categorie,
        "Fournisseur": profileData.fournisseur
      };

      console.log('Données du produit à insérer:', productData);

      // Vérifier si tous les champs requis sont remplis
      const requiredFields = ['Produits', 'Détenteur', 'Numéro homologation', 'Valable jusqu\'au'];
      const missingFields = requiredFields.filter(field => !productData[field]);
      
      if (missingFields.length > 0) {
        Alert.alert('Erreur', `Veuillez remplir tous les champs obligatoires: ${missingFields.join(', ')}`);
        return;
      }

      const { data, error } = await supabase
        .from('Produits')
        .insert([productData])
        .select();

      if (error) {
        console.error('Erreur détaillée lors de l\'insertion:', error);
        throw error;
      }

      console.log('Produit ajouté avec succès:', data);

      setNewProduct({
        name: '',
        detenteur: '',
        numero_homologation: '',
        valable_jusqu_au: '',
        tableau_toxicologique: '',
        formulation: '',
        matiere_active: '',
        teneur: '',
        categorie: '',
      });
      setModalVisible(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.Produits,
      description: product.Formulation,
      price: product.Teneur,
      stock: product["Valable jusqu'au"],
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('Produits')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      fetchProducts();
    } catch (error: any) {
      Alert.alert(t('error'), error.message);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        Produits: formData.name,
        Formulation: formData.description,
        Teneur: formData.price,
        "Valable jusqu'au": formData.stock,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('Produits')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('Produits')
          .insert([productData]);

        if (error) throw error;
      }

      setModalVisible(false);
      fetchProducts();
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le produit');
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.Produits}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="pricetag-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Catégorie: <Text style={styles.boldText}>{item.Categorie}</Text>
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="flask-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Formulation: <Text style={styles.boldText}>{item.Formulation}</Text>
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="leaf-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Matière active: <Text style={styles.boldText}>{item["Matière active"]}</Text>
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Fournisseur: <Text style={styles.boldText}>{item.Fournisseur}</Text>
          </Text>
        </View>
        <View style={styles.productDetails}>
          <View style={styles.infoRow}>
            <Ionicons name="analytics-outline" size={16} color="#008000" style={styles.infoIcon} />
            <Text style={styles.productPrice}>
              Teneur: <Text style={styles.boldText}>{item.Teneur}</Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#008000" style={styles.infoIcon} />
            <Text style={styles.productStock}>
              Valable jusqu'au: <Text style={styles.boldText}>{item["Valable jusqu'au"]}</Text>
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          onPress={() => handleEditProduct(item)}
          style={styles.actionButton}
        >
          <Ionicons name="pencil" size={24} color="#008000" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteProduct(item.id)}
          style={styles.actionButton}
        >
          <Ionicons name="trash" size={24} color="#ff0000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? 85 : 60 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('myProducts')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            key="add-product-button"
            onPress={() => setModalVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={24} color="#008000" />
            <Text style={styles.addButtonText}>{t('addProduct')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            key="logout-button"
            onPress={async () => {
              try {
                await supabase.auth.signOut();
                router.replace('/');
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF0000" />
            <Text style={styles.logoutButtonText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>Chargement...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noProductsText}>Aucun produit trouvé</Text>
          <TouchableOpacity
            key="add-first-product"
            onPress={() => setModalVisible(true)}
            style={styles.addFirstProductButton}
          >
            <Text style={styles.addFirstProductText}>Ajouter un produit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un produit</Text>
            
            <TextInput
              key="name-input"
              style={styles.input}
              placeholder="Nom du produit"
              value={newProduct.name}
              onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
            />

            <TextInput
              key="detenteur-input"
              style={styles.input}
              placeholder="Détenteur"
              value={newProduct.detenteur}
              onChangeText={(text) => setNewProduct({ ...newProduct, detenteur: text })}
            />

            <TextInput
              key="numero-homologation-input"
              style={styles.input}
              placeholder="Numéro d'homologation"
              value={newProduct.numero_homologation}
              onChangeText={(text) => setNewProduct({ ...newProduct, numero_homologation: text })}
            />

            <TextInput
              key="valable-jusqu-au-input"
              style={styles.input}
              placeholder="Valable jusqu'au (YYYY-MM-DD)"
              value={newProduct.valable_jusqu_au}
              onChangeText={(text) => setNewProduct({ ...newProduct, valable_jusqu_au: text })}
            />

            <TextInput
              key="tableau-toxicologique-input"
              style={styles.input}
              placeholder="Tableau toxicologique"
              value={newProduct.tableau_toxicologique}
              onChangeText={(text) => setNewProduct({ ...newProduct, tableau_toxicologique: text })}
            />

            <TextInput
              key="formulation-input"
              style={styles.input}
              placeholder="Formulation"
              value={newProduct.formulation}
              onChangeText={(text) => setNewProduct({ ...newProduct, formulation: text })}
            />

            <TextInput
              key="matiere-active-input"
              style={styles.input}
              placeholder="Matière active"
              value={newProduct.matiere_active}
              onChangeText={(text) => setNewProduct({ ...newProduct, matiere_active: text })}
            />

            <TextInput
              key="teneur-input"
              style={styles.input}
              placeholder="Teneur"
              value={newProduct.teneur}
              onChangeText={(text) => setNewProduct({ ...newProduct, teneur: text })}
            />

            <TextInput
              key="categorie-input"
              style={styles.input}
              placeholder="Catégorie"
              value={newProduct.categorie}
              onChangeText={(text) => setNewProduct({ ...newProduct, categorie: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                key="cancel-button"
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                key="save-button"
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddProduct}
              >
                <Text style={styles.buttonText}>Enregistrer</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 5,
    color: '#008000',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF0000',
    gap: 5,
  },
  logoutButtonText: {
    color:'#8B0000' ,
    fontWeight: '600',
  },
  productList: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  productDescription: {
    fontSize: 14,
    color: "black",
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  productDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  productPrice: {
    fontSize: 14,
    color: '#008000',
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  productActions: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor:'#8B0000' ,
  },
  saveButton: {
    backgroundColor: '#008000',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noProductsText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  addFirstProductButton: {
    backgroundColor: '#008000',
    padding: 15,
    borderRadius: 8,
  },
  addFirstProductText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 