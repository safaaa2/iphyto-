import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SessionProvider } from './session/sessionContext';
import { FavoritesProvider } from '../lib/FavoritesContext';
import { NavigationGuard } from './components/NavigationGuard';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const isAdminUser = session.user.email === 'safaeny652@gmail.com';
          setIsAdmin(isAdminUser);
          
          // Vérifier si l'utilisateur est sur la bonne route
          const inAuthGroup = segments[0] === '(auth)';
          const inAdminGroup = segments[0] === 'admin';
          
          if (isAdminUser && !inAdminGroup) {
            router.replace('/admin');
          } else if (!isAdminUser && inAdminGroup) {
            router.replace('/');
          }
        } else {
          // Si pas de session, rediriger vers la page de connexion
          const inAuthGroup = segments[0] === '(auth)';
          if (!inAuthGroup) {
            router.replace('/');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut admin:', error);
      }
    };

    checkAdminStatus();

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const isAdminUser = session.user.email === 'safaeny652@gmail.com';
        setIsAdmin(isAdminUser);
        if (isAdminUser) {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
      } else if (event === 'SIGNED_OUT') {
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <FavoritesProvider>
          <NavigationGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="admin" />
          </Stack>
        </FavoritesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
