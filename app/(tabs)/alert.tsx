import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';

type SupplierProduct = {
  id: string;
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
  created_at: string;
};

const AlertScreen = () => {
  const [newProducts, setNewProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    fetchNewProducts();
  }, []);

  const fetchNewProducts = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        Alert.alert('Erreur', 'Vous devez être connecté pour voir les alertes.');
        return;
      }

      // Calculer la date d'il y a 7 jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Récupérer les produits des 7 derniers jours
      const { data, error } = await supabase
        .from('Produits')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      console.log('Produits récupérés:', data);

      if (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        Alert.alert('Erreur', 'Impossible de charger les nouveaux produits.');
        return;
      }

      setNewProducts(data || []);
      // Mettre à jour l'état des notifications
      setHasNewNotifications(data && data.length > 0);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNewProducts();
  }, []);

  const renderProduct = ({ item }: { item: SupplierProduct }) => {
    // Calculer si le produit est nouveau (moins de 7 jours)
    const productDate = new Date(item.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isNew = productDate >= sevenDaysAgo;

    return (
      <View style={[styles.productCard, isNew && styles.newProductCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.productName}>
              <Icon name="local-offer" size={16} color="green" /> {item.Produits}
            </Text>
            <Text style={styles.productCategory}>
              <Icon name="category" size={16} color="green" /> {item.Categorie || 'Non spécifié'}
            </Text>
          </View>
          {isNew && (
            <View style={styles.newBadge}>
              <Icon name="fiber-new" size={16} color="white" />
              <Text style={styles.newBadgeText}>Nouveau</Text>
            </View>
          )}
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
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Icon name="notifications-active" size={28} color="#2E7D32" />
            {hasNewNotifications && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {newProducts.length}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>Nouveaux produits</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Chargement des nouveaux produits...</Text>
        </View>
      ) : newProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-off" size={50} color="#666" />
          <Text style={styles.emptyText}>Aucun nouveau produit</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={newProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => `${item["Numéro homologation"]}-${item.created_at}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#008000']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
  listContainer: {
    paddingBottom: 20,
  },
  productCard: {
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
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flex: 1,
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
  detailsContainer: {
    padding: 15,
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    padding: 8,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#008000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  newProductCard: {
    borderColor: '#008000',
    borderWidth: 2,
  },
  newBadge: {
    backgroundColor: '#008000',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AlertScreen;