import { Stack } from 'expo-router';

export default function SupplierLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}>
      <Stack.Screen
        name="auth"
        options={{
          animation: 'fade',
          presentation: 'transparentModal',
        }}
      />
      <Stack.Screen
        name="products"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
} 