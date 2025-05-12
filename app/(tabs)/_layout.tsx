import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { SessionProvider } from '../session/sessionContext';
import { icons } from '@/assets/constants/icons';
import { Image, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

const TabsLayout = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

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

    checkAdminStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const screenOptions = {
    headerStyle: { backgroundColor: 'green' },
    headerTintColor: 'white',
    headerTitleAlign: 'left' as const,
    headerTitle: () => (
      <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 20 }}>
        Iphyto
      </Text>
    ),
    headerRight: () => (
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/cart')}
        style={{ marginRight: 15 }}
      >
        <Image source={icons.panier} style={{ width: 24, height: 24 ,tintColor:'white'}} />
      </TouchableOpacity>
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
    tintColor: focused ? '#1DB954' : '#B0B0B0'
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
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image source={icons.home} style={iconStyle(focused)} />
            ),
          }}
        />
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
          name="alert"
          options={{
            title: 'alert',
            headerShown: true,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image source={icons.alert} style={iconStyle(focused)} />
            ),
          }}
          /> 
        <Tabs.Screen
          name="cart"
          options={{
            title: 'paiement',
            headerShown: true,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image source={icons.cart} style={iconStyle(focused)} />
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

export default TabsLayout;
