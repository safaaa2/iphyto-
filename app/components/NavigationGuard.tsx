import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSession } from '../session/sessionContext';

export function NavigationGuard() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      // Redirect to the home page.
      router.replace('/(tabs)/home');
    }
  }, [session, loading, segments]);

  return null;
} 