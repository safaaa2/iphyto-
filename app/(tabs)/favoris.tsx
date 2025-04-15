import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';

const PaymentScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paiement</Text>
      <TouchableOpacity style={styles.payButton}>
        <Text style={styles.payText}>Payer Maintenant</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#008000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  payText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default PaymentScreen;