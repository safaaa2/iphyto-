import { useEffect, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import { useSession } from "../session/sessionContext";

export function NavigationGuard() {
  const { session, loading, authenticating } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  useEffect(() => {
    // Don't navigate if still loading or authenticating
    if (loading || authenticating || isNavigating.current) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      isNavigating.current = true;
      setTimeout(() => {
        router.replace("/(auth)");
      }, 100);
    } else if (session && inAuthGroup) {
      isNavigating.current = true;
      setTimeout(() => {
        router.replace("/(tabs)/search");
      }, 100);
    }

    // Réinitialiser le flag après un court délai
    const timeout = setTimeout(() => {
      isNavigating.current = false;
    }, 200);

    return () => clearTimeout(timeout);
  }, [session, loading, authenticating, segments]);

  return null;
}
