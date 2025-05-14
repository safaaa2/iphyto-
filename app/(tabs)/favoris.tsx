import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ViewStyle, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';
import { useFavorites } from '../../lib/FavoritesContext';

type SavedProduct = {
  user_id: string;
  "Numéro homologation": string;
  Produits: string;
  Cible: string;
  Cultures: string;
  Categorie: string;
  "Valable jusqu'au"?: string;
  "Matière active"?: string;
  Fournisseur?: string;
  Détenteur?: string;
  Dose?: string;
  DAR?: string;
  "Nbr_d'app"?: string;
  Formulation?: string;
  "Tableau toxicologique"?: string;
  Teneur?: string;
};

export default function FavoritesScreen() {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const { refreshFavorites, triggerRefresh } = useFavorites();

  useEffect(() => {
    fetchSavedProducts();
  }, [refreshFavorites]);

  const fetchSavedProducts = async () => {
    try {
      console.log('Début de fetchSavedProducts');
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      console.log('ID utilisateur:', userId);

      if (!userId) {
        console.log('Pas d\'utilisateur connecté');
        Alert.alert('Erreur', 'Vous devez être connecté pour voir vos favoris.');
        return;
      }

      console.log('Récupération des produits favoris pour l\'utilisateur:', userId);
      const { data, error } = await supabase
        .from('saved_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('Résultat de la requête:', data);
      console.log('Erreur éventuelle:', error);

      if (error) {
        console.error('Erreur lors de la récupération des favoris:', error);
        Alert.alert('Erreur', 'Impossible de charger vos favoris.');
        return;
      }

      setSavedProducts(data || []);
      console.log('Produits favoris mis à jour:', data || []);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (product: SavedProduct) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('saved_products')
        .delete()
        .eq('user_id', user.id)
        .eq('Numéro homologation', product['Numéro homologation'])
        .eq('Cultures', product.Cultures);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        return;
      }

      console.log('Produit supprimé avec succès');
      triggerRefresh(); // Déclencher la mise à jour des favoris
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const toggleProductDetails = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Chargement des favoris...</Text>
        </View>
      ) : savedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="favorite-border" size={50} color="#666" />
          <Text style={styles.emptyText}>Aucun produit favori</Text>
        </View>
      ) : (
        <>
          <Text style={styles.favoritesTitle}>Mes favoris</Text>
          <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            data={savedProducts}
            keyExtractor={(item, index) => `${item["Numéro homologation"]}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.productName}>
                      <Icon name="local-offer" size={16} color="green" /> {item.Produits}
                    </Text>
                    <Text style={styles.productCategory}>
                      <Icon name="category" size={16} color="green" /> {item.Categorie || 'Non spécifié'}
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => {}}
                    >
                      <Icon name="favorite" size={24} color="#2E7D32" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveProduct(item)}
                    >
                      <Icon name="delete" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Informations principales</Text>
                    <View style={styles.infoRow}>
                      <Icon name="science" size={16} color="green" />
                      <Text style={styles.infoText}>Matière active: {item['Matière active'] || 'Non spécifié'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Icon name="agriculture" size={16} color="green" />
                      <Text style={styles.infoText}>Cultures: {item.Cultures || 'Non spécifié'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Icon name="bug-report" size={16} color="green" />
                      <Text style={styles.infoText}>Cible: {item.Cible || 'Non spécifié'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.moreDetailsButton}
                    onPress={() => toggleProductDetails(item["Numéro homologation"])}
                  >
                    <Text style={styles.moreDetailsText}>
                      {expandedProducts.has(item["Numéro homologation"]) ? "Masquer les détails" : "Voir plus de détails"}
                    </Text>
                    <Icon 
                      name={expandedProducts.has(item["Numéro homologation"]) ? "expand-less" : "expand-more"} 
                      size={24} 
                      color="#666" 
                    />
                  </TouchableOpacity>

                  {expandedProducts.has(item["Numéro homologation"]) && (
                    <View>
                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Dosage et application</Text>
                        <View style={styles.infoRow}>
                          <Icon name="opacity" size={16} color="green" />
                          <Text style={styles.infoText}>Dose: {item.Dose || 'Non spécifié'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="hourglass-bottom" size={16} color="green" />
                          <Text style={styles.infoText}>DAR: {item.DAR || 'Non spécifié'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="repeat" size={16} color="green" />
                          <Text style={styles.infoText}>Nombre d'applications: {item["Nbr_d'app"] || 'Non spécifié'}</Text>
                        </View>
                      </View>

                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Caractéristiques</Text>
                        <View style={styles.infoRow}>
                          <Icon name="science" size={16} color="green" />
                          <Text style={styles.infoText}>Formulation: {item.Formulation || 'Non spécifié'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="percent" size={16} color="green" />
                          <Text style={styles.infoText}>Teneur: {item.Teneur || 'Non spécifié'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="report-problem" size={16} color="red" />
                          <Text style={styles.infoText}>Tableau toxicologique: {item["Tableau toxicologique"] || 'Non spécifié'}</Text>
                        </View>
                      </View>

                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Informations commerciales</Text>
                        <View style={styles.infoRow}>
                          <Icon name="local-shipping" size={16} color="green" />
                          <Text style={styles.infoText}>Fournisseur: {item.Fournisseur || 'Non spécifié'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="person" size={16} color="green" />
                          <Text style={styles.infoText}>Détenteur: {item.Détenteur || 'Non spécifié'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="confirmation-number" size={16} color="green" />
                          <Text style={styles.infoText}>Numéro homologation: {item["Numéro homologation"]}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="event" size={16} color="black" />
                          <Text style={styles.infoText}>
                            Valable jusqu'au: {item["Valable jusqu'au"] 
                              ? new Date(item["Valable jusqu'au"]).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : 'Non spécifié'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create<Styles>({
  favoritesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E7D32',
    textAlign: 'center',
    marginTop: 10
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  heartButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
  },
  detailsContainer: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E8F5E9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  moreDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 25,
    marginTop: 15,
    marginBottom: 15,
    marginHorizontal: 20,
  },
  moreDetailsText: {
    color: '#2E7D32',
    marginRight: 8,
    fontWeight: '600',
    fontSize: 16,
  },
});