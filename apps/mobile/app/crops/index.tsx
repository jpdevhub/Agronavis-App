import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

type Crop = { id: string; name: string; category: string; img: string };

const CATEGORIES = ['All', 'Grains', 'Legumes', 'Vegetables', 'Fruits', 'Fiber'];

const CROPS: Crop[] = [
  { id: '1', name: 'Wheat',     category: 'Grains',     img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=70' },
  { id: '2', name: 'Soybean',   category: 'Legumes',    img: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=400&q=70' },
  { id: '3', name: 'Corn',      category: 'Grains',     img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=70' },
  { id: '4', name: 'Cotton',    category: 'Fiber',      img: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=400&q=70' },
  { id: '5', name: 'Rice',      category: 'Grains',     img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=70' },
  { id: '6', name: 'Tomato',    category: 'Vegetables', img: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=70' },
  { id: '7', name: 'Mango',     category: 'Fruits',     img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=70' },
  { id: '8', name: 'Chickpea',  category: 'Legumes',    img: 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400&q=70' },
];

export default function CropsScreen() {
  const router = useRouter();
  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('All');
  const [selected,     setSelected]     = useState<Set<string>>(new Set(['1', '4']));

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = CROPS.filter(c => {
    const matchCat = category === 'All' || c.category === category;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Crops</Text>
        <View style={{ width: 38 }} />
      </View>

      <Text style={styles.headerSub}>
        Choose the crops you're currently managing.
      </Text>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={Colors.outline} />
        <TextInput
          id="crop-search"
          style={styles.searchInput}
          placeholder="Search crops..."
          placeholderTextColor={Colors.outline}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        <View style={styles.gridInner}>
          {filtered.map(crop => {
            const isSelected = selected.has(crop.id);
            return (
              <TouchableOpacity
                key={crop.id}
                style={[styles.cropCard, isSelected && styles.cropCardActive]}
                onPress={() => toggle(crop.id)}
                activeOpacity={0.88}
              >
                {/* Selection badge */}
                <View style={[styles.selBadge, isSelected && styles.selBadgeActive]}>
                  <MaterialIcons
                    name={isSelected ? 'check' : 'add'}
                    size={14}
                    color={isSelected ? '#fff' : Colors.outline}
                  />
                </View>
                <Image source={{ uri: crop.img }} style={styles.cropImg} resizeMode="cover" />
                <View style={styles.cropInfo}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <Text style={styles.cropCategory}>{crop.category}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={selected.size > 0 ? [Colors.primary, Colors.primaryContainer] : [Colors.outlineVariant, Colors.outlineVariant]}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmText}>
              Confirm Selection ({selected.size})
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 10,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  backBtn:        { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  headerSub:      { fontSize: 14, color: Colors.onSurfaceVariant, paddingHorizontal: 20, marginTop: 10, marginBottom: 6 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20,
    backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radii.lg, height: 50, paddingHorizontal: 14,
  },
  searchInput:    { flex: 1, fontSize: 15, color: Colors.onSurface },
  catScroll:      { marginTop: 12 },
  catContent:     { paddingHorizontal: 20, gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  catChipActive:  { backgroundColor: Colors.primary },
  catText:        { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  catTextActive:  { color: '#fff' },
  grid:           { paddingTop: 14, paddingBottom: 16 },
  gridInner:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  cropCard: {
    width: '47%', backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cropCardActive: { borderColor: Colors.primaryContainer },
  selBadge: {
    position: 'absolute', top: 10, right: 10, zIndex: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  selBadgeActive: { backgroundColor: Colors.primaryContainer, borderColor: 'transparent' },
  cropImg:        { width: '100%', height: 110 },
  cropInfo:       { padding: 10 },
  cropName:       { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  cropCategory:   { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    backgroundColor: Colors.surface,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: Radii.xxl, gap: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 6,
  },
  confirmText:    { fontSize: 16, fontWeight: '700', color: '#fff' },
});
