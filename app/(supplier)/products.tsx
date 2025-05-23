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
  Cultures: string;
  Cible: string;
  Prix: string;
  Nbr_d_app?: string;
  DAR?: string;
  DOSE?: string;
  Utilisation?: string;
}

interface ProductData {
  Produits: string;
  Détenteur: string;
  "Numéro homologation": string;
  "Valable jusqu'au": string;
  "Tableau toxicologique": string;
  Formulation: string;
  "Matière active": string;
  Teneur: string;
  Categorie: string;
  Fournisseur: string;
}

// Fonction pour générer un ID unique
const generateUniqueId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
    cultures: '',
    cible: '',
    prix: '',
    nbr_d_app: '',
    dar: '',
    dose: '',
    utilisation: '',
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
      const { data: productsData, error: productsError } = await supabase
        .from('Produits')
        .select('*')
        .eq('Fournisseur', profileData.fournisseur);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
      }

      // Pour chaque produit, récupérer les informations d'utilisation
      const productsWithUtilization = await Promise.all(
        (productsData || []).map(async (product) => {
          // Récupérer les données d'utilisation en utilisant le numéro d'homologation
          const { data: utilizationData, error: utilizationError } = await supabase
            .from('utilisation')
            .select('*')
            .eq('Numéro homologation', product['Numéro homologation']);

          console.log('Utilization data for product:', product['Numéro homologation'], utilizationData);

          if (utilizationError) {
            console.error('Error fetching utilization data:', utilizationError);
            return product;
          }

          // Si nous avons des données d'utilisation, prendre la première entrée
          const firstUtilization = utilizationData && utilizationData.length > 0 ? utilizationData[0] : null;

          // Fusionner les données du produit avec les données d'utilisation
          return {
            ...product,
            Nbr_d_app: firstUtilization?.['Nbr_d\'app'] || null,
            DAR: firstUtilization?.DAR || null,
            DOSE: firstUtilization?.Dose || null,
            Utilisation: firstUtilization?.utilisation || null,
            Cultures: firstUtilization?.Cultures || product.Cultures,
            Cible: firstUtilization?.Cible || product.Cible
          };
        })
      );
      
      console.log('Products with utilization data:', productsWithUtilization);
      setProducts(productsWithUtilization);
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

      // Vérifier si le numéro d'homologation existe déjà
      const { data: existingProduct, error: checkError } = await supabase
        .from('Produits')
        .select('*')
        .eq('Numéro homologation', newProduct.numero_homologation)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 signifie "aucun résultat trouvé"
        console.error('Erreur lors de la vérification du numéro d\'homologation:', checkError);
        throw checkError;
      }

      if (existingProduct) {
        Alert.alert(
          'Erreur',
          'Un produit avec ce numéro d\'homologation existe déjà. Veuillez utiliser un numéro différent.'
        );
        return;
      }

      const productData: ProductData = {
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

      // Données pour la table utilisation
      const utilisationData = {
        "Numéro homologation": newProduct.numero_homologation,
        "Produits": newProduct.name,
        "Cultures": newProduct.cultures,
        "Cible": newProduct.cible,
        "Nbr_d'app": newProduct.nbr_d_app,
        "DAR": newProduct.dar,
        "Dose": newProduct.dose,
        "utilisation": newProduct.utilisation,
        "Valable jusqu'au": newProduct.valable_jusqu_au,
      };

      console.log('Données du produit à insérer:', productData);
      console.log('Données d\'utilisation à insérer:', utilisationData);

      // Vérifier si tous les champs requis sont remplis
      const requiredFields: (keyof ProductData)[] = ['Produits', 'Détenteur', 'Numéro homologation', 'Valable jusqu\'au'];
      const missingFields = requiredFields.filter(field => !productData[field]);
      
      if (missingFields.length > 0) {
        Alert.alert('Erreur', `Veuillez remplir tous les champs obligatoires: ${missingFields.join(', ')}`);
        return;
      }

      try {
        // Insérer dans la table Produits
        const { data: productInsertData, error: productError } = await supabase
          .from('Produits')
          .insert([productData])
          .select();

        if (productError) {
          console.error('Erreur détaillée lors de l\'insertion du produit:', productError);
          if (productError.code === '23505') {
            Alert.alert(
              'Erreur',
              'Un produit avec ces informations existe déjà. Veuillez vérifier les données et réessayer.'
            );
            return;
          }
          throw productError;
        }

        // Insérer dans la table utilisation
        const { error: utilisationError } = await supabase
          .from('utilisation')
          .insert([utilisationData]);

        if (utilisationError) {
          console.error('Erreur détaillée lors de l\'insertion des données d\'utilisation:', utilisationError);
          if (utilisationError.code === '42501') {
            Alert.alert(
              'Erreur de permission',
              'Vous n\'avez pas les permissions nécessaires pour ajouter des données d\'utilisation. Veuillez contacter l\'administrateur.'
            );
            return;
          }
          throw utilisationError;
        }

        console.log('Produit et données d\'utilisation ajoutés avec succès');

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
          cultures: '',
          cible: '',
          prix: '',
          nbr_d_app: '',
          dar: '',
          dose: '',
          utilisation: '',
        });
        setModalVisible(false);
        fetchProducts();
      } catch (error: any) {
        console.error('Erreur lors de l\'ajout du produit:', error);
        Alert.alert('Erreur', 'Impossible d\'ajouter le produit: ' + (error.message || 'Erreur inconnue'));
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.Produits,
      detenteur: product.Détenteur,
      numero_homologation: product["Numéro homologation"],
      valable_jusqu_au: product["Valable jusqu'au"],
      tableau_toxicologique: product["Tableau toxicologique"],
      formulation: product.Formulation,
      matiere_active: product["Matière active"],
      teneur: product.Teneur,
      categorie: product.Categorie,
      cultures: product.Cultures,
      cible: product.Cible,
      prix: product.Prix,
      nbr_d_app: product.Nbr_d_app || '',
      dar: product.DAR || '',
      dose: product.DOSE || '',
      utilisation: product.Utilisation || '',
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce produit ? Toutes les utilisations associées seront supprimées.',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer toutes les utilisations associées
              const { error: utilisationError } = await supabase
                .from('utilisation')
                .delete()
                .eq('Numéro homologation', productId);

              if (utilisationError) {
                console.error('Erreur lors de la suppression des utilisations:', utilisationError);
                throw utilisationError;
              }

              // Ensuite supprimer le produit
              const { error: productError } = await supabase
                .from('Produits')
                .delete()
                .eq('Numéro homologation', productId);

              if (productError) {
                console.error('Erreur lors de la suppression du produit:', productError);
                throw productError;
              }
              Alert.alert('Succès', 'Produit et utilisations associées supprimés avec succès');
              fetchProducts();
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible de supprimer le produit: ' + (error.message || 'Erreur inconnue'));
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleSaveProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

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

      // Données pour la table Produits
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

      // Données pour la table utilisation
      const utilisationData = {
        "Numéro homologation": newProduct.numero_homologation,
        "Produits": newProduct.name,
        "Cultures": newProduct.cultures || null,
        "Cible": newProduct.cible || null,
        "Nbr_d'app": newProduct.nbr_d_app || null,
        "DAR": newProduct.dar || null,
        "Dose": newProduct.dose || null,
        "utilisation": newProduct.utilisation || null,
        "Valable jusqu'au": newProduct.valable_jusqu_au,
      };

      console.log('Données d\'utilisation à sauvegarder:', utilisationData);

      if (editingProduct) {
        console.log('Mise à jour du produit:', editingProduct["Numéro homologation"]);
        
        // Mise à jour du produit
        const { error: productError } = await supabase
          .from('Produits')
          .update(productData)
          .eq('Numéro homologation', editingProduct["Numéro homologation"]);

        if (productError) {
          console.error('Erreur lors de la mise à jour du produit:', productError);
          throw productError;
        }

        // Vérifier si une entrée d'utilisation existe déjà
        const { data: existingUtilisation, error: checkError } = await supabase
          .from('utilisation')
          .select('*')
          .eq('Numéro homologation', editingProduct["Numéro homologation"])
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Erreur lors de la vérification des données d\'utilisation:', checkError);
          throw checkError;
        }

        if (existingUtilisation) {
          // Mise à jour des données d'utilisation existantes
          const { error: utilisationError } = await supabase
            .from('utilisation')
            .update(utilisationData)
            .eq('Numéro homologation', editingProduct["Numéro homologation"]);

          if (utilisationError) {
            console.error('Erreur lors de la mise à jour des données d\'utilisation:', utilisationError);
            if (utilisationError.code !== '42501') {
              throw utilisationError;
            }
          }
        } else {
          // Création d'une nouvelle entrée d'utilisation
          const { error: utilisationError } = await supabase
            .from('utilisation')
            .insert([utilisationData]);

          if (utilisationError) {
            console.error('Erreur lors de l\'ajout des données d\'utilisation:', utilisationError);
            if (utilisationError.code !== '42501') {
              throw utilisationError;
            }
          }
        }

        Alert.alert('Succès', 'Produit mis à jour avec succès');
      } else {
        // Ajout d'un nouveau produit
        const { error: productError } = await supabase
          .from('Produits')
          .insert([productData]);

        if (productError) {
          console.error('Erreur lors de l\'ajout du produit:', productError);
          throw productError;
        }

        // Ajout des données d'utilisation
        const { error: utilisationError } = await supabase
          .from('utilisation')
          .insert([utilisationData]);

        if (utilisationError) {
          console.error('Erreur lors de l\'ajout des données d\'utilisation:', utilisationError);
          if (utilisationError.code !== '42501') {
            throw utilisationError;
          }
        }

        Alert.alert('Succès', 'Produit ajouté avec succès');
      }

      setModalVisible(false);
      setEditingProduct(null);
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
        cultures: '',
        cible: '',
        prix: '',
        nbr_d_app: '',
        dar: '',
        dose: '',
        utilisation: '',
      });
      
      // Rafraîchir la liste des produits
      await fetchProducts();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du produit:', error);
      if (error.code === '42501') {
        Alert.alert('Erreur', 'Vous n\'avez pas les permissions nécessaires pour modifier les données d\'utilisation. Veuillez contacter l\'administrateur.');
      } else {
        Alert.alert('Erreur', 'Impossible de sauvegarder le produit: ' + (error.message || 'Erreur inconnue'));
      }
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.Produits}</Text>
        <View style={styles.infoRow} key="category">
          <Ionicons name="pricetag-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Catégorie: <Text style={styles.boldText}>{item.Categorie}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="formulation">
          <Ionicons name="flask-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Formulation: <Text style={styles.boldText}>{item.Formulation}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="detenteur">
          <Ionicons name="flask-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Detenteur: <Text style={styles.boldText}>{item.Détenteur}</Text>
          </Text>
        </View>
      
        <View style={styles.infoRow} key="numero-homologation">
          <Ionicons name="flask-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
          Numéro homologation: <Text style={styles.boldText}>{item['Numéro homologation']}</Text>
          </Text>
        </View>
         <View style={styles.infoRow} key="tableau-toxicologique">
          <Ionicons name="flask-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Tableau Toxicologique: <Text style={styles.boldText}>{item['Tableau toxicologique']}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="matiere-active">
          <Ionicons name="leaf-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Matière active: <Text style={styles.boldText}>{item["Matière active"]}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="fournisseur">
          <Ionicons name="business-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Fournisseur: <Text style={styles.boldText}>{item.Fournisseur}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="teneur">
          <Ionicons name="analytics-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Teneur: <Text style={styles.boldText}>{item.Teneur}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="valable-jusqu-au">
          <Ionicons name="calendar-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Valable jusqu'au: <Text style={styles.boldText}>{item["Valable jusqu'au"]}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="cultures">
          <Ionicons name="leaf-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Cultures: <Text style={styles.boldText}>{item.Cultures}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="cible">
          <Ionicons name="bug-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Cible: <Text style={styles.boldText}>{item.Cible}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="nbr-d-app">
          <Ionicons name="repeat-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Nombre d'applications: <Text style={styles.boldText}>{item.Nbr_d_app || 'Non spécifié'}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="dar">
          <Ionicons name="calculator-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            DAR: <Text style={styles.boldText}>{item.DAR || 'Non spécifié'}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="dose">
          <Ionicons name="scale-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            DOSE: <Text style={styles.boldText}>{item.DOSE || 'Non spécifié'}</Text>
          </Text>
        </View>
        <View style={styles.infoRow} key="utilisation">
          <Ionicons name="information-circle-outline" size={16} color="#008000" style={styles.infoIcon} />
          <Text style={styles.productDescription}>
            Utilisation: <Text style={styles.boldText}>{item.Utilisation || 'Non spécifié'}</Text>
          </Text>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          key="edit-button"
          onPress={() => handleEditProduct(item)}
          style={styles.actionButton}
        >
          <Ionicons name="pencil" size={24} color="#008000" />
        </TouchableOpacity>
        <TouchableOpacity
          key="delete-button"
          onPress={() => handleDeleteProduct(item["Numéro homologation"])}
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
            <Ionicons name="add-circle" size={24} color="#ffffff" />
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
            <Ionicons name="log-out-outline" size={24} color="#ff0000" />
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
          keyExtractor={(item, idx) => item.id ? String(item.id) : String(idx)}
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
          <ScrollView style={styles.modalScrollView}>
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

              <TextInput
                key="cultures-input"
                style={styles.input}
                placeholder="Cultures"
                value={newProduct.cultures}
                onChangeText={(text) => setNewProduct({ ...newProduct, cultures: text })}
              />

              <TextInput
                key="cible-input"
                style={styles.input}
                placeholder="Cible"
                value={newProduct.cible}
                onChangeText={(text) => setNewProduct({ ...newProduct, cible: text })}
              />

              <TextInput
                key="prix-input"
                style={styles.input}
                placeholder="Prix"
                value={newProduct.prix}
                onChangeText={(text) => setNewProduct({ ...newProduct, prix: text })}
                keyboardType="numeric"
              />

              <TextInput
                key="nbr-d-app-input"
                style={styles.input}
                placeholder="Nombre d'applications"
                value={newProduct.nbr_d_app}
                onChangeText={(text) => setNewProduct({ ...newProduct, nbr_d_app: text })}
                keyboardType="numeric"
              />

              <TextInput
                key="dar-input"
                style={styles.input}
                placeholder="DAR"
                value={newProduct.dar}
                onChangeText={(text) => setNewProduct({ ...newProduct, dar: text })}
              />

              <TextInput
                key="dose-input"
                style={styles.input}
                placeholder="DOSE"
                value={newProduct.dose}
                onChangeText={(text) => setNewProduct({ ...newProduct, dose: text })}
              />

              <TextInput
                key="utilisation-input"
                style={styles.input}
                placeholder="Utilisation"
                value={newProduct.utilisation}
                onChangeText={(text) => setNewProduct({ ...newProduct, utilisation: text })}
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
                  onPress={handleSaveProduct}
                >
                  <Text style={styles.buttonText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 6,
  },
  addButtonText: {
    marginLeft: 4,
    color: '#ffffff',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  logoutButtonText: {
    color: '#f44336',
    fontWeight: '500',
  },
  productList: {
    padding: 12,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
    color: '#4CAF50',
  },
  productDescription: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
  },
  boldText: {
    fontWeight: '500',
    color: '#000000',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fafafa',
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
  modalScrollView: {
    width: '100%',
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    alignSelf: 'center',
    marginVertical: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noProductsText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  addFirstProductButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
  },
  addFirstProductText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 