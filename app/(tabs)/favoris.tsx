import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
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
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008000',
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  removeButton: {
    marginRight: 10,
  },
  detailsContainer: {
    padding: 15,
    paddingTop: 0,
  },
  infoSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: 'black',
    marginLeft: 8,
    flex: 1,
  },
  moreDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  moreDetailsText: {
    color: '#666',
    marginRight: 5,
    fontWeight: '500',
  },
});