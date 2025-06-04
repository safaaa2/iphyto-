import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FavoritesProvider } from "../lib/FavoritesContext";
import { supabase } from "../lib/supabase";
import { NavigationGuard } from "./components/NavigationGuard";
import { SessionProvider } from "./session/sessionContext";
import { CartProvider } from '../lib/CartContext';
import { I18nextProvider } from 'react-i18next';
import i18n, { getSavedLanguage } from '../lib/i18n';
import { StripeProvider } from '@stripe/stripe-react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const [i18nReady, setI18nReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const isReady = i18nReady && authReady;

  useEffect(() => {
    // Load saved language and initialize i18n
    const loadLanguage = async () => {
      const savedLanguage = await getSavedLanguage();
      await i18n.changeLanguage(savedLanguage);
      setI18nReady(true);
    };
    loadLanguage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Changement d\'état auth:', event, session?.user?.id);
      
      // This part handles initial session and subsequent auth changes.
      // It should run regardless of i18n readiness.
      if (event === "INITIAL_SESSION") {
        setAuthReady(true);
        if (!session) {
          console.log('Initial session: No session found, redirecting to authentication');
          // We don't navigate immediately here, NavigationGuard will handle it based on session state
        } else {
          console.log('Initial session: Session found for user:', session.user.id);
          // Role checking and navigation should happen in NavigationGuard
        }
      } else if (event === "SIGNED_IN") {
        console.log('Auth event: SIGNED_IN for user:', session?.user?.id);
        // NavigationGuard will handle routing based on the new session
      } else if (event === "SIGNED_OUT") {
        console.log('Auth event: SIGNED_OUT');
        // NavigationGuard will handle routing
        router.replace("/(auth)");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  // Always render the stack first, then handle navigation
  return (
    <StripeProvider publishableKey="pk_test_51RQUNq4KRNSut1EI28mDH6m8GHEQacVfHeYRRGPP0qsmhuKDJaeuqi7dLQH2HOnIb3xEYdrRrK7Pz6dGY7rVej1i00Nn8SPrXi">
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <FavoritesProvider>
            <CartProvider>
              <I18nextProvider i18n={i18n}>
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
              </I18nextProvider>
            </CartProvider>
          </FavoritesProvider>
        </SessionProvider>
      </QueryClientProvider>
    </StripeProvider>
  );
}
