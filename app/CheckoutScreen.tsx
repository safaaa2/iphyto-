import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';
import { useCart } from '../lib/CartContext';
import { Ionicons } from '@expo/vector-icons';

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

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isValidPhone = (phone: string) => phone.length === 10 && /^\d+$/.test(phone);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name && profile.full_name !== user.email) {
          setName(profile.full_name);
        }
      }
    };
    fetchUserInfo();
  }, []);

  const handlePay = async () => {
    if (!name || !email || !address || !phone) return Alert.alert(t('error'), t('fillAllFields'));
    if (!isValidEmail(email)) return Alert.alert(t('error'), t('L\'email est invalide'));
    if (!isValidPhone(phone)) return Alert.alert(t('error'), t('Numéro de telephone invalide'));

    setLoading(true);
    try {
      const response = await fetch(`${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey}`,
        },
        body: JSON.stringify({ name, email, address, phone, amount: total, currency: 'mad' })
      });

      const { clientSecret, error } = await response.json();
      if (!clientSecret) throw new Error(error || 'No client secret received');

      const { initPaymentSheet, presentPaymentSheet } = require('@stripe/stripe-react-native');
      const initResponse = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Votre App',
        allowsDelayedPaymentMethods: false,
      });
      if (initResponse.error) throw new Error(initResponse.error.message);

      const paymentResponse = await presentPaymentSheet();
      if (paymentResponse.error) throw new Error(paymentResponse.error.message);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const fournisseurs = Array.from(new Set(cartItems.map(item => item.fournisseur)));

      for (const f of fournisseurs) {
        const produitsFournisseur = cartItems.filter(item => item.fournisseur === f);
        const { error: orderError } = await supabase.from('commandes').insert({
          user_id: user.id,
          statut: 'en attente',
          montant_total: produitsFournisseur.reduce((sum, item) => sum + item.price * item.quantity, 0),
          produits: produitsFournisseur,
          adresse_livraison: address,
          telephone: phone,
          nom_client: name,
          email: email,
          fournisseur: f
        });
        if (orderError) throw new Error(`Failed to save order for supplier ${f}`);
      }

      clearCart();
      Alert.alert(t('success'), t('paymentSuccess'), [{ text: t('ok'), onPress: () => router.replace('/(tabs)/search') }]);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Ionicons name="cart-outline" size={28} color="#008000" style={{ marginRight: 8 }} />
          <Text style={styles.title}>{t('Panier')}</Text>
        </View>

        <View style={styles.cartSummary}>
          <Text style={styles.sectionLabel}>{t('Your cart')}</Text>
          {cartItems.map(item => (
            <View key={item.id} style={styles.cartRow}>
              <Text>{item.name} x{item.quantity}</Text>
              <Text>{item.price * item.quantity} MAD</Text>
            </View>
          ))}
          <View style={styles.cartDivider} />
          <Text style={styles.cartTotal}>{t('total')}: {total} MAD</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>{t('Nom')}</Text>
          <TextInput style={styles.input} placeholder={t('nom')} value={name} onChangeText={setName} editable={!loading} />

          <Text style={styles.inputLabel}>{t('Email')}</Text>
          <TextInput style={styles.input} placeholder={t('email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />

          <Text style={styles.inputLabel}>{t('Adresse')}</Text>
          <TextInput style={styles.input} placeholder={t('adresse')} value={address} onChangeText={setAddress} editable={!loading} />

          <Text style={styles.inputLabel}>{t('Telephone')}</Text>
          <TextInput style={styles.input} placeholder={t('telephone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!loading} />
        </View>

        <Text style={styles.note}>{t('paymentSecure')}</Text>

        <TouchableOpacity style={styles.checkoutButton} onPress={handlePay} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.checkoutText}>{t('Payer')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 64,
  },
  backArrow: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    
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
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cartDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  cartTotal: {
    fontWeight: 'bold',
    fontSize: 20,
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
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  checkoutButton: {
    backgroundColor: '#008000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  checkoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  note: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
  },
});
