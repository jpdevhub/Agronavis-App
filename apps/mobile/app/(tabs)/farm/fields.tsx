import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const FIELDS = [
  { id: '1', name: 'North Plot', size: '2.5 Acres', crop: 'Wheat', status: 'Active', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=70' },
  { id: '2', name: 'South Field', size: '1.8 Acres', crop: 'Corn', status: 'Fallow', img: 'https://images.unsplash.com/photo-1562516155-e0c1ee44059b?w=400&q=70' },
  { id: '3', name: 'East Block', size: '3.2 Acres', crop: 'Soybean', status: 'Planning', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=70' },
];

export default function MappedFieldsScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapped Fields</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {FIELDS.map(field => (
          <View key={field.id} style={styles.fieldCard}>
            <Image source={{ uri: field.img }} style={styles.fieldImg} resizeMode="cover" />
            <View style={styles.fieldInfo}>
              <View style={styles.fieldTop}>
                <Text style={styles.fieldName}>{field.name}</Text>
                <View style={[styles.statusBadge, field.status === 'Active' && styles.activeBadge]}>
                  <Text style={[styles.statusText, field.status === 'Active' && styles.activeText]}>
                    {field.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.fieldMeta}>{field.size} • {field.crop}</Text>
              <TouchableOpacity style={styles.detailBtn} activeOpacity={0.8}>
                <Text style={styles.detailBtnText}>View Details</Text>
                <MaterialIcons name="arrow-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  backBtn:      { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  scroll:       { padding: 20, gap: 14 },
  fieldCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xl, overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  fieldImg:     { width: '100%', height: 130 },
  fieldInfo:    { padding: 16, gap: 8 },
  fieldTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldName:    { fontSize: 17, fontWeight: '700', color: Colors.onSurface },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  activeBadge:  { backgroundColor: Colors.primaryFixed },
  statusText:   { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant },
  activeText:   { color: Colors.primary },
  fieldMeta:    { fontSize: 13, color: Colors.onSurfaceVariant },
  detailBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingTop: 4 },
  detailBtnText:{ fontSize: 13, fontWeight: '700', color: Colors.primary },
});
