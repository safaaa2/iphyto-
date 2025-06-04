import { Tabs } from 'expo-router';
import { SessionProvider } from '../session/sessionContext';
import { icons } from '@/assets/constants/icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

const AdminLayout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const screenOptions = {
    headerStyle: { backgroundColor: 'green' },
    headerTintColor: 'white',
    headerTitleAlign: 'left' as const,
    
    tabBarStyle: { 
      position: 'absolute' as const, 
      bottom: 0, 
      left: 0, 
      right: 0, 
      height: 70,
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0'
    },
    tabBarActiveTintColor: '#1DB954',
    tabBarInactiveTintColor: '#B0B0B0',
  };

  const iconStyle = (focused: boolean) => ({
    width: 26,
    height: 23,
    tintColor: focused ? 'green' : '#B0B0B0'
  });

  return (
    <SessionProvider>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen
          name="index"
          options={{
          
            headerShown: false,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Image 
                  source={icons.espace} 
                  style={iconStyle(focused)}
                />
              </View>
            ),
            tabBarLabelStyle: {
              color: 'green',  // couleur verte pour le texte du label
            },
          }}
        />
         <Tabs.Screen
          name="users"
          options={{
            title: 'users',
            headerShown: false,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Image 
                  source={icons.users} 
                  style={iconStyle(focused)}
                />
              </View>
            ),

            tabBarLabelStyle: {
              color: 'green',  // couleur verte pour le texte du label
            },
            
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Image 
                  source={icons.person} 
                  style={iconStyle(focused)}
                />
              </View>
              
            ),
            tabBarLabelStyle: {
              color: 'green',  // couleur verte pour le texte du label
            },
          }}
        />
      </Tabs>
    </SessionProvider>
  );
};

export default AdminLayout; 