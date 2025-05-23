import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  expiringProducts: number;
  expiredProducts: number;
  recentProducts: number;
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

      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Calculer les statistiques
      const stats = {
        totalProducts: products?.length || 0,
        activeProducts: products?.filter(p => new Date(p["Valable jusqu'au"]) > today).length || 0,
        expiringProducts: products?.filter(p => {
          const expiryDate = new Date(p["Valable jusqu'au"]);
          return expiryDate > today && expiryDate <= thirtyDaysFromNow;
        }).length || 0,
        expiredProducts: products?.filter(p => new Date(p["Valable jusqu'au"]) < today).length || 0,
        recentProducts: products?.filter(p => {
          const creationDate = new Date(p.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return creationDate >= thirtyDaysAgo;
        }).length || 0,
      };

      setStats(stats);
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

  const QuickActionButton = ({ title, icon, onPress, color }: { title: string; icon: string; onPress: () => void; color: string }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color="#ffffff" />
      <Text style={styles.actionButtonText}>{title}</Text>
    </TouchableOpacity>
  );

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
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="stats-chart" size={24} color="#4CAF50" style={styles.titleIcon} />
          <Text style={styles.title}>{t('dashboard')}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchDashboardData}
        >
          <Ionicons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total des produits"
          value={stats.totalProducts}
          icon="cube-outline"
          color="#4CAF50"
        />
        <StatCard
          title="Produits actifs"
          value={stats.activeProducts}
          icon="checkmark-circle-outline"
          color="#2196F3"
        />
        <StatCard
          title="Produits expirant"
          value={stats.expiringProducts}
          icon="warning-outline"
          color="#FFC107"
        />
        <StatCard
          title="Produits expirés"
          value={stats.expiredProducts}
          icon="close-circle-outline"
          color="#F44336"
        />
        <StatCard
          title="Nouveaux produits"
          value={stats.recentProducts}
          icon="add-circle-outline"
          color="#9C27B0"
        />
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionButtons}>
          <QuickActionButton
            title="Ajouter un produit"
            icon="add-circle"
            onPress={() => router.push('/products')}
            color="#4CAF50"
          />
          <QuickActionButton
            title="les commandes "
            icon="commande"
            onPress={() => router.push('/commande')}
            color="#2196F3"
          />
          <QuickActionButton
            title="Produits expirant"
            icon="warning"
            onPress={() => router.push('/products')}
            color="#FFC107"
          />
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Informations importantes</Text>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
          <Text style={styles.infoText}>
            Vous avez {stats.expiringProducts} produits qui expirent dans les 30 prochains jours.
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
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
    backgroundColor: '#f5f5f5',
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
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#757575',
  },
  actionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
  },
  actionButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#424242',
  },
});