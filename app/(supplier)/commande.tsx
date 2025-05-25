import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface Order {
  id: string;
  user_id: string;
  fournisseur: string;
  produits: any;
  date: string;
  nom_client?: string;
  email?: string;
  adresse_livraison?: string;
  montant_total?: number;
  telephone?: number;
  statut?: string;
  created_at?: string;
}

export default function SupplierOrdersScreen() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fournisseur, setFournisseur] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchFournisseurAndOrders();
  }, []);

  const fetchFournisseurAndOrders = async () => {
    setLoading(true);
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Récupérer le nom du fournisseur depuis le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('fournisseur')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.fournisseur) throw new Error('Fournisseur non trouvé');

      setFournisseur(profile.fournisseur);
      console.log("Filtering orders by supplier (raw):", profile.fournisseur);

      // Récupérer les commandes associées à ce fournisseur
      const cleanSupplierName = profile.fournisseur ? profile.fournisseur.trim() : '';
      console.log("Filtering orders by supplier (cleaned):", cleanSupplierName);

      const { data: ordersData, error: ordersError } = await supabase
        .from('commandes')
        .select('*')
        .ilike('fournisseur', cleanSupplierName);

      if (ordersError) {
        console.error('Erreur lors du chargement des commandes:', ordersError);
        throw ordersError;
      }

      console.log("Commandes récupérées pour le fournisseur", profile.fournisseur, ":", ordersData);

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Erreur dans fetchFournisseurAndOrders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'en attente':
        return '#FFA000';
      case 'en cours':
        return '#2196F3';
      case 'livrée':
        return '#4CAF50';
      case 'annulée':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    let produitsList: any[] = [];
    try {
      if (item.produits) {
        produitsList = typeof item.produits === 'string' ? JSON.parse(item.produits) : item.produits;
      }
    } catch (e) {
      console.error('Erreur lors du parsing des produits de la commande:', e);
    }

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderTitleContainer}>
            <Ionicons name="leaf-outline" size={24} color="#4CAF50" />
            <Text style={styles.orderTitle}>Commande #{item.id}</Text>
          </View>
        </View>

        <View style={styles.orderInfoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="green" />
            <Text style={styles.orderDetailText}>{item.nom_client || 'Client non spécifié'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="green" />
            <Text style={styles.orderDetailText}>{item.telephone || 'Non spécifié'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="green" />
            <Text style={styles.orderDetailText}>{item.email || 'Non spécifié'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="green" />
            <Text style={styles.orderDetailText}>{item.adresse_livraison || 'Non spécifiée'}</Text>
          </View>

          

          {item.created_at && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="green" />
              <Text style={styles.orderDetailText}>
                Date de commande : {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.productListContainer}>
          <Text style={styles.productListTitle}>Produits commandés</Text>
          {produitsList.length > 0 ? (
            produitsList.map((product, index) => (
              <View key={index} style={styles.productItemRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productQuantity}>Quantité: {product.quantity}</Text>
                </View>
                {product.price && (
                  <Text style={styles.productPrice}>{product.price * product.quantity} MAD</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun produit commandé</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalAmount}>
            Total: {item.montant_total} MAD
          </Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Voir détails</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Chargement des commandes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Commandes - {fournisseur}</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>Toutes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('pending')}
          >
            <Text style={[styles.filterText, selectedFilter === 'pending' && styles.filterTextActive]}>En attente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'delivered' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('delivered')}
          >
            <Text style={[styles.filterText, selectedFilter === 'delivered' && styles.filterTextActive]}>Livrées</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={64} color="#4CAF50" />
            <Text style={styles.emptyText}>Aucune commande trouvée</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfoContainer: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: 'black',
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  productListContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginBottom: 16,
  },
  productListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  productItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  productQuantity: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
