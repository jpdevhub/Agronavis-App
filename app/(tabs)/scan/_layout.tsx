import { Stack } from 'expo-router';

// scan/result is stacked on top of the AI Scanner screen — does NOT appear as a tab.
export default function ScanLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
