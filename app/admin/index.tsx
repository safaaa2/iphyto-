import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useSession } from '../session/sessionContext';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';

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
      <View style={styles.container}>
        <LinearGradient
          colors={['#2E7D32', '#1B5E20']}
          style={styles.header}
        >
          <Text style={styles.title}>Administration</Text>
          <Text style={styles.subtitle}>{session?.user.email}</Text>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Tableau de Bord</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.iconContainer}>
                  <Icon name="users" size={30} color="#2E7D32" style={styles.statIcon} />
                </View>
                <Text style={styles.statNumber}>{userCount}</Text>
                <Text style={styles.statLabel}>Utilisateurs</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.iconContainer}>
                  <Icon name="leaf" size={30} color="#2E7D32" style={styles.statIcon} />
                </View>
                <Text style={styles.statNumber}>{plantCount}</Text>
                <Text style={styles.statLabel}>Cultures</Text>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.iconContainer}>
                  <Icon name="user-circle" size={30} color="#2E7D32" style={styles.statIcon} />
                </View>
                <Text style={styles.statNumber}>{activeUserCount}</Text>
                <Text style={styles.statLabel}>Utilisateurs Actifs</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.iconContainer}>
                  <Icon name="truck" size={30} color="#2E7D32" style={styles.statIcon} />
                </View>
                <Text style={styles.statNumber}>{supplierCount}</Text>
                <Text style={styles.statLabel}>Fournisseurs</Text>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, styles.fullWidthCard]}>
                <View style={[styles.iconContainer, styles.companyIconContainer]}>
                  <Icon name="building" size={30} color="#2E7D32" style={styles.statIcon} />
                </View>
                <Text style={styles.statNumber}>{productSupplierCount}</Text>
                <Text style={styles.statLabel}>Total Fournisseurs de Produits</Text>
              </View>
            </View>
            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    padding: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E7D32',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyIconContainer: {
    backgroundColor: '#E8F5E9',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  statIcon: {
    marginBottom: 0,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  fullWidthCard: {
    flex: 1,
    marginHorizontal: 0,
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    padding: 25,
  },
  bottomSpace: {
    height: 100,
  },
}); 