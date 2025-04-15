import { Slot } from 'expo-router';
import { SessionProvider } from './session/sessionContext';
import { NavigationGuard } from './components/NavigationGuard';

export default function RootLayout() {
  return (
    <SessionProvider>
      <NavigationGuard />
      <Slot />
    </SessionProvider>
  );
}
