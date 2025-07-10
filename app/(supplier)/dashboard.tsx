import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { icons } from '@/assets/constants/icons';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  expiringProducts: number;
  expiredProducts: number;
  recentProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  orderRate: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    expiringProducts: 0,
    expiredProducts: 0,
    recentProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    orderRate: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les informations du fournisseur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('fournisseur')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData.fournisseur) {
        throw new Error('Utilisateur non autorisé');
      }

      // Récupérer tous les produits du fournisseur
      const { data: products, error: productsError } = await supabase
        .from('Produits')
        .select('*')
        .eq('Fournisseur', profileData.fournisseur);

      if (productsError) throw productsError;

      // Récupérer les commandes du fournisseur
      const { data: orders, error: ordersError } = await supabase
        .from('commandes')
        .select('*')
        .eq('fournisseur', profileData.fournisseur);

      if (ordersError) throw ordersError;

      // Utility: normalize date to midnight, or return null if invalid
      function normalizeDate(date: any) {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      }

      // Always get a valid today date
      let today = normalizeDate(new Date());
      if (!today) today = new Date(); today.setHours(0,0,0,0);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Filter products with valid expiry dates only
      const validProducts = (products || []).filter(p => normalizeDate(p["Valable jusqu'au"]));

      // Calculate product stats
      const productStats = {
        totalProducts: products?.length || 0,
        activeProducts: validProducts.filter(p => {
          const expiryDate = normalizeDate(p["Valable jusqu'au"]);
          return expiryDate && expiryDate > today;
        }).length || 0,
        expiringProducts: validProducts.filter(p => {
          const expiryDate = normalizeDate(p["Valable jusqu'au"]);
          return expiryDate && expiryDate > today && expiryDate <= thirtyDaysFromNow;
        }).length || 0,
        expiredProducts: validProducts.filter(p => {
          const expiryDate = normalizeDate(p["Valable jusqu'au"]);
          return expiryDate && expiryDate < today;
        }).length || 0,
        recentProducts: products?.filter(p => {
          const creationDate = new Date(p.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return creationDate >= thirtyDaysAgo;
        }).length || 0,
      };

      // Calculer les statistiques des commandes
      const orderStats = {
        totalOrders: orders?.length || 0,
        pendingOrders: orders?.filter(o => o.status === 'en attente').length || 0,
        completedOrders: orders?.filter(o => o.status === 'complétée').length || 0,
        orderRate: orders?.length ? 
          ((orders.filter(o => o.status === 'complétée').length / orders.length) * 100) : 0
      };

      setStats({
        ...productStats,
        ...orderStats
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const QuickActionButton = ({ 
    title, 
    icon, 
    image, 
    onPress, 
    color 
  }: { 
    title: string; 
    icon?: string; 
    image?: any; 
    onPress: () => void; 
    color: string 
  }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color }]} 
      onPress={onPress}
      disabled={title === "Produits expirant" && stats.expiringProducts === 0}
    >
      {icon ? (
        <Ionicons name={icon as any} size={24} color="#ffffff" />
      ) : image ? (
        <Image 
          source={image} 
          style={{ 
            width: 24, 
            height: 24, 
            tintColor: '#ffffff',
            resizeMode: 'contain'
          }} 
        />
      ) : null}
      <Text style={[
        styles.actionButtonText,
        title === "Produits expirant" && stats.expiringProducts === 0 && styles.disabledButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const handleExpiringProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('fournisseur')
        .eq('id', user.id)
        .single();
      if (!profileData?.fournisseur) return;
      const { data: products } = await supabase
        .from('Produits')
        .select('*')
        .eq('Fournisseur', profileData.fournisseur);
      function normalizeDate(date: any) {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      }
      let today = normalizeDate(new Date());
      if (!today) today = new Date(); today.setHours(0,0,0,0);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      const expiringProducts = (products || []).filter(p => {
        const expiryDate = normalizeDate(p["Valable jusqu'au"]);
        return expiryDate && expiryDate > today && expiryDate <= thirtyDaysFromNow;
      });
      if (expiringProducts.length > 0) {
        const names = expiringProducts.map(p => p.Produits || p.name || 'Produit inconnu').join('\n');
        Alert.alert('Produits expirant bientôt', names);
      } else {
        Alert.alert(
          'Information',
          'Aucun produit n\'expire dans les 30 prochains jours.'
        );
      }
    } catch (error) {
      console.error('Error fetching expiring products:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les produits expirant.');
    }
  };

  const handleExpiredProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('fournisseur')
        .eq('id', user.id)
        .single();
      if (!profileData?.fournisseur) return;
      const { data: products } = await supabase
        .from('Produits')
        .select('*')
        .eq('Fournisseur', profileData.fournisseur);
      function normalizeDate(date: any) {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      }
      let today = normalizeDate(new Date());
      if (!today) today = new Date(); today.setHours(0,0,0,0);
      const expiredProducts = (products || []).filter(p => {
        const expiryDate = normalizeDate(p["Valable jusqu'au"]);
        return expiryDate && expiryDate < today;
      });
      if (expiredProducts.length > 0) {
        const names = expiredProducts.map(p => p.Produits || p.name || 'Produit inconnu').join('\n');
        Alert.alert('Produits expirés', names);
      } else {
        Alert.alert(
          'Information',
          'Aucun produit n\'est expiré.'
        );
      }
    } catch (error) {
      console.error('Error fetching expired products:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les produits expirés.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleIconContainer}>
            <Ionicons name="stats-chart" size={24} color="#ffffff" />
          </View>
          <Text style={styles.title}>{t('dashboard')}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchDashboardData}
        >
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total des produits"
            value={stats.totalProducts}
            icon="cube-outline"
            color="#2E7D32"
          />
          <StatCard
            title="Produits actifs"
            value={stats.activeProducts}
            icon="checkmark-circle-outline"
            color="#388E3C"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Produits expirant"
            value={stats.expiringProducts}
            icon="warning-outline"
            color="#F57C00"
          />
          <StatCard
            title="Produits expirés"
            value={stats.expiredProducts}
            icon="close-circle-outline"
            color="#D32F2F"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Nouveaux produits"
            value={stats.recentProducts}
            icon="add-circle-outline"
            color="#1976D2"
          />
          <StatCard
            title="Commandes"
            value={stats.totalOrders}
            icon="cart-outline"
            color="#7CB342"
          />
        </View>
        <View style={styles.statsRow}>
          
         
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionButtons}>
          <QuickActionButton
            title="Ajouter un produit"
            icon="add-circle"
            onPress={() => router.push('/products')}
            color="#2E7D32"
          />
          <QuickActionButton
            title="Les commandes"
            image={icons.commande}
            onPress={() => router.push('/commande')}
            color="#1976D2"
          />
          <QuickActionButton
            title="Produits expirant"
            icon="warning"
            onPress={handleExpiringProducts}
            color="#F57C00"
          />
          <QuickActionButton
            title="Produits expirés"
            icon="close-circle"
            onPress={handleExpiredProducts}
            color="#D32F2F"
          />
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Informations importantes</Text>
        <View style={styles.infoCard}>
          <View style={[styles.infoIconContainer, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.infoText}>
            Vous avez {stats.expiringProducts} produits qui expirent dans les 30 prochains jours.
          </Text>
        </View>
        <View style={styles.infoCard}>
          <View style={[styles.infoIconContainer, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
          </View>
          <Text style={styles.infoText}>
            {stats.expiredProducts} produits ont expiré et doivent être mis à jour.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 85 : 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1B5E20',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 16,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    minWidth: '45%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 12,
    fontWeight: '600',
    fontSize: 15,
  },
  infoContainer: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  disabledButtonText: {
    opacity: 0.6,
  },
});