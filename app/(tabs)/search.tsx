import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../lib/supabase';
import { useFavorites } from '../../lib/FavoritesContext';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
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
        Alert.alert(t('error'), t('mustBeLoggedIn'));
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
        Alert.alert(t('info'), t('productAlreadySaved'));
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
        Alert.alert(t('error'), t('saveError'));
        return;
      }

      // Mettre à jour l'état local des produits sauvegardés
      setSavedProducts(prev => new Set([...prev, `${product.Produits}-${product.Cultures}`]));
      
      Alert.alert(t('success'), t('productSaved'));
      triggerRefresh();
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert(t('error'), t('saveError'));
    }
  };

  const isProductSaved = (product: ProductData) => {
    return savedProducts.has(`${product.Produits}-${product.Cultures}`);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    console.log('Changement de filtre:', field, value);
    
    // Mettre à jour le filtre sans déclencher la recherche
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      console.log('Nouveaux filtres:', newFilters);
      return newFilters;
    });
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

  const toggleProductDetails = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
        <Icon name="filter-variant" size={24} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>{t('filterProducts')}</Text>
      </TouchableOpacity>
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            {[
              { label: t('productName'), field: 'Produits', icon: 'leaf' },
              { label: t('activeIngredient'), field: 'Matière_active', icon: 'flask' },
              { label: t('targetCrop'), field: 'Cultures', icon: 'tree' },
              { label: t('targetDisease'), field: 'Cible', icon: 'bug' }
            ].map((field, index) => (
              <View key={index} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Icon name={field.icon} size={20} color="green" style={styles.inputIcon} />
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
              <Icon name="close-circle" size={20} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>{t('clearAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={() => handleApplyFilters()}>
              <Icon name="check-circle" size={20} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>{t('applyFilters')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008000" />
          <Text style={styles.loadingText}>{t('searching')}</Text>
        </View>
      )}
      {!loading && filteredProducts.length > 0 && (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.productTitleRow}>
                      <Icon name="leaf" size={18} color="green" style={styles.titleIcon} />
                      <Text style={styles.productName}>{item.Produits}</Text>
                    </View>
                    {item.Categorie && (
                      <Text style={styles.productCategory}>{item.Categorie}</Text>
                    )}
                  </View>
                  <View style={styles.headerRight}>
                    <TouchableOpacity
                      style={styles.saveIcon}
                      onPress={() => handleSaveProduct(item)}
                    >
                      <Icon 
                        name={isProductSaved(item) ? "bookmark" : "bookmark-outline"} 
                        size={24} 
                        color={isProductSaved(item) ? "#008000" : "#666"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {item.Formulation && (
                  <View style={styles.formulationRow}>
                    <Icon name="flask" size={16} color="green" style={styles.icon} />
                    <Text style={styles.formulationText}>{item.Formulation}</Text>
                  </View>
                )}

                <View style={styles.cultureRow}>
                  <Icon name="tree" size={20} color="green" style={styles.icon} />
                  <View style={styles.cultureBadge}>
                    <Text style={styles.cultureText}>{item.Cultures}</Text>
                  </View>
                </View>

                <View style={styles.targetRow}>
                  <Icon name="bug" size={18} color="green" style={styles.icon} />
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetText}>
                      {item.Cultures} / {item.Cible}
                    </Text>
                  </View>
                </View>

                {item["Valable jusqu'au"] && (
                  <View style={styles.dateRow}>
                    <Icon name="calendar" size={16} color="green" style={styles.icon} />
                    <Text style={{ fontSize: 14, color: 'black' }}>
                    Valable jusqu'au : {new Date(item["Valable jusqu'au"]).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.showDetailsButton}
                  onPress={() => toggleProductDetails(item['Numéro homologation'])}
                >
                  <Icon 
                    name={expandedProduct === item['Numéro homologation'] ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#008000" 
                    style={styles.icon} 
                  />
                  <Text style={styles.showDetailsText}>
                    {expandedProduct === item['Numéro homologation'] ? t('hideDetails') : t('showDetails')}
                  </Text>
                </TouchableOpacity>

                {expandedProduct === item['Numéro homologation'] && (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailsTitle}>{t('details')}:</Text>
                    {item.Fournisseur && <Text style={styles.detailText}>{t('supplier')}: <Text style={styles.boldText}>{item.Fournisseur}</Text></Text>}
                    {item.Détenteur && <Text style={styles.detailText}>{t('holder')}: <Text style={styles.boldText}>{item.Détenteur}</Text></Text>}
                    {item["Matière active"] && <Text style={styles.detailText}>{t('activeMatter')}: <Text style={styles.boldText}>{item["Matière active"]}</Text></Text>}
                    {item.Teneur && <Text style={styles.detailText}>{t('content')}: <Text style={styles.boldText}>{item.Teneur}</Text></Text>}
                    {item.Dose && <Text style={styles.detailText}>{t('dose')}: <Text style={styles.boldText}>{item.Dose}</Text></Text>}
                    {item.DAR && <Text style={styles.detailText}>{t('dar')}: <Text style={styles.boldText}>{item.DAR}</Text></Text>}
                    {item["Nbr_d'app"] && <Text style={styles.detailText}>{t('applicationsNumber')}: <Text style={styles.boldText}>{item["Nbr_d'app"]}</Text></Text>}
                    {item["Numéro homologation"] && <Text style={styles.detailText}>{t('homologationNumber')}: <Text style={styles.boldText}>{item["Numéro homologation"]}</Text></Text>}
                    {item["Tableau toxicologique"] && <Text style={styles.detailText}>{t('toxicologicalTable')}: <Text style={styles.boldText}>{item["Tableau toxicologique"]}</Text></Text>}
                  </View>
                )}
              </View>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
      {filteredProducts.length === 0 && !loading && hasAppliedFilters && (
        <Text style={styles.noResultsText}>{t('noProductsFound')}</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
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
    color: 'black',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 15,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    marginBottom: 15,
  },
  card: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 10,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleIcon: {
    marginRight: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productCategory: {
    fontSize: 14,
    color: 'black',
    marginBottom: 10,
  },
  formulationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  formulationText: {
    fontSize: 14,
    color: 'black',
  },
  cultureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cultureBadge: {
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  cultureText: {
    fontSize: 14,
    color: 'black',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  targetBadge: {
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  targetText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  showDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  showDetailsText: {
    color: '#008000',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  detailsContainer: {
    marginTop: 10,
    backgroundColor: '#e6f5ea',
    borderRadius: 10,
    padding: 12,
  },
  detailsTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  detailText: {
    marginBottom: 4,
    color: '#333',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
    color: 'black',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'black',
    fontStyle: 'italic',
  },
});
