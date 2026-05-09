import { View, Text, StyleSheet } from 'react-native';

/**
 * Community Screen
 * TODO: Farmer posts, knowledge sharing, Q&A, market insights
 */
export default function CommunityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>Farmer community coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A2B15' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#6B9F7E', marginTop: 8 },
});
