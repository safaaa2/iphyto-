import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { SessionProvider } from '../session/sessionContext';
import { icons } from '@/assets/constants/icons';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TabsLayout = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const loadLastViewedTimestamp = async () => {
      try {
        const timestamp = await AsyncStorage.getItem('lastViewedTimestamp');
        if (timestamp) {
          setLastViewedTimestamp(timestamp);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du timestamp:', error);
      }
    };

    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (mounted) {
            setIsAdmin(profileData?.role === 'admin');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut admin:', error);
      }
    };

    const checkNewNotifications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          // Si nous avons un timestamp de dernière vue, l'utiliser comme point de départ
          const startDate = lastViewedTimestamp ? new Date(lastViewedTimestamp) : sevenDaysAgo;

          const { data, error } = await supabase
            .from('Produits')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(3);

          if (!error && mounted) {
            setHasNewNotifications(data && data.length > 0);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des notifications:', error);
      }
    };

    loadLastViewedTimestamp();
    checkAdminStatus();
    checkNewNotifications();

    // Vérifier les nouvelles notifications toutes les 5 minutes
    const interval = setInterval(checkNewNotifications, 300000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [lastViewedTimestamp]);

  const handleAlertPress = async () => {
    try {
      const currentTimestamp = new Date().toISOString();
      await AsyncStorage.setItem('lastViewedTimestamp', currentTimestamp);
      setLastViewedTimestamp(currentTimestamp);
      setHasNewNotifications(false);
      router.push('/alert');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du timestamp:', error);
    }
  };

  const screenOptions = {
    headerStyle: { backgroundColor: 'green' },
    headerTintColor: 'white',
    headerTitleAlign: 'left' as const,
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 20 }}>
          Iphyto
        </Text>
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={handleAlertPress}
        >
          <Image source={icons.alert} style={{ width: 24, height: 24, tintColor: 'white' }} />
          {hasNewNotifications && (
            <View style={[styles.notificationBadge, { position: 'relative', top: 0, right: 0, marginLeft: -10 }]}>
              <View style={styles.notificationDot} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    ),
    
     
      
    tabBarStyle: { 
      position: 'absolute' as const, 
      bottom: 0, 
      left: 0, 
      right: 0, 
      height: 70,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 0,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      marginHorizontal: 10,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
    },
    tabBarActiveTintColor: '#008000',
    tabBarInactiveTintColor: '#666666',
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600' as const,
      marginTop: 4,
    },
  };

  const iconStyle = (focused: boolean) => ({
    width: 24,
    height: 24,
    tintColor: focused ? 'green' : '#B0B0B0'
  });

  if (isAdmin) {
    return (
      <SessionProvider>
        <Tabs screenOptions={screenOptions}>
          <Tabs.Screen
            name="admin"
            options={{
              title: 'Admin',
              headerShown: true,
              tabBarIcon: ({ focused }: { focused: boolean }) => (
                <Image source={icons.person} style={iconStyle(focused)} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              headerShown: false,
              tabBarIcon: ({ focused }: { focused: boolean }) => (
                <Image source={icons.person} style={iconStyle(focused)} />
              ),
            }}
          />
        </Tabs>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <Tabs screenOptions={screenOptions}>
      
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image source={icons.search} style={iconStyle(focused)} />
            ),
          }}
        />
        <Tabs.Screen
          name="favoris"
          options={{
            title: 'Favoris',
            headerShown: true,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image source={icons.favoris} style={iconStyle(focused)} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            headerShown: true,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Icon name="history" size={29} color={focused ? 'green' : '#B0B0B0'} />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'panier',
            headerShown: true,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image source={icons.panier} style={iconStyle(focused)} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image source={icons.person} style={iconStyle(focused)} />
            ),
          }}
        />
      </Tabs>
    </SessionProvider>
  );
};

const styles = StyleSheet.create({
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'transparent',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: 'white',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default TabsLayout;
