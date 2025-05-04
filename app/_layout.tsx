import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FavoritesProvider } from "../lib/FavoritesContext";
import { supabase } from "../lib/supabase";
import { NavigationGuard } from "./components/NavigationGuard";
import { SessionProvider } from "./session/sessionContext";

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

        // Don't navigate here, just set the ready state
        setIsReady(true);

        // Wait a short moment before allowing any navigation
        setTimeout(() => {
          if (!session) {
            router.replace("/(auth)");
          }
        }, 100);
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        setIsReady(true);

        // Wait a short moment before allowing any navigation
        setTimeout(() => {
          router.replace("/(auth)");
        }, 100);
      }
    };

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isReady) return;

      if (event === "SIGNED_IN") {
        const checkRole = async () => {
          try {
            if (session) {
              if (session.user.user_metadata.role === "admin") {
                router.replace("/admin");
              } else if (session.user.user_metadata.role === "fournisseur") {
                router.replace("/(supplier)/products");
              } else {
                router.replace("/(tabs)/home");
              }
            }
          } catch (error) {
            console.error("Erreur lors de la vérification du rôle:", error);
            router.replace("/(auth)");
          }
        };

        checkRole();
      } else if (event === "SIGNED_OUT") {
        router.replace("/(auth)");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isReady]);

  // Always render the stack first, then handle navigation
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <FavoritesProvider>
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
        </FavoritesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
