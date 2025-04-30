import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SessionProvider } from './session/sessionContext';
import { FavoritesProvider } from '../lib/FavoritesContext';
import { NavigationGuard } from './components/NavigationGuard';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        router.push('/');
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        const checkRole = async () => {
          try {
            if (session) {
              const { data: userData, error } = await supabase
                .from('users')
                .select('role')
                .eq('email', session.user.email)
                .single();

              if (error) throw error;

              if (userData.role === 'admin') {
                router.push('/admin');
              } else if (userData.role === 'fournisseur') {
                router.push('/(supplier)/products');
              } else {
                router.push('/(tabs)/home');
              }
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du rôle:', error);
            router.push('/');
          }
        };

        checkRole();
      } else if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <FavoritesProvider>
          <NavigationGuard />
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: 'none',
              presentation: 'transparentModal',
              gestureEnabled: false
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{
                headerShown: false,
                animation: 'none',
                presentation: 'transparentModal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{
                headerShown: false,
                animation: 'none',
                presentation: 'transparentModal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="admin" 
              options={{
                headerShown: false,
                animation: 'none',
                presentation: 'transparentModal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="(supplier)" 
              options={{
                headerShown: false,
                animation: 'none',
                presentation: 'transparentModal',
                gestureEnabled: false,
              }}
            />
          </Stack>
        </FavoritesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
