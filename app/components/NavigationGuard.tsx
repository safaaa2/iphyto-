import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSession } from '../session/sessionContext';

export function NavigationGuard() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  useEffect(() => {
    if (loading || isNavigating.current) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      isNavigating.current = true;
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      isNavigating.current = true;
      router.replace('/(tabs)/home');
    }

    // Réinitialiser le flag après un court délai
    const timeout = setTimeout(() => {
      isNavigating.current = false;
    }, 100);

    return () => clearTimeout(timeout);
  }, [session, loading, segments]);

  return null;
} 