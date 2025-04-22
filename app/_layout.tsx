import { Stack } from 'expo-router';
import { FavoritesProvider } from '../lib/FavoritesContext';
import { Slot } from 'expo-router';
import { SessionProvider } from './session/sessionContext';
import { NavigationGuard } from './components/NavigationGuard';

export default function RootLayout() {
  return (
    <SessionProvider>
      <FavoritesProvider>
        <NavigationGuard />
        <Slot />
      </FavoritesProvider>
    </SessionProvider>
  );
}
