import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FavoritesProvider } from "../lib/FavoritesContext";
import { supabase } from "../lib/supabase";
import { NavigationGuard } from "./components/NavigationGuard";
import { SessionProvider } from "./session/sessionContext";
import { CartProvider } from '../lib/CartContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import { StripeProvider } from '@stripe/stripe-react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay any navigation attempts to ensure layout is fully mounted
    const initializeApp = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log('Session initiale:', session?.user?.id);

        // Don't navigate here, just set the ready state
        setIsReady(true);

        // Wait a short moment before allowing any navigation
        setTimeout(async () => {
          if (!session) {
            console.log('Pas de session, redirection vers auth');
            router.replace("/(auth)");
          } else {
            // Vérifier le rôle de l'utilisateur
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('Erreur lors de la vérification du rôle:', profileError);
              return;
            }

            console.log('Rôle trouvé:', profileData?.role);

            if (profileData?.role === "admin") {
              router.replace("/admin");
            } else if (profileData?.role === "supplier") {
              router.replace("/(supplier)/dashboard");
            } else if (profileData?.role === "farmer") {
              router.replace("/(tabs)/search");
            } else {
              router.replace("/(tabs)/search");
            }
          }
        }, 100);
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        setIsReady(true);
        router.replace("/(auth)");
      }
    };

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Changement d\'état auth:', event, session?.user?.id);
      
      if (!isReady) return;

      if (event === "SIGNED_IN") {
        try {
          if (session) {
            // Vérifier le rôle dans la table profiles
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('Erreur lors de la vérification du rôle:', profileError);
              return;
            }

            console.log('Rôle trouvé après connexion:', profileData?.role);

            if (profileData?.role === "admin") {
              router.replace("/admin");
            } else if (profileData?.role === "supplier") {
              router.replace("/(supplier)/products");
            } else if (profileData?.role === "farmer") {
              router.replace("/(tabs)/search");
            } else {
              router.replace("/(tabs)/search");
            }
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du rôle:", error);
          router.replace("/(auth)");
        }
      } else if (event === "SIGNED_OUT") {
        console.log('Déconnexion détectée');
        router.replace("/(auth)");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isReady]);

  // Always render the stack first, then handle navigation
  return (
    <StripeProvider publishableKey="pk_test_51RQUNq4KRNSut1EI28mDH6m8GHEQacVfHeYRRGPP0qsmhuKDJaeuqi7dLQH2HOnIb3xEYdrRrK7Pz6dGY7rVej1i00Nn8SPrXi">
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <FavoritesProvider>
            <CartProvider>
              {isReady && <NavigationGuard />}
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "none",
                  gestureEnabled: false,
                }}
              >
                <Stack.Screen
                  name="(auth)"
                  options={{
                    headerShown: false,
                    animation: "none",
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    animation: "none",
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="(supplier)"
                  options={{
                    headerShown: false,
                    animation: "none",
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="admin"
                  options={{
                    headerShown: false,
                    animation: "none",
                    gestureEnabled: false,
                  }}
                />
              </Stack>
            </CartProvider>
          </FavoritesProvider>
        </SessionProvider>
      </QueryClientProvider>
    </StripeProvider>
  );
}
