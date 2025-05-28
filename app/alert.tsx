import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const AlertIcon = ({ count }: { count: number }) => {
  return (
    <View style={styles.alertIconContainer}>
      <Ionicons name="notifications" size={28} color="#2e7d32" />
      {count > 0 && (
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
};

const AlertScreen = () => {
  const [newProducts, setNewProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load dismissed notifications from storage
  useEffect(() => {
    loadDismissedNotifications();
  }, []);

  const loadDismissedNotifications = async () => {
    try {
      const storedDismissed = await AsyncStorage.getItem('dismissedNotifications');
      if (storedDismissed) {
        setDismissedIds(JSON.parse(storedDismissed));
      }
    } catch (error) {
      console.error('Error loading dismissed notifications:', error);
    }
  };

  const saveDismissedNotifications = async (newDismissedIds: string[]) => {
    try {
      await AsyncStorage.setItem('dismissedNotifications', JSON.stringify(newDismissedIds));
    } catch (error) {
      console.error('Error saving dismissed notifications:', error);
    }
  };

  // Calculate visible notifications
  const visibleProducts = newProducts.filter(item => !dismissedIds.includes(item.id));
  const hasNewNotifications = visibleProducts.length > 0;

  useEffect(() => {
    fetchNewProducts();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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

  const handleRemoveNotification = async (item: SupplierProduct) => {
    const newDismissedIds = [...dismissedIds, item.id];
    setDismissedIds(newDismissedIds);
    await saveDismissedNotifications(newDismissedIds);
  };

  const renderProduct = ({ item }: { item: SupplierProduct }) => {
    const productDate = new Date(item.created_at).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => handleRemoveNotification(item)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#ffffff', '#f8f8f8']}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.productTitleRow}>
                  <Icon name="local-offer" size={20} color="#2e7d32" style={styles.titleIcon} />
                  <Text style={styles.productName}>{item.Produits}</Text>
                </View>
                {item.Categorie && (
                  <Text style={styles.productCategory}>{item.Categorie}</Text>
                )}
              </View>
            </View>
            <Text style={styles.createdDateText}>Ajouté le: {productDate}</Text>
            <View style={styles.infoContainer}>
              <View style={styles.cultureRow}>
                <Icon name="eco" size={20} color="#2e7d32" style={styles.icon} />
                <View style={styles.cultureBadge}>
                  <Text style={styles.cultureText}>{item.Cultures || "Non spécifié"}</Text>
                </View>
              </View>
              <View style={styles.targetRow}>
                <Icon name="bug-report" size={18} color="#2e7d32" style={styles.icon} />
                <View style={styles.targetBadge}>
                  <Text style={styles.targetText}>{item.Cible || "Non spécifié"}</Text>
                </View>
              </View>
              <View style={styles.dateRow}>
                <Icon name="calendar-month" size={16} color="#2e7d32" style={styles.icon} />
                <Text style={styles.dateText}>
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
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f5f5f5']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.push('/search')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#2e7d32" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Nouveaux produits</Text>
          <AlertIcon count={visibleProducts.length} />
        </View>
      </LinearGradient>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des nouveaux produits...</Text>
        </View>
      ) : visibleProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-off" size={60} color="#2e7d32" />
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
              colors={['#2e7d32']}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'left',
  },
  alertIconContainer: {
    position: 'relative',
    marginLeft: 10,
  },
  alertBadge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 10,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  infoContainer: {
    marginTop: 12,
  },
  cultureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  cultureBadge: {
    borderWidth: 1,
    borderColor: '#2e7d32',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cultureText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetBadge: {
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  targetText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createdDateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
});

export default AlertScreen;