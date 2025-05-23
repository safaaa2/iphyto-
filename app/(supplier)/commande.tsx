import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface Order {
  id: string;
  user_id: string;
  fournisseur: string;
  produits: any; // à adapter selon votre structure
  date: string;
  nom_client?: string;
  email?: string;
  montant_total?: number;
  // ... autres champs
}

export default function SupplierOrdersScreen() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fournisseur, setFournisseur] = useState<string | null>(null);

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

  const renderOrder = ({ item }: { item: Order }) => {
    // Tenter de parser la colonne produits si elle est une chaîne JSON
    let produitsList: any[] = [];
    try {
      if (item.produits) {
        produitsList = typeof item.produits === 'string' ? JSON.parse(item.produits) : item.produits;
      }
    } catch (e) {
      console.error('Erreur lors du parsing des produits de la commande:', e);
      // Gérer l'erreur de parsing si nécessaire
    }

    return (
      <View style={styles.orderCard}>
        <Text style={styles.orderTitle}>Commande #{item.id}</Text>
        {item.nom_client && (
          <Text style={styles.orderDetailText}>Client: {item.nom_client}</Text>
        )}
        {item.email && (
          <Text style={styles.orderDetailText}>Email: {item.email}</Text>
        )}
        {item.montant_total !== undefined && item.montant_total !== null && (
          <Text style={styles.orderDetailText}>Montant Total: {item.montant_total} MAD</Text>
        )}
        {item.date && item.date !== 'Invalid Date' && (
           <Text style={styles.orderDetailText}>Date: {new Date(item.date).toLocaleDateString()}</Text>
        )}
       
        <View style={styles.productListContainer}>
          <Text style={styles.productListTitle}>Produits:</Text>
          {produitsList.length > 0 ? (
            produitsList.map((product, index) => (
              <View key={index} style={styles.productItemRow}>
                <Text style={styles.productItemText}>{product.name} x {product.quantity}</Text>
                {/* Ajoutez d'autres détails du produit ici si nécessaire */}
              </View>
            ))
          ) : (
            <Text style={styles.productItemText}>Aucun produit dans cette commande.</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#008000" />
        <Text>Chargement des commandes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Commandes pour le fournisseur : {fournisseur}</Text>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>Aucune commande trouvée.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  orderCard: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 12 },
  orderTitle: { fontWeight: 'bold', marginBottom: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderDetailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  productListContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  productListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  productItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  productItemText: {
    fontSize: 14,
    color: '#222',
  },
});
