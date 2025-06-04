import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';
import { useFavorites } from '../../lib/FavoritesContext';
import { useTranslation } from 'react-i18next';

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

type Styles = {
  container: ViewStyle;
  headerContainer: ViewStyle;
  favoritesTitle: TextStyle;
  favoritesSubtitle: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  emptySubText: TextStyle;
  list: ViewStyle;
  listContent: ViewStyle;
  card: ViewStyle;
  cardHeader: ViewStyle;
  headerLeft: ViewStyle;
  headerRight: ViewStyle;
  productName: TextStyle;
  categoryContainer: ViewStyle;
  productCategory: TextStyle;
  heartButton: ViewStyle;
  removeButton: ViewStyle;
  detailsContainer: ViewStyle;
  infoSection: ViewStyle;
  sectionTitle: TextStyle;
  infoRow: ViewStyle;
  infoText: TextStyle;
  moreDetailsButton: ViewStyle;
  moreDetailsText: TextStyle;
  expandedContent: ViewStyle;
};

export default function FavoritesScreen() {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const { refreshFavorites, triggerRefresh } = useFavorites();
  const { t } = useTranslation();

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
        Alert.alert(t('error'), t('authRequiredFavorites'));
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
        Alert.alert(t('error'), t('loadFavoritesError'));
        return;
      }

      setSavedProducts(data || []);
      console.log('Produits favoris mis à jour:', data || []);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert(t('error'), t('genericErrorMessage'));
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
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>{t('loadingFavorites')}</Text>
        </View>
      ) : savedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="favorite-border" size={80} color="#2E7D32" />
          <Text style={styles.emptyText}>{t('noFavoriteProducts')}</Text>
          <Text style={styles.emptySubText}>{t('addFavoritesMessage')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.favoritesTitle}>{t('myFavoritesTitle')}</Text>
            <Text style={styles.favoritesSubtitle}>{t('savedProductsCount', { count: savedProducts.length })}</Text>
          </View>
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={savedProducts}
            keyExtractor={(item, index) => `${item["Numéro homologation"]}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.productName}>{item.Produits}</Text>
                    <View style={styles.categoryContainer}>
                      <Icon name="category" size={16} color="#2E7D32" />
                      <Text style={styles.productCategory}>{item.Categorie || t('notSpecified')}</Text>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => {}}
                    >
                      <Icon name="favorite" size={24} color="#e53935" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveProduct(item)}
                    >
                      <Icon name="delete" size={24} color="#e53935" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Icon name="science" size={20} color="#2E7D32" />
                      <Text style={styles.infoText}>{t('activeMatterPrefix')} {item['Matière active'] || t('notSpecified')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Icon name="agriculture" size={20} color="#2E7D32" />
                      <Text style={styles.infoText}>{t('culturesPrefix')} {item.Cultures || t('notSpecified')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Icon name="bug-report" size={20} color="#2E7D32" />
                      <Text style={styles.infoText}>{t('targetPrefix')} {item.Cible || t('notSpecified')}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.moreDetailsButton}
                    onPress={() => toggleProductDetails(item["Numéro homologation"])}
                  >
                    <Text style={styles.moreDetailsText}>
                      {expandedProducts.has(item["Numéro homologation"]) ? t('hideDetails') : t('showMoreDetails')}
                    </Text>
                    <Icon 
                      name={expandedProducts.has(item["Numéro homologation"]) ? "expand-less" : "expand-more"} 
                      size={24} 
                      color="#2E7D32" 
                    />
                  </TouchableOpacity>

                  {expandedProducts.has(item["Numéro homologation"]) && (
                    <View style={styles.expandedContent}>
                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>{t('dosageAndApplication')}</Text>
                        <View style={styles.infoRow}>
                          <Icon name="opacity" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>{t('dosePrefix')} {item.Dose || t('notSpecified')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="hourglass-bottom" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>{t('darPrefix')} {item.DAR || t('notSpecified')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="repeat" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>{t('applicationsNumberPrefix')} {item["Nbr_d'app"] || t('notSpecified')}</Text>
                        </View>
                      </View>

                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>{t('characteristics')}</Text>
                        <View style={styles.infoRow}>
                          <Icon name="science" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>{t('formulationPrefix')} {item.Formulation || t('notSpecified')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="percent" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>{t('contentPrefix')} {item.Teneur || t('notSpecified')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="report-problem" size={20} color="#e53935" />
                          <Text style={styles.infoText}>{t('toxicologicalTablePrefix')} {item["Tableau toxicologique"] || t('notSpecified')}</Text>
                        </View>
                      </View>

                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>{t('commercialInformation')}</Text>
                        <View style={styles.infoRow}>
                          <Icon name="local-shipping" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>{t('supplierPrefix')} {item.Fournisseur || t('notSpecified')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="person" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>{t('holderPrefix')} {item.Détenteur || t('notSpecified')}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="confirmation-number" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>{t('homologationNumberPrefix')} {item["Numéro homologation"]}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Icon name="event" size={20} color="#2E7D32" />
                          <Text style={styles.infoText}>
                            {t('validUntilPrefix')}{item["Valable jusqu'au"]
                              ? new Date(item["Valable jusqu'au"]).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : t('notSpecified')}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  favoritesTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  favoritesSubtitle: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  emptySubText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  productCategory: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  heartButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  removeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  detailsContainer: {
    padding: 12,
  },
  infoSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  moreDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  moreDetailsText: {
    color: '#1B5E20',
    marginRight: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  expandedContent: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
});