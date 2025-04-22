import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';
import { useFavorites } from '../../lib/FavoritesContext';

interface SavedProduct {
  user_id: string;
  "Numéro homologation": string;
  Produits: string;
  Cible: string;
  Cultures: string;
  [key: string]: string | null | undefined;
}

type utilisation = {
  'Numéro homologation': string;
  Produits: string;
  Cible: string;
  Cultures: string;
  'Matière active'?: string;
  'Valable jusqu\'au'?: string;
  Fournisseur: string | null;
  Détenteur: string | null;
  'Tableau toxicologique': string | null;
  Categorie: string | null;
  Formulation: string | null;
  Teneur: string | null;
  Dose?: string;
  DAR?: string;
  'Nbr_d\'app'?: string;
};

interface ProductData {
  "Numéro homologation": string;
  Produits: string;
  Cible: string;
  Cultures: string;
  Categorie?: string | null;
  "Valable jusqu'au"?: string | null;
  "Matière active"?: string | null;
  Fournisseur?: string | null;
  Détenteur?: string | null;
  Dose?: string | null;
  DAR?: string | null;
  "Nbr_d'app"?: string | null;
  Formulation?: string | null;
  "Tableau toxicologique"?: string | null;
  Teneur?: string | null;
}

interface FilterState {
  Produits: string;
  Matière_active: string;
  Cultures: string;
  Cible: string;
}

interface Product {
  "Numéro homologation": string;
  Produits: string;
  Cible: string;
  Cultures: string;
  Categorie?: string | null;
  "Valable jusqu'au"?: string | null;
  "Matière active"?: string | null;
  Fournisseur?: string | null;
  Détenteur?: string | null;
  Dose?: string | null;
  DAR?: string | null;
  "Nbr_d'app"?: string | null;
  Formulation?: string | null;
  "Tableau toxicologique"?: string | null;
  Teneur?: string | null;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    Produits: '',
    Matière_active: '',
    Cultures: '',
    Cible: ''
  });
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
  const { refreshFavorites, triggerRefresh } = useFavorites();
  
  useEffect(() => {
    const fetchSavedProducts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: savedProductsData, error } = await supabase
          .from('saved_products')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Erreur lors de la récupération des favoris:', error);
          return;
        }

        console.log('Mise à jour des favoris:', savedProductsData);
        const savedProductsSet = new Set(
          savedProductsData.map(product => `${product.Produits}-${product.Cultures}`)
        );
        setSavedProducts(savedProductsSet);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    fetchSavedProducts();
  }, [refreshFavorites]);
  
  const handleSearch = () => {
    setLoading(true);
  };
  const handleSaveProduct = async (product: ProductData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour sauvegarder des produits.');
        return;
      }

      // Vérifier si le produit est déjà sauvegardé pour cette culture spécifique
      const { data: existingProduct } = await supabase
        .from('saved_products')
        .select('*')
        .eq('user_id', user.id)
        .eq('Numéro homologation', product['Numéro homologation'])
        .eq('Cultures', product.Cultures)
        .single();

      if (existingProduct) {
        Alert.alert('Information', 'Ce produit est déjà dans vos favoris pour cette culture.');
        return;
      }

      const productData = {
        user_id: user.id,
        "Numéro homologation": product['Numéro homologation'],
        Produits: product.Produits,
        Cible: product.Cible,
        Cultures: product.Cultures,
        Categorie: product.Categorie || null,
        "Valable jusqu'au": product["Valable jusqu'au"] || null,
        "Matière active": product["Matière active"] || null,
        Fournisseur: product.Fournisseur || null,
        Détenteur: product.Détenteur || null,
        Dose: product.Dose || null,
        DAR: product.DAR || null,
        "Nbr_d'app": product["Nbr_d'app"] || null,
        Formulation: product.Formulation || null,
        "Tableau toxicologique": product["Tableau toxicologique"] || null,
        Teneur: product.Teneur || null,
      };

      const { error } = await supabase
        .from('saved_products')
        .insert(productData);

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        Alert.alert('Erreur', 'Impossible de sauvegarder le produit.');
        return;
      }

      // Mettre à jour l'état local des produits sauvegardés
      setSavedProducts(prev => new Set([...prev, `${product.Produits}-${product.Cultures}`]));
      
      Alert.alert('Succès', 'Produit sauvegardé avec succès!');
      triggerRefresh();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    }
  };

  const isProductSaved = (product: ProductData) => {
    return savedProducts.has(`${product.Produits}-${product.Cultures}`);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    console.log('Changement de filtre:', field, value);
    
    // Mettre à jour le filtre immédiatement
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      console.log('Nouveaux filtres:', newFilters);
      return newFilters;
    });
    
    // Déclencher la recherche immédiatement pour tous les champs
    handleApplyFilters({ ...filters, [field]: value });
  };

  const handleApplyFilters = async (currentFilters = filters) => {
    setLoading(true);
    setHasAppliedFilters(true);
    setShowFilters(false);

    try {
      console.log('Début de la recherche avec filtres:', currentFilters);

      // Construire la requête de base
      let query = supabase
        .from('utilisation')
        .select('*');

      // Appliquer les filtres pour tous les champs
      if (currentFilters.Produits) {
        console.log('Recherche Produits:', currentFilters.Produits);
        query = query.ilike('Produits', `${currentFilters.Produits}%`);
      }
      if (currentFilters.Matière_active) {
        console.log('Recherche Matière active:', currentFilters.Matière_active);
        query = query.ilike('Matière active', `${currentFilters.Matière_active}%`);
      }
      if (currentFilters.Cultures) {
        console.log('Recherche Cultures:', currentFilters.Cultures);
        query = query.ilike('Cultures', `${currentFilters.Cultures}%`);
      }
      if (currentFilters.Cible) {
        console.log('Recherche Cible:', currentFilters.Cible);
        
        // Rechercher avec et sans espace au début
        const { data: exactData, error: exactError } = await supabase
          .from('utilisation')
          .select('*')
          .or(`Cible.ilike.${currentFilters.Cible}%,Cible.ilike. ${currentFilters.Cible}%`)
          .order('Cible');

        console.log('Résultats de la recherche exacte:', exactData?.length || 0);
        
        if (exactData && exactData.length > 0) {
          // Récupérer les détails des produits
          const productDetails = await Promise.all(
            exactData.map(async (item) => {
              try {
                const { data: productData, error: productError } = await supabase
                  .from('Produits')
                  .select('*')
                  .eq('Numéro homologation', item['Numéro homologation']);

                console.log('Détails du produit:', productData);
                
                if (productError) {
                  console.error('Erreur lors de la récupération des détails:', productError);
                  return item;
                }

                return {
                  ...item,
                  Fournisseur: productData?.[0]?.Fournisseur || 'Non spécifié',
                  Détenteur: productData?.[0]?.Détenteur || 'Non spécifié',
                  'Tableau toxicologique': productData?.[0]?.['Tableau toxicologique'] || 'Non spécifié',
                  Categorie: productData?.[0]?.Categorie || 'Non spécifié',
                  Formulation: productData?.[0]?.Formulation || 'Non spécifié',
                  Teneur: productData?.[0]?.Teneur || 'Non spécifié'
                };
              } catch (error) {
                console.error('Erreur lors de la récupération des détails:', error);
                return item;
              }
            })
          );

          setFilteredProducts(productDetails);
          setLoading(false);
          return;
        }

        // Si pas de résultats, essayer une recherche plus large
        query = query.or(`Cible.ilike.%${currentFilters.Cible}%,Cible.ilike.% ${currentFilters.Cible}%`);
      }

      console.log('Exécution de la requête finale...');
      const { data, error } = await query.order('Produits', { ascending: true });

      if (error) {
        console.error('Erreur de recherche:', error);
        setLoading(false);
        return;
      }

      console.log('Résultats trouvés:', data?.length || 0);
      if (!data || data.length === 0) {
        setFilteredProducts([]);
        setLoading(false);
        return;
      }

      const productDetails = await Promise.all(
        data.map(async (item) => {
          try {
            const { data: productData, error: productError } = await supabase
              .from('Produits')
              .select('*')
              .eq('Numéro homologation', item['Numéro homologation']);

            console.log('Détails du produit:', productData);
            
            if (productError) {
              console.error('Erreur lors de la récupération des détails:', productError);
              return item;
            }

            return {
              ...item,
              Fournisseur: productData?.[0]?.Fournisseur || 'Non spécifié',
              Détenteur: productData?.[0]?.Détenteur || 'Non spécifié',
              'Tableau toxicologique': productData?.[0]?.['Tableau toxicologique'] || 'Non spécifié',
              Categorie: productData?.[0]?.Categorie || 'Non spécifié',
              Formulation: productData?.[0]?.Formulation || 'Non spécifié',
              Teneur: productData?.[0]?.Teneur || 'Non spécifié'
            };
          } catch (error) {
            console.error('Erreur lors de la récupération des détails:', error);
            return item;
          }
        })
      );

      setFilteredProducts(productDetails);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setFilters({
      Produits: '',
      Matière_active: '',
      Cultures: '',
      Cible: ''
    });
    setShowFilters(false);
    setFilteredProducts([]);
    setHasAppliedFilters(false);
  };

  useEffect(() => {
    if (!hasAppliedFilters) {
      setFilteredProducts([]); // Réinitialise les produits filtrés si aucun filtre n'a été appliqué.
    }
  }, [hasAppliedFilters]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
        <Icon name="filter-list" size={20} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Filtrer les produits</Text>
      </TouchableOpacity>
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            {[
              { label: 'Nom de produit', field: 'Produits' },
              { label: 'Matière active', field: 'Matière_active' },
              { label: 'Culture Concernée', field: 'Cultures' },
              { label: 'Maladie/Cible', field: 'Cible' }
            ].map((field, index) => (
              <View key={index} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="search" size={20} color="gray" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={field.label}
                    value={filters[field.field as keyof FilterState]}
                    placeholderTextColor="gray"
                    onChangeText={(text) => handleFilterChange(field.field as keyof FilterState, text)}
                  />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Icon name="clear" size={20} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={() => handleApplyFilters()}>
              <Icon name="filter-list" size={20} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008000" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
      {!loading && filteredProducts.length > 0 && (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.saveIcon}
                  onPress={() => handleSaveProduct(item)}
                >
                  <Icon 
                    name={isProductSaved(item) ? "bookmark" : "bookmark-border"} 
                    size={24} 
                    color={isProductSaved(item) ? "#008000" : "#666"}
                  />
                </TouchableOpacity>

                <Text style={styles.productName}>
                  <Icon name="local-offer" size={16} color="green" /> {item.Produits}
                </Text>
                <Text style={styles.productDetail1}>
                  <Icon name="" size={16} color="green" /> {item.Categorie || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="science" size={16} color="green" /> {item['Matière active'] || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="agriculture" size={16} color="green" /> <Text style={styles.boldDate}>{item.Cultures || 'Non spécifié'}</Text>
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="bug-report" size={16} color="green" /> {item.Cible || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="opacity" size={16} color="green" /> Dose:<Text style={styles.boldDate}>{item.Dose || 'Non spécifié'}</Text>
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="hourglass-bottom" size={16} color="green" /> Délais Avant récolte: {item.DAR || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="confirmation-number" size={16} color="green" /> Numéro homologation: <Text style={styles.boldDate}>{item["Numéro homologation"] || 'Non spécifié'}</Text>
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="local-shipping" size={16} color="green" /> Fournisseur:<Text style={styles.boldDate}> {item.Fournisseur || 'Non spécifié'}</Text>
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="person" size={16} color="green" /> Détenteur: {item.Détenteur ? item.Détenteur : 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="report-problem" size={16} color="red" /> Tableau toxicologique: <Text style={styles.boldDate}>{item["Tableau toxicologique"] ? item["Tableau toxicologique"] : 'Non spécifié'}</Text>
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="science" size={16} color="green" /> Formulation: <Text style={styles.boldDate}>{item.Formulation ? item.Formulation : 'Non spécifié'}</Text>
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="percent" size={16} color="green" /> Teneur: <Text style={styles.boldDate}>{item.Teneur ? item.Teneur : 'Non spécifié'}</Text>
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="event" size={16} color="black" />
                  Valable jusqu'au: <Text style={styles.boldDate}>
                    {item["Valable jusqu'au"]
                      ? new Date(item["Valable jusqu'au"]).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                      : 'Non spécifié'}
                  </Text>
                </Text>

              </View>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
      {filteredProducts.length === 0 && !loading && hasAppliedFilters && (
        <Text style={styles.noResultsText}>Aucun produit trouvé.</Text>
      )}
    </View>
  );
}

const fetchProductDetails = async (items: any[]): Promise<utilisation[]> => {
  try {
    const productsWithDetails = await Promise.all(
      items.map(async (item): Promise<utilisation> => {
        try {
          const { data: productData, error } = await supabase
            .from('Produits')
            .select('*')
            .eq('Numéro homologation', item['Numéro homologation'])
            .single();

          if (error) {
            console.error('Error fetching product details:', error);
            return {
              'Numéro homologation': item['Numéro homologation'],
              Produits: item.Produits,
              Cible: item.Cible,
              Cultures: item.Cultures,
              'Matière active': item['Matière active'],
              'Valable jusqu\'au': item['Valable jusqu\'au'],
              Dose: item.Dose,
              DAR: item.DAR,
              'Nbr_d\'app': item['Nbr_d\'app'],
              Fournisseur: null,
              Détenteur: null,
              'Tableau toxicologique': null,
              Categorie: null,
              Formulation: null,
              Teneur: null
            };
          }

          return {
            'Numéro homologation': item['Numéro homologation'],
            Produits: item.Produits,
            Cible: item.Cible,
            Cultures: item.Cultures,
            'Matière active': item['Matière active'],
            'Valable jusqu\'au': item['Valable jusqu\'au'],
            Dose: item.Dose,
            DAR: item.DAR,
            'Nbr_d\'app': item['Nbr_d\'app'],
            Fournisseur: productData?.Fournisseur || null,
            Détenteur: productData?.Détenteur || null,
            'Tableau toxicologique': productData?.['Tableau toxicologique'] || null,
            Categorie: productData?.Categorie || null,
            Formulation: productData?.Formulation || null,
            Teneur: productData?.Teneur || null
          };
        } catch (error) {
          console.error('Error in product details processing:', error);
          return {
            'Numéro homologation': item['Numéro homologation'],
            Produits: item.Produits,
            Cible: item.Cible,
            Cultures: item.Cultures,
            'Matière active': item['Matière active'],
            'Valable jusqu\'au': item['Valable jusqu\'au'],
            Dose: item.Dose,
            DAR: item.DAR,
            'Nbr_d\'app': item['Nbr_d\'app'],
            Fournisseur: null,
            Détenteur: null,
            'Tableau toxicologique': null,
            Categorie: null,
            Formulation: null,
            Teneur: null
          };
        }
      })
    );
    return productsWithDetails;
  } catch (error) {
    console.error('Error in fetchProductDetails:', error);
    return [];
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  saveIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  filterButton: {
    backgroundColor: '#008000',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  boldDate: {
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  filtersContainer: {
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inputGroup: {
    width: '48%',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    backgroundColor: 'white',
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 5,
  },
  input: {
    flex: 1,
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  clearButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#008000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 5,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: 'gray',
  },
  cardContainer: {
    marginBottom: 10,
  },
  card: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008000',
  },
  productDetail: {
    fontSize: 14,
    color: 'black',
    marginTop: 5,
  },
  productDetail1: {
    fontSize: 14,
    color: "black",
    marginTop: 5,
    fontStyle: "italic",
    fontWeight: "bold"
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'black',
    fontStyle: 'italic',
  },
});
