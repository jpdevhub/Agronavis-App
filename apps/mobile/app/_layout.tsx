import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        {/* Standalone modal-style screens accessible from any tab */}
        <Stack.Screen name="crops/index"   options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile/index" options={{ animation: 'slide_from_right'  }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
