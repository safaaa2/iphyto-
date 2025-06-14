import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useCart } from '../../lib/CartContext';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../../lib/supabase';

function CartContent() {
  const { t } = useTranslation();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      t('confirm'),
      t('removeFromCartConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('remove'),
          onPress: () => removeFromCart(id),
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      t('confirm'),
      t('clearCartConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('clear'),
          onPress: () => clearCart(),
          style: 'destructive',
        },
      ]
    );
  };

  const fetchUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
    }
  };

  React.useEffect(() => {
    if (params.checkoutName && params.checkoutEmail && params.checkoutAddress && params.checkoutPhone) {
      handleCheckout({
        name: params.checkoutName as string,
        email: params.checkoutEmail as string,
        address: params.checkoutAddress as string,
        phone: params.checkoutPhone as string,
      });
    }
  }, [params]);

  const handleCheckout = async (userDetails?: { address: string, phone: string, name: string, email: string }) => {
    try {
      setIsLoading(true);

      if (cartItems.length === 0) {
        Alert.alert(t('error'), t('cartEmpty'));
        return;
      }

      const response = await fetch(`${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey}`,
        },
        body: JSON.stringify({ 
          amount: total,
          currency: 'mad',
          address: userDetails?.address,
          phone: userDetails?.phone,
          name: userDetails?.name,
          email: userDetails?.email
        }),
      });

      const { clientSecret, publishableKey } = await response.json();

      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "iPhyto",
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: userDetails?.name || 'Client',
          email: userDetails?.email,
        }
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      console.log('cartItems envoyés dans la commande:', cartItems);

      Alert.alert(
        t('success'),
        t('paymentSuccess'),
        [
          {
            text: t('ok'),
            onPress: async () => {
              try {
                console.log('cartItems avant extraction fournisseur:', cartItems);
                const fournisseurs = Array.from(new Set(cartItems.map(item => item.fournisseur)));
                console.log('Fournisseurs extraits:', fournisseurs);
                if (fournisseurs.length === 1 && fournisseurs[0]) {
                  // Un seul fournisseur
                  await supabase.from('commandes').insert([{
                    user_id: userDetails?.email,
                    produits: cartItems,
                    date: new Date().toISOString(),
                    fournisseur: fournisseurs[0],
                  }]);
                  console.log('Commande insérée pour un fournisseur:', fournisseurs[0]);
                } else if (fournisseurs.length > 1) {
                  // Plusieurs fournisseurs : une commande par fournisseur
                  console.log('Plusieurs fournisseurs détectés, insertion multiple');
                  for (const f of fournisseurs) {
                    if (f) {
                      const produitsFournisseur = cartItems.filter(item => item.fournisseur === f);
                      await supabase.from('commandes').insert([{
                        user_id: userDetails?.email,
                        produits: produitsFournisseur,
                        date: new Date().toISOString(),
                        fournisseur: f,
                      }]);
                      console.log('Commande insérée pour le fournisseur:', f);
                    }
                  }
                } else {
                   console.warn(`Aucun fournisseur valide trouvé dans cartItems pour l'insertion de la commande.`);
                }
              } catch (err) {
                console.error('Erreur lors de l\'enregistrement de la commande:', err);
              }
              clearCart();
              router.replace('/(tabs)/search');
            }
          }
        ]
      );

    } catch (error: any) {
      if (error.message === 'The payment flow has been canceled') {
        Alert.alert(
          t('paymentCancelled'),
          t('paymentCancelledMessage')
        );
      } else {
        Alert.alert(
          t('error'),
          error.message || t('paymentError')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.fournisseurText}>{item.fournisseur}</Text>
        <Text style={styles.itemDetails}>
          {item.culture} / {item.target}
        </Text>
      
        {item["Valable jusqu'au"] && (
          <Text style={styles.itemDate}>
            <Icon name="calendar" size={14} color="black" /> Valable jusqu'au: {new Date(item["Valable jusqu'au"]).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        )}
       
        <Text style={styles.itemPrice}>
          {item.price} MAD {item.unite && `/ ${item.unite}`}
        </Text>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
          style={styles.quantityButton}
        >
          <Icon name="minus" size={20} color="#008000" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
          style={styles.quantityButton}
        >
          <Icon name="plus" size={20} color="#008000" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => handleRemoveItem(item.id)}
        style={styles.removeButton}
      >
        <Icon name="delete" size={24} color="#ff0000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {cartItems.length > 0 ? (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>{t('total')}:</Text>
              <Text style={styles.totalAmount}>{total} MAD</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.checkoutButton, isLoading && styles.disabledButton]}
                onPress={() => router.push('/CheckoutScreen')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Icon name="cart-check" size={20} color="white" />
                    <Text style={styles.buttonText}>{t('Payer')}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCart}
              >
                <Icon name="delete-sweep" size={20} color="white" />
                <Text style={styles.buttonText}>{t('clearCart')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyCart}>
          <Icon name="cart-off" size={80} color="#ccc" />
          <Text style={styles.emptyCartText}>{t('emptyCart')}</Text>
        </View>
      )}
    </View>
  );
}

export default function CartScreen() {
  const publishableKey = Constants.expoConfig?.extra?.stripePublishableKey;

  return (
    <StripeProvider publishableKey={publishableKey}>
      <CartContent />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: 'black',
    fontWeight:'bold',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: 'black',
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#008000',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008000',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  clearButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButton: {
    backgroundColor: '#008000',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 10,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  fournisseurText: {
    fontSize: 12,
    color: 'black',
    fontWeight:'bold',
    fontStyle: 'italic',
    marginBottom: 2,
  },
}); 