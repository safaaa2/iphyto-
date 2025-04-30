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
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products...');
      const { data, error } = await supabase
        .from('Produits')
        .select('*');

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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
    });
    setModalVisible(true);
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
        <Text style={styles.productDescription}>Catégorie: {item.Categorie}</Text>
        <Text style={styles.productDescription}>Formulation: {item.Formulation}</Text>
        <Text style={styles.productDescription}>Matière active: {item["Matière active"]}</Text>
        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>Teneur: {item.Teneur}</Text>
          <Text style={styles.productStock}>Valable jusqu'au: {item["Valable jusqu'au"]}</Text>
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
    <View style={[styles.container, { paddingTop: 50 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('myProducts')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleAddProduct}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={24} color="#008000" />
            <Text style={styles.addButtonText}>{t('addProduct')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                await supabase.auth.signOut();
                router.replace('/(supplier)/auth');
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
            onPress={handleAddProduct}
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
            <Text style={styles.modalTitle}>
              {editingProduct ? t('editProduct') : t('addProduct')}
            </Text>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder={t('productName')}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('description')}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <TextInput
                style={styles.input}
                placeholder={t('price')}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder={t('stock')}
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.buttonText}>{t('cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveProduct}
                  style={[styles.modalButton, styles.saveButton]}
                >
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    {t('save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    color: '#FF0000',
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
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productDetails: {
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    color: '#008000',
    marginBottom: 4,
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#008000',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  saveButtonText: {
    color: '#fff',
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