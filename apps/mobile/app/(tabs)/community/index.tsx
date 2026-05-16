import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const AVATAR_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80';

const POSTS = [
  {
    id: '1',
    name: 'Rajesh Mishra',
    location: 'Bilaspur • 2h ago',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&q=70',
    content: '"Aphid attack spotted in neighboring village, check your crops."',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=70',
    tag: 'Urgent Alert',
    tagColor: Colors.errorContainer,
    likes: 24,
    replies: 12,
  },
  {
    id: '2',
    name: 'Sunita Kaur',
    location: 'Faridkot • 5h ago',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=70',
    content: 'New irrigation system installed today! The water pressure is significantly better. Anyone else using the solar-pump subsidy?',
    img: null,
    tag: null,
    tagColor: '',
    likes: 0,
    replies: 8,
  },
];

const TICKER = ['Wheat ₹2,275/q ▲', 'Rice (Basmati) ₹4,850/q ▼', 'Cotton ₹7,120/q ▲', 'Soybean ₹4,400/q ●', 'Maize ₹1,950/q ▲'];

export default function CommunityScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Mandi ticker */}
      <View style={styles.ticker}>
        <View style={styles.tickerBadge}>
          <Text style={styles.tickerBadgeText}>Live Mandi</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TICKER.map(t => (
            <Text key={t} style={styles.tickerItem}>{t}</Text>
          ))}
        </ScrollView>
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} activeOpacity={0.85}>
          <Image source={{ uri: AVATAR_URL }} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={styles.logo}>Agronavis</Text>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Community Feed</Text>
        <Text style={styles.pageSub}>Connect with 1,200 farmers in your local circle.</Text>

        {/* Create post */}
        <TouchableOpacity style={styles.createPost} activeOpacity={0.88}>
          <View style={styles.createIcon}>
            <MaterialIcons name="add-circle-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.createText}>Share an update from your farm...</Text>
        </TouchableOpacity>

        {/* Posts */}
        {POSTS.map(post => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
              <View style={styles.postAuthor}>
                <Text style={styles.postName}>{post.name}</Text>
                <Text style={styles.postLoc}>{post.location}</Text>
              </View>
              {post.tag && (
                <View style={[styles.postTag, { backgroundColor: post.tagColor }]}>
                  <Text style={styles.postTagText}>{post.tag}</Text>
                </View>
              )}
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            {post.img && (
              <Image source={{ uri: post.img }} style={styles.postImg} resizeMode="cover" />
            )}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                <MaterialIcons name="thumb-up-off-alt" size={18} color={Colors.onSurface} />
                <Text style={styles.actionText}>{post.likes ? `Helpful (${post.likes})` : 'Like'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                <MaterialIcons name="mode-comment" size={18} color={Colors.onSurface} />
                <Text style={styles.actionText}>{post.replies ? `Comment (${post.replies})` : 'Comment'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Community highlights */}
        <View style={styles.highlightsRow}>
          <View style={[styles.highlightCard, { backgroundColor: Colors.primaryFixed }]}>
            <MaterialIcons name="trending-up" size={28} color={Colors.primary} />
            <Text style={styles.highlightNum}>94%</Text>
            <Text style={styles.highlightLabel}>Local Sentiment</Text>
          </View>
          <View style={[styles.highlightCard, { backgroundColor: Colors.surfaceContainerHighest }]}>
            <MaterialIcons name="groups" size={28} color={Colors.primary} />
            <Text style={styles.highlightNum}>15+</Text>
            <Text style={styles.highlightLabel}>Active Meets</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  ticker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest, paddingVertical: 8,
  },
  tickerBadge: {
    backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4,
    borderTopRightRadius: Radii.full, borderBottomRightRadius: Radii.full,
    marginRight: 8,
  },
  tickerBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tickerItem:    { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant, marginHorizontal: 12 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: 'rgba(248,249,255,0.92)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  avatar:        { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.primaryFixed },
  logo:          { fontSize: 22, fontWeight: '900', letterSpacing: -0.8, color: Colors.primary },
  notifBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll:        { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  pageTitle:     { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.onSurface },
  pageSub:       { fontSize: 14, color: Colors.onSurfaceVariant },
  createPost: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xl, padding: 16,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  createIcon:    { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  createText:    { fontSize: 14, color: Colors.onSurfaceVariant },
  postCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl, overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  postHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 10 },
  postAvatar:    { width: 46, height: 46, borderRadius: 14 },
  postAuthor:    { flex: 1 },
  postName:      { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  postLoc:       { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  postTag:       { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  postTagText:   { fontSize: 10, fontWeight: '800', color: Colors.error, letterSpacing: 0.4 },
  postContent:   { fontSize: 15, color: Colors.onSurfaceVariant, lineHeight: 22, paddingHorizontal: 16, paddingBottom: 12 },
  postImg:       { width: '100%', height: 180, marginBottom: 12 },
  postActions:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.outlineVariant },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 50,
  },
  actionText:    { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  highlightsRow: { flexDirection: 'row', gap: 12 },
  highlightCard: {
    flex: 1, borderRadius: Radii.xxl, padding: 20, gap: 6,
    aspectRatio: 1, justifyContent: 'flex-end',
  },
  highlightNum:  { fontSize: 26, fontWeight: '900', color: Colors.onSurface },
  highlightLabel:{ fontSize: 11, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 },
});
