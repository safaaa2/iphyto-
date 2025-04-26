import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SessionProvider } from './session/sessionContext';
import { FavoritesProvider } from '../lib/FavoritesContext';
import { NavigationGuard } from './components/NavigationGuard';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <FavoritesProvider>
          <NavigationGuard />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
          </Stack>
        </FavoritesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
