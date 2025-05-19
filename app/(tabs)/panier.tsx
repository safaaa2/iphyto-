import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

type CartItem = {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  product: {
    Produits: string;
    Categorie: string;
    "Matière active"?: string;
    Cultures: string;
    Cible: string;
    prix?: number;
  };
};

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Erreur', 'Vous devez être connecté pour voir votre panier.');
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', session.user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger votre panier.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'article.');
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la quantité.');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product.prix || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.productName}>
            <Icon name="local-offer" size={16} color="green" /> {item.product.Produits}
          </Text>
          <Text style={styles.productCategory}>
            <Icon name="category" size={16} color="green" /> {item.product.Categorie || 'Non spécifié'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Icon name="delete" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Icon name="science" size={16} color="green" />
            <Text style={styles.infoText}>Matière active: {item.product['Matière active'] || 'Non spécifié'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="agriculture" size={16} color="green" />
            <Text style={styles.infoText}>Cultures: {item.product.Cultures || 'Non spécifié'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="bug-report" size={16} color="green" />
            <Text style={styles.infoText}>Cible: {item.product.Cible || 'Non spécifié'}</Text>
          </View>
        </View>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
          >
            <Icon name="remove" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Icon name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            Prix: {(item.product.prix || 0) * item.quantity} MAD
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Chargement du panier...</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="shopping-cart" size={50} color="#666" />
          <Text style={styles.emptyText}>Votre panier est vide</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total:</Text>
              <Text style={styles.totalAmount}>{calculateTotal()} MAD</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => {
                // Navigation vers la page de paiement
                router.push('/payment');
              }}
            >
              <Text style={styles.checkoutButtonText}>Passer la commande</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  listContent: {
    padding: 10,
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
  },
  infoSection: {
    marginBottom: 15,
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  quantityButton: {
    backgroundColor: '#008000',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008000',
  },
  footer: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008000',
  },
  checkoutButton: {
    backgroundColor: '#008000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 