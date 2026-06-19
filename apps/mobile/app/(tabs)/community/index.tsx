/**
 * Community Feed
 * - Posts fetched live from Supabase community_posts table
 * - Create post modal (text + optional image)
 * - Like / Comment interactions wired to Supabase
 * - Mandi ticker positioned BELOW the topbar
 */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Image, TextInput, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, Radii } from '@/constants/theme';
import { useFarmer } from '@/hooks/useFarmer';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/utils/supabase';
import { useCommunityPosts, useCreatePost, useToggleLike } from '@/hooks/useCommunityPosts';
import { useCommunityReplies, useAddReply } from '@/hooks/useCommunityReplies';

const TICKER = [
  'Wheat ₹2,275/q ▲', 'Rice (Basmati) ₹4,850/q ▼',
  'Cotton ₹7,120/q ▲', 'Soybean ₹4,400/q ●', 'Maize ₹1,950/q ▲',
];

// ─── Reply panel (per-post) ───────────────────────────────────────────────────
function ReplyPanel({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const { data: replies = [], isLoading } = useCommunityReplies(postId);
  const addReply = useAddReply(postId);

  async function submit() {
    if (!text.trim()) return;
    try { await addReply.mutateAsync(text.trim()); setText(''); }
    catch { Alert.alert('Error', 'Failed to post reply.'); }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.replyModal}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.replySheet}>
          <View style={styles.replyHandle} />
          <View style={styles.replyTopRow}>
            <Text style={styles.replyTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
          ) : replies.length === 0 ? (
            <Text style={styles.emptyReply}>No comments yet. Be the first!</Text>
          ) : (
            <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 12, padding: 16 }}>
              {replies.map(r => (
                <View key={r.id} style={styles.replyRow}>
                  <Image
                    source={{ uri: r.farmers?.avatar_url ?? `https://api.dicebear.com/7.x/personas/png?seed=${r.author_id}` }}
                    style={styles.replyAvatar}
                  />
                  <View style={styles.replyBubble}>
                    <Text style={styles.replyAuthor}>{r.farmers?.full_name ?? 'Farmer'}</Text>
                    <Text style={styles.replyText}>{r.reply_content}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.replyInputRow}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a comment…"
              placeholderTextColor={Colors.outline}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              style={[styles.replySendBtn, !text.trim() && { opacity: 0.4 }]}
              onPress={submit}
              disabled={!text.trim() || addReply.isPending}
            >
              {addReply.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialIcons name="send" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Upload helper ────────────────────────────────────────────────────────────
// Uses expo-file-system to read local URIs (file:// and content://).
// fetch(localUri) fails on Android with ERR_CONNECTION_REFUSED.
async function uploadMedia(uri: string, userId: string, mimeType: string): Promise<string> {
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/gif': 'gif', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  };
  const ext      = extMap[mimeType] ?? uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  // Read file as base64 — works on both file:// (iOS) and content:// (Android)
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });

  // Decode base64 → Uint8Array for Supabase upload
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from('community-media')
    .upload(fileName, bytes, { contentType: mimeType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('community-media').getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── Create post modal ────────────────────────────────────────────────────────
function CreatePostModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle]         = useState('');
  const [content, setContent]     = useState('');
  const [mediaUri, setMediaUri]     = useState<string | null>(null);
  const [mediaType, setMediaType]   = useState<'image' | 'video' | null>(null);
  const [mediaMime, setMediaMime]   = useState<string>('image/jpeg');
  const [uploading, setUploading]   = useState(false);
  const createPost = useCreatePost();
  const user       = useAuthStore((s) => s.user);

  async function pickMedia() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality:    0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
      // Use real mimeType from picker so Android content:// URIs get correct MIME
      setMediaMime(asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'));
    }
  }

  function removeMedia() { setMediaUri(null); setMediaType(null); setMediaMime('image/jpeg'); }

  async function submit() {
    if (!title.trim() || !content.trim() || !user) return;
    setUploading(true);
    try {
      let uploadedUrl: string | undefined;
      if (mediaUri && mediaType) {
        uploadedUrl = await uploadMedia(mediaUri, user.id, mediaMime);
      }
      await createPost.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        imageUrl: uploadedUrl,
        mediaType: mediaType ?? undefined,
      });
      setTitle(''); setContent(''); setMediaUri(null); setMediaType(null); setMediaMime('image/jpeg');
      onClose();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const canSubmit = title.trim() && content.trim() && !uploading;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.replyModal}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.replySheet}>
          <View style={styles.replyHandle} />
          <View style={styles.replyTopRow}>
            <Text style={styles.replyTitle}>Share Update</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <TextInput
              style={styles.createInput}
              placeholder="Title (e.g. Aphid alert in Bilaspur)"
              placeholderTextColor={Colors.outline}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.createInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="What's happening on your farm?"
              placeholderTextColor={Colors.outline}
              value={content}
              onChangeText={setContent}
              multiline
            />

            {/* Media preview */}
            {mediaUri ? (
              <View style={styles.mediaPreviewWrap}>
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
                {mediaType === 'video' && (
                  <View style={styles.videoOverlay}>
                    <MaterialIcons name="play-circle-outline" size={40} color="#fff" />
                  </View>
                )}
                <TouchableOpacity style={styles.removeMediaBtn} onPress={removeMedia}>
                  <MaterialIcons name="cancel" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.mediaTypePill}>
                  <MaterialIcons name={mediaType === 'video' ? 'videocam' : 'photo'} size={12} color="#fff" />
                  <Text style={styles.mediaTypePillText}>{mediaType === 'video' ? 'Video' : 'Photo'}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
                <MaterialIcons name="perm-media" size={22} color={Colors.primary} />
                <Text style={styles.mediaPickerText}>Add Photo or Video</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity disabled={!canSubmit} onPress={submit}>
              <LinearGradient
                colors={canSubmit ? [Colors.primary, '#004d34'] : ['#ccc', '#bbb']}
                style={styles.submitBtn}
              >
                {uploading
                  ? <><ActivityIndicator color="#fff" size="small" /><Text style={styles.submitBtnText}>Uploading…</Text></>
                  : <Text style={styles.submitBtnText}>Post to Community</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CommunityScreen() {
  const router = useRouter();
  const { data: farmer }  = useFarmer();
  const { data: posts = [], isLoading, refetch } = useCommunityPosts();
  const toggleLike = useToggleLike();

  const [likedIds, setLikedIds]       = useState<Set<string>>(new Set());
  const [openReply, setOpenReply]     = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  const avatarUri = farmer?.avatar_url
    ?? `https://api.dicebear.com/7.x/personas/png?seed=${encodeURIComponent(farmer?.full_name ?? 'farmer')}`;

  function handleLike(postId: string, currentLikes: number) {
    const liked = likedIds.has(postId);
    setLikedIds(prev => {
      const next = new Set(prev);
      liked ? next.delete(postId) : next.add(postId);
      return next;
    });
    toggleLike.mutate({ postId, currentLikes, liked });
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} activeOpacity={0.85}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={styles.logo}>Agronavis</Text>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Mandi ticker (BELOW topbar) ── */}
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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
      >
        <Text style={styles.pageTitle}>Community Feed</Text>
        <Text style={styles.pageSub}>
          {posts.length > 0 ? `${posts.length} posts from farmers near you` : 'Connect with farmers in your area'}
        </Text>

        {/* Create post */}
        <TouchableOpacity style={styles.createPost} onPress={() => setShowCompose(true)} activeOpacity={0.88}>
          <View style={styles.createIcon}>
            <MaterialIcons name="add-circle-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.createText}>Share an update from your farm...</Text>
        </TouchableOpacity>

        {/* Live posts */}
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="groups" size={48} color={Colors.outlineVariant} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySub}>Be the first to share something with your farming community!</Text>
          </View>
        ) : posts.map(post => {
          const liked     = likedIds.has(post.id);
          const authorAvatar = post.farmers?.avatar_url
            ?? `https://api.dicebear.com/7.x/personas/png?seed=${post.author_id}`;
          const timeAgo   = formatTimeAgo(post.created_at);

          return (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={{ uri: authorAvatar }} style={styles.postAvatar} />
                <View style={styles.postAuthor}>
                  <Text style={styles.postName}>{post.farmers?.full_name ?? 'Farmer'}</Text>
                  <Text style={styles.postLoc}>{post.farmers?.state ?? 'India'} • {timeAgo}</Text>
                </View>
              </View>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent}>{post.content}</Text>
              {post.attached_image_url && (
                <Image source={{ uri: post.attached_image_url }} style={styles.postImg} resizeMode="cover" />
              )}
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleLike(post.id, post.upvotes)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={liked ? 'thumb-up' : 'thumb-up-off-alt'}
                    size={18}
                    color={liked ? Colors.primary : Colors.onSurface}
                  />
                  <Text style={[styles.actionText, liked && { color: Colors.primary }]}>
                    {post.upvotes + (liked ? 1 : 0) > 0 ? `Helpful (${post.upvotes + (liked ? 1 : 0)})` : 'Helpful'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setOpenReply(post.id)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="mode-comment" size={18} color={Colors.onSurface} />
                  <Text style={styles.actionText}>Comment</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Live stats derived from real data */}
        <View style={styles.highlightsRow}>
          <View style={[styles.highlightCard, { backgroundColor: Colors.primaryFixed }]}>
            <MaterialIcons name="article" size={28} color={Colors.primary} />
            <Text style={styles.highlightNum}>{posts.length}</Text>
            <Text style={styles.highlightLabel}>Posts</Text>
          </View>
          <View style={[styles.highlightCard, { backgroundColor: Colors.surfaceContainerHighest }]}>
            <MaterialIcons name="groups" size={28} color={Colors.primary} />
            <Text style={styles.highlightNum}>
              {posts.reduce((sum, p) => sum + p.upvotes, 0)}
            </Text>
            <Text style={styles.highlightLabel}>Helpful Votes</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <CreatePostModal visible={showCompose} onClose={() => setShowCompose(false)} />
      {openReply && <ReplyPanel postId={openReply} onClose={() => setOpenReply(null)} />}
    </View>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.surface },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    backgroundColor: 'rgba(248,249,255,0.96)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  avatar:   { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.primaryFixed },
  logo:     { fontSize: 22, fontWeight: '900', letterSpacing: -0.8, color: Colors.primary },
  notifBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  // Mandi ticker — now BELOW topbar
  ticker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest, paddingVertical: 8,
  },
  tickerBadge: {
    backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4,
    borderTopRightRadius: Radii.full, borderBottomRightRadius: Radii.full, marginRight: 8,
  },
  tickerBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tickerItem:      { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant, marginHorizontal: 12 },

  scroll:    { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.onSurface },
  pageSub:   { fontSize: 14, color: Colors.onSurfaceVariant },

  createPost: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xl, padding: 16,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  createIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  createText: { fontSize: 14, color: Colors.onSurfaceVariant },

  postCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl, overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  postHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 10 },
  postAvatar:  { width: 46, height: 46, borderRadius: 14 },
  postAuthor:  { flex: 1 },
  postName:    { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  postLoc:     { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  postTitle:   { fontSize: 15, fontWeight: '700', color: Colors.onSurface, paddingHorizontal: 16, paddingBottom: 4 },
  postContent: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 12 },
  postImg:     { width: '100%', height: 180, marginBottom: 12 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.outlineVariant },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50,
  },
  actionText:  { fontSize: 14, fontWeight: '600', color: Colors.onSurface },

  highlightsRow: { flexDirection: 'row', gap: 12 },
  highlightCard: { flex: 1, borderRadius: Radii.xxl, padding: 20, gap: 6, aspectRatio: 1, justifyContent: 'flex-end' },
  highlightNum:  { fontSize: 26, fontWeight: '900', color: Colors.onSurface },
  highlightLabel:{ fontSize: 11, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 },

  emptyState:  { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  emptySub:    { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' },

  // Reply panel
  replyModal:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  replySheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  replyHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.outlineVariant, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  replyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  replyTitle:  { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  replyRow:    { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  replyAvatar: { width: 36, height: 36, borderRadius: 10 },
  replyBubble: { flex: 1, backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radii.lg, padding: 10 },
  replyAuthor: { fontSize: 13, fontWeight: '700', color: Colors.onSurface, marginBottom: 3 },
  replyText:   { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20 },
  emptyReply:  { textAlign: 'center', color: Colors.outline, paddingVertical: 20 },
  replyInputRow: { flexDirection: 'row', gap: 10, padding: 16, alignItems: 'flex-end' },
  replyInput: {
    flex: 1, backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radii.lg,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.onSurface,
    maxHeight: 100,
  },
  replySendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Create post modal
  createInput: {
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radii.lg,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.onSurface,
  },
  submitBtn:     { height: 54, borderRadius: Radii.xxl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Media picker / preview
  mediaPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primaryFixed, borderRadius: Radii.lg,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  mediaPickerText:  { fontSize: 14, fontWeight: '600', color: Colors.primary },
  mediaPreviewWrap: { borderRadius: Radii.lg, overflow: 'hidden', height: 160, position: 'relative' },
  mediaPreview:     { width: '100%', height: '100%' },
  videoOverlay:     { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  removeMediaBtn:   { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  mediaTypePill: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radii.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  mediaTypePillText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
