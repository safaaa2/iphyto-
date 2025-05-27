import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';
import { useCart } from '../lib/CartContext';
import { Ionicons } from '@expo/vector-icons';
// import { CardForm, useStripe } from '@stripe/stripe-react-native'; // Uncomment if you want CardForm

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name && profile.full_name !== user.email) {
          setName(profile.full_name);
        }
      }
    };
    fetchUserInfo();
  }, []);

  const handlePay = async () => {
    if (!name || !email || !address || !phone) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }

    setLoading(true);

    try {
      // 1. Créer un PaymentIntent sur Supabase function
      const response = await fetch(`${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          amount: total,
          currency: 'mad',
          name,
          email,
          address,
          phone,
        }),
      });

      const { clientSecret, error } = await response.json();
      if (!clientSecret) throw new Error(error || 'No client secret received');

      // 2. Initialiser la Payment Sheet
      const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native');
      const initResponse = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Votre App',
        allowsDelayedPaymentMethods: false,
      });

      if (initResponse.error) {
        throw new Error(initResponse.error.message);
      }

      // 3. Présenter la Payment Sheet
      const paymentResponse = await presentPaymentSheet();
      if (paymentResponse.error) {
        throw new Error(paymentResponse.error.message);
      }

      // 4. Succès
      // Enregistrer la commande dans la base de données
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Extraire le(s) fournisseur(s) du panier
      const fournisseurs = Array.from(new Set(cartItems.map(item => item.fournisseur)));
      if (fournisseurs.length === 1 && fournisseurs[0]) {
        // Un seul fournisseur
        const { error: orderError } = await supabase
          .from('commandes')
          .insert({
            user_id: user.id,
            statut: 'en attente',
            montant_total: total,
            produits: cartItems,
            adresse_livraison: address,
            telephone: phone,
            nom_client: name,
            email: email,
            fournisseur: fournisseurs[0],
          });
        if (orderError) {
          console.error('Error saving order:', orderError);
          throw new Error('Failed to save order');
        }
      } else if (fournisseurs.length > 1) {
        // Plusieurs fournisseurs : une commande par fournisseur
        for (const f of fournisseurs) {
          if (f) {
            const produitsFournisseur = cartItems.filter(item => item.fournisseur === f);
            const { error: orderError } = await supabase
              .from('commandes')
              .insert({
                user_id: user.id,
                statut: 'en attente',
                montant_total: produitsFournisseur.reduce((sum, item) => sum + item.price * item.quantity, 0),
                produits: produitsFournisseur,
                adresse_livraison: address,
                telephone: phone,
                nom_client: name,
                email: email,
                fournisseur: f,
              });
            if (orderError) {
              console.error('Error saving order for supplier', f, orderError);
              throw new Error('Failed to save order for supplier ' + f);
            }
          }
        }
      } else {
        throw new Error('Aucun fournisseur trouvé dans le panier.');
      }

      clearCart();
      Alert.alert(t('success'), t('paymentSuccess'), [
        { text: t('ok'), onPress: () => router.replace('/(tabs)/search') }
      ]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      Alert.alert(t('error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('checkout')}</Text>
        <View style={styles.cartSummary}>
          <Text style={styles.sectionLabel}>{t('Your cart')}</Text>
          {cartItems.map(item => (
            <Text key={item.id} style={styles.cartItemSummary}>
              {item.name} x{item.quantity} - {item.price} MAD
            </Text>
          ))}
          <View style={styles.cartDivider} />
          <Text style={styles.cartTotal}>{t('total')}: {total} MAD</Text>
        </View>
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>{t('name')}</Text>
          <TextInput style={styles.input} placeholder={t('name')} value={name} onChangeText={setName} />
          <Text style={styles.inputLabel}>{t('email')}</Text>
          <TextInput style={styles.input} placeholder={t('email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.inputLabel}>{t('address')}</Text>
          <TextInput style={styles.input} placeholder={t('address')} value={address} onChangeText={setAddress} />
          <Text style={styles.inputLabel}>{t('phone')}</Text>
          <TextInput style={styles.input} placeholder={t('phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.sectionDivider} />
        {/* If you want CardForm, uncomment below and comment out PaymentSheet logic above */}
        {/* <Text style={styles.cardLabel}>Card information</Text>
        <CardForm
          onFormComplete={setCardForm}
          style={styles.cardForm}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
        /> */}
        <TouchableOpacity style={styles.checkoutButton} onPress={handlePay} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.checkoutText}>{t('checkout')}</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  backArrow: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    marginTop: 16,
  },
  cartSummary: {
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  cartItemSummary: {
    fontSize: 16,
    marginBottom: 4,
    color: '#222',
  },
  cartDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  cartTotal: {
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 8,
    textAlign: 'right',
    color: '#008000',
  },
  formSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  sectionDivider: {
    height: 2,
    backgroundColor: '#eee',
    marginVertical: 16,
    borderRadius: 1,
  },
  cardLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
    fontSize: 16,
  },
  cardForm: {
    width: '100%',
    marginBottom: 16,
  },
  checkoutButton: {
    backgroundColor: '#008000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#008000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  checkoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});
