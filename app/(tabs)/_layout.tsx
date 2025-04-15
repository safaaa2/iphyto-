import React from 'react';
import { Tabs } from 'expo-router';
import { SessionProvider } from '../session/sessionContext';
import { icons } from '@/assets/constants/icons';
import { Image ,Text} from 'react-native';

const TabsLayout = () => {
  return (
    <SessionProvider>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: 'green' }, // Green header
          headerTintColor: 'white', // White text
          headerTitleAlign: 'left',
         
          headerTitle: () => (
            <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 20 }}>
              Iphyto
            </Text>
          ),
          
          tabBarStyle: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70 }, // Positionnement de la Tab Bar en bas
          tabBarActiveTintColor: '#1DB954', // Couleur pour l'icône active
          tabBarInactiveTintColor: '#B0B0B0', // Couleur pour l'icône inactive
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <Image source={icons.home} style={{ width: 24, height: 24, tintColor: focused ? '#1DB954' : '#B0B0B0' }} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused }) => (
              <Image source={icons.search} style={{ width: 25, height: 25, tintColor: focused ? '#1DB954' : '#B0B0B0' }} />
            ),
          }}
        />
        <Tabs.Screen
          name="favoris"
          options={{
            title: 'Favoris',
            headerShown: true, 
            tabBarIcon: ({ focused }) => (
              <Image source={icons.favoris} style={{ width: 20, height: 20, tintColor: focused ? '#1DB954' : '#B0B0B0' }} />
            ),
          }}
        />
       
        
        <Tabs.Screen
          name="alert"
          options={{
            title: 'Alert',
            headerShown: true,
            tabBarIcon: ({ focused }) => (
              <Image source={icons.alert} style={{ width: 19, height: 24, tintColor: focused ? '#1DB954' : '#B0B0B0' }} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Image source={icons.person} style={{ width: 19, height: 24, tintColor: focused ? '#1DB954' : '#B0B0B0' }} />
            ),
          }}
        />
        
      </Tabs>
    </SessionProvider>
  );
};

export default TabsLayout;
