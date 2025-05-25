import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Platform, View, Image } from 'react-native';
import React from 'react';
import { icons } from '@/assets/constants/icons';


export default function SupplierLayout() {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#008000',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            height: Platform.OS === 'ios' ? 85 : 60,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 10,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerShown: false,
          tabBarShowLabel: true,
        }}
      >
        <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Tableau de bord',
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name='stats-chart' size={size} color={color} 
                 />
              ),
            }}
          />
        
       
       
        <Tabs.Screen
          name="products"
          options={{
            title: 'Produits',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube-outline" size={size} color={color} />
            ),
          }}
        />
         <Tabs.Screen
          name="commande"
          options={{
            title: 'commande',
            tabBarIcon: ({ color, size }) => (
              <Image 
                source={icons.commande} 
                style={{ 
                  width: size, 
                  height: size, 
                  tintColor: color,
                  resizeMode: 'contain'
                }}
              />
            ),
          }}
        />
      
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />

      </Tabs>
    </View>
  );
}
