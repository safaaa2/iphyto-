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
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Calculate visible notifications
  const visibleProducts = newProducts.filter(item => !dismissedIds.includes(item.id));
  const hasNewNotifications = visibleProducts.length > 0;

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
        .from('utilisation')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(2);

      console.log('Produits récupérés:', data);

      if (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        Alert.alert('Erreur', 'Impossible de charger les nouveaux produits.');
        return;
      }

      const newProductsData = data || [];
      const updatedProducts = await Promise.all(newProductsData.map(async (item: SupplierProduct) => {
        const { data: produitData } = await supabase
          .from('Produits')
          .select('Valable jusqu\'au')
          .eq('Numéro homologation', item["Numéro homologation"])
          .single();

      

        return {
          ...item,
         
        };
      }));

      setNewProducts(updatedProducts);
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

  const handleRemoveNotification = (item: SupplierProduct) => {
    setDismissedIds((prev) => [...prev, item.id]);
  };

  const renderProduct = ({ item }: { item: SupplierProduct }) => {
    const productDate = new Date(item.created_at).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handleRemoveNotification(item)}
        activeOpacity={0.8}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.productTitleRow}>
                <Icon name="local-offer" size={18} color="green" style={styles.titleIcon} />
                <Text style={styles.productName}>{item.Produits}</Text>
              </View>
              {item.Categorie && (
                <Text style={styles.productCategory}>{item.Categorie}</Text>
              )}
            </View>
          </View>
          <Text style={styles.createdDateText}>Ajouté le: {productDate}</Text>
          <View style={styles.cultureRow}>
            <Icon name="eco" size={20} color="green" style={styles.icon} />
            <View style={styles.cultureBadge}>
              <Text style={styles.cultureText}>{item.Cultures || "Non spécifié"}</Text>
            </View>
          </View>
          <View style={styles.targetRow}>
            <Icon name="bug-report" size={18} color="green" style={styles.icon} />
            <View style={styles.targetBadge}>
              <Text style={styles.targetText}>{item.Cible || "Non spécifié"}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="calendar-month" size={16} color="green" style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 14, color: "black" }}>
              Valable jusqu'au :{" "}
              {item["Valable jusqu'au"]
                ? new Date(item["Valable jusqu'au"]).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                : "Non spécifié"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
                  {visibleProducts.length}
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
      ) : visibleProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-off" size={50} color="#666" />
          <Text style={styles.emptyText}>Aucun nouveau produit</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => `${item.id}-${item.created_at}`}
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
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    padding: 15,
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
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008000',
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  cultureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  icon: {
    marginRight: 8,
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
    marginBottom: 5,
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
  createdDateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  valableJusquAuText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default AlertScreen;