import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { SessionProvider } from '../session/sessionContext';
import { icons } from '@/assets/constants/icons';
import { Image, Text } from 'react-native';
import { supabase } from '../../lib/supabase';

const TabsLayout = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const isAdminUser = session.user.email === 'safaeny652@gmail.com';
          if (mounted) {
            setIsAdmin(isAdminUser);
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
    tabBarStyle: { 
      position: 'absolute' as const, 
      bottom: 0, 
      left: 0, 
      right: 0, 
      height: 70,
      opacity: 0,
      elevation: 0,
      backgroundColor: 'transparent'
    },
    tabBarActiveTintColor: '#1DB954',
    tabBarInactiveTintColor: '#B0B0B0',
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
            title: 'Alert',
            headerShown: true,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <Image source={icons.alert} style={iconStyle(focused)} />
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
