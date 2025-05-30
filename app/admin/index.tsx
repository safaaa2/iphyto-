import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useSession } from '../session/sessionContext';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export default function AdminPage() {
  const { session } = useSession();
  const [userCount, setUserCount] = useState(0);
  const [plantCount, setPlantCount] = useState(0);
  const [activeUserCount, setActiveUserCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [productSupplierCount, setProductSupplierCount] = useState(0);

  useEffect(() => {
    fetchUserCount();
    fetchPlantCount();
    fetchActiveUserCount();
    fetchSupplierCount();
    fetchProductSupplierCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error counting users:', error.message);
      } else {
        setUserCount(count || 0);
      }
    } catch (error) {
      console.error('Error in fetchUserCount:', error);
    }
  };

  const fetchPlantCount = async () => {
    try {
      const { count, error } = await supabase
        .from('cultures')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error counting plants:', error.message);
      } else {
        setPlantCount(count || 0);
      }
    } catch (error) {
      console.error('Error in fetchPlantCount:', error);
    }
  };

  const fetchActiveUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) {
        console.error('Error counting active users:', error.message);
      } else {
        setActiveUserCount(count || 0);
      }
    } catch (error) {
      console.error('Error in fetchActiveUserCount:', error);
    }
  };

  const fetchSupplierCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'supplier');

      if (error) {
        console.error('Error counting suppliers:', error.message);
      } else {
        setSupplierCount(count || 0);
      }
    } catch (error) {
      console.error('Error in fetchSupplierCount:', error);
    }
  };

  const fetchProductSupplierCount = async () => {
    try {
      const { count, error } = await supabase
        .from('Produits')
        .select('Fournisseur', { count: 'exact', head: true })
        .not('Fournisseur', 'is', null);

      if (error) {
        console.error('Error counting product suppliers:', error.message);
      } else {
        setProductSupplierCount(count || 0);
      }
    } catch (error) {
      console.error('Error in fetchProductSupplierCount:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Administration</Text>
          <Text style={styles.subtitle}>{session?.user.email}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Bienvenue sur votre tableau de bord</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.usersCard]}>
              <View style={styles.cardHeader}>
                <Icon name="users" size={24} color="#2E7D32" />
                <Text style={styles.cardTitle}>Utilisateurs</Text>
              </View>
              <Text style={styles.statNumber}>{userCount}</Text>
              <Text style={styles.statLabel}>Total des utilisateurs</Text>
            </View>

            <View style={[styles.statCard, styles.plantsCard]}>
              <View style={styles.cardHeader}>
                <Icon name="leaf" size={24} color="#2E7D32" />
                <Text style={styles.cardTitle}>Cultures</Text>
              </View>
              <Text style={styles.statNumber}>{plantCount}</Text>
              <Text style={styles.statLabel}>Total des cultures</Text>
            </View>

            <View style={[styles.statCard, styles.activeUsersCard]}>
              <View style={styles.cardHeader}>
                <Icon name="user-circle" size={24} color="#2E7D32" />
                <Text style={styles.cardTitle}>Utilisateurs Actifs</Text>
              </View>
              <Text style={styles.statNumber}>{activeUserCount}</Text>
              <Text style={styles.statLabel}>Utilisateurs connectés</Text>
            </View>

            <View style={[styles.statCard, styles.suppliersCard]}>
              <View style={styles.cardHeader}>
                <Icon name="truck" size={24} color="#2E7D32" />
                <Text style={styles.cardTitle}>Fournisseurs</Text>
              </View>
              <Text style={styles.statNumber}>{supplierCount}</Text>
              <Text style={styles.statLabel}>Total des fournisseurs</Text>
            </View>
          </View>

          <View style={styles.fullWidthCard}>
            <View style={styles.cardHeader}>
              <Icon name="building" size={24} color="#2E7D32" />
              <Text style={styles.cardTitle}>Fournisseurs de Produits</Text>
            </View>
            <Text style={styles.statNumber}>{productSupplierCount}</Text>
            <Text style={styles.statLabel}>Total des fournisseurs de produits</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    minHeight: 1500,
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 10,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  usersCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  plantsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8BC34A',
  },
  activeUsersCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#66BB6A',
  },
  suppliersCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#81C784',
  },
  fullWidthCard: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
}); 