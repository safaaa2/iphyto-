import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen
        name="index"
        options={{ animation: "fade", presentation: "transparentModal" }}
      />

      <Stack.Screen
        name="signup"
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack>
  );
}
