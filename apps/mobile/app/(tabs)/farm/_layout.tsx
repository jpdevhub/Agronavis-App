import { Stack } from 'expo-router';

// All farm sub-pages (map, fields, history, settings) are stacked
// on top of the My Farms index screen — they do NOT appear as tabs.
export default function FarmLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
