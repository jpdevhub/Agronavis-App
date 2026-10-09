/** Community feed. Posts, votes and replies all go through the API. */
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Image, TextInput, Modal, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radii, Shape, Spacing, TypeEmphasized } from '@/constants/theme';
import { showAlert } from '@/utils/alert';
import { useFarmer } from '@/hooks/useFarmer';
import { useAuthStore } from '@/store/useAuthStore';
import { storageApi } from '@/services/endpoints';
import { useCommunityPosts, useCreatePost, useToggleVote } from '@/hooks/useCommunityPosts';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { MandiPricesView } from '@/features/mandi';
import { Avatar, Loader } from '@/components/ui';
import { useCommunityReplies, useAddReply } from '@/hooks/useCommunityReplies';

const TREND_MARK: Record<string, string> = { up: '▲', down: '▼', stable: '●' };

type Segment = 'feed' | 'mandi';
const SEGMENTS: { key: Segment; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
  { key: 'feed', label: 'Community', icon: 'forum' },
  { key: 'mandi', label: 'Live Mandi', icon: 'storefront' },
];

function ReplyPanel({ postId, onClose }: { postId: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const { data: replies = [], isLoading } = useCommunityReplies(postId);
  const addReply = useAddReply(postId);

  async function submit() {
    if (!text.trim()) return;
    try { await addReply.mutateAsync(text.trim()); setText(''); }
    catch { showAlert('Could not post', 'Your reply was not sent. Try again.'); }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.replyModal}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.replySheet, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.replyHandle} />
          <View style={styles.replyTopRow}>
            <Text style={styles.replyTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <Loader tone="onColor" size={28} style={{ margin: 20 }} />
          ) : replies.length === 0 ? (
            <Text style={styles.emptyReply}>No comments yet. Be the first!</Text>
          ) : (
            <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 12, padding: 16 }}>
              {replies.map(r => (
                <View key={r.id} style={styles.replyRow}>
                  <Avatar uri={r.author?.avatarUrl} name={r.author?.fullName} size={34} />
                  <View style={styles.replyBubble}>
                    <Text style={styles.replyAuthor}>{r.author?.fullName ?? 'Farmer'}</Text>
                    <Text style={styles.replyText}>{r.content}</Text>
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
                ? <Loader tone="onColor" size={28} />
                : <MaterialIcons name="send" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// The API owns the storage credentials, so the app posts the file to it rather
// than to Supabase directly.
async function uploadMedia(uri: string, mimeType: string): Promise<string> {
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/gif': 'gif', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  };
  const ext = extMap[mimeType] ?? uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const result = await storageApi.upload('community-media', uri, `${Date.now()}.${ext}`, mimeType);
  return result.publicUrl;
}

function CreatePostModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
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
        uploadedUrl = await uploadMedia(mediaUri, mediaMime);
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
      showAlert('Upload failed', e?.message ?? 'Please try again.');
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
        <View style={[styles.replySheet, { paddingBottom: insets.bottom + Spacing.md }]}>
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

            <TouchableOpacity
              disabled={!canSubmit}
              onPress={submit}
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              activeOpacity={0.88}
            >
              {uploading
                ? <><Loader size={28} /><Text style={styles.submitBtnText}>Uploading…</Text></>
                : <Text style={styles.submitBtnText}>Post to Community</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { data: farmer }  = useFarmer();
  const { data: posts = [], isLoading, refetch } = useCommunityPosts();
  const toggleVote = useToggleVote();
  const { data: prices = [] } = useMarketPrices(farmer?.state);

  const [segment, setSegment] = useState<Segment>('feed');
  const [likedIds, setLikedIds]       = useState<Set<string>>(new Set());
  const [openReply, setOpenReply]     = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  function handleLike(postId: string) {
    const liked = likedIds.has(postId);
    setLikedIds(prev => {
      const next = new Set(prev);
      if (liked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    toggleVote.mutate({ postId, liked });
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} activeOpacity={0.85}>
          <Avatar uri={farmer?.avatarUrl} name={farmer?.fullName} size={40} />
        </TouchableOpacity>
        <Text style={styles.logo}>Agronavis</Text>
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.segments}>
        {SEGMENTS.map(({ key, label, icon }) => {
          const active = segment === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setSegment(key)}
              style={[styles.segment, active && styles.segmentActive]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <MaterialIcons
                name={icon}
                size={18}
                color={active ? Colors.onSecondaryContainer : Colors.onSurfaceVariant}
              />
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {segment === 'mandi' ? (
        <MandiPricesView />
      ) : (
      <>
      {prices.length > 0 && (
        <View style={styles.ticker}>
          <View style={styles.tickerBadge}>
            <Text style={styles.tickerBadgeText}>Live Mandi</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {prices.map(p => (
              <Text key={p.commodity} style={styles.tickerItem}>
                {p.commodity} ₹{p.price.toLocaleString('en-IN')}/q {TREND_MARK[p.trend] ?? '●'}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
      >
        <Text style={styles.pageTitle}>Community Feed</Text>
        <Text style={styles.pageSub}>
          {posts.length > 0 ? `${posts.length} posts from farmers near you` : 'Connect with farmers in your area'}
        </Text>

        <TouchableOpacity style={styles.createPost} onPress={() => setShowCompose(true)} activeOpacity={0.88}>
          <View style={styles.createIcon}>
            <MaterialIcons name="add-circle-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.createText}>Share an update from your farm...</Text>
        </TouchableOpacity>

        {isLoading ? (
          <Loader size={28} style={{ marginTop: 30 }} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="groups" size={48} color={Colors.outlineVariant} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySub}>Be the first to share something with your farming community!</Text>
          </View>
        ) : posts.map(post => {
          const liked     = likedIds.has(post.id);
          const timeAgo = formatTimeAgo(post.createdAt);

          return (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Avatar uri={post.author?.avatarUrl} name={post.author?.fullName} size={42} />
                <View style={styles.postAuthor}>
                  <Text style={styles.postName}>{post.author?.fullName ?? 'Farmer'}</Text>
                  <Text style={styles.postLoc}>{post.author?.state ?? 'India'} • {timeAgo}</Text>
                </View>
              </View>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent}>{post.content}</Text>
              {post.imageUrl && (
                <Image source={{ uri: post.imageUrl }} style={styles.postImg} resizeMode="cover" />
              )}
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleLike(post.id)}
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

        <View style={{ height: tabBarHeight + 24 }} />
      </ScrollView>
      </>
      )}

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
  logo:     { fontSize: 22, fontWeight: '900', letterSpacing: -0.8, color: Colors.primary },
  notifBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  // Mandi ticker — now BELOW topbar
  segments: {
    flexDirection: 'row', gap: Spacing.xs, padding: Spacing.xs,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    borderRadius: Shape.full, backgroundColor: Colors.surfaceContainerHigh,
  },
  segment: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, height: 44, borderRadius: Shape.full,
  },
  segmentActive: { backgroundColor: Colors.secondaryContainer },
  segmentLabel: { ...TypeEmphasized.labelLarge, color: Colors.onSurfaceVariant },
  segmentLabelActive: { ...TypeEmphasized.labelLarge, color: Colors.onSecondaryContainer },
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
  submitBtn:     { height: 54, borderRadius: Radii.xxl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: Colors.primary },
  submitBtnDisabled: { backgroundColor: Colors.outlineVariant },
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
