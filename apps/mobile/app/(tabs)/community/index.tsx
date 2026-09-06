import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CommunityPost, PostAuthor } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type } from '@/constants/theme';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { useAddReply, useCommunityReplies } from '@/hooks/useCommunityReplies';
import {
  useCommunityPosts,
  useCreatePost,
  useDeletePost,
  useToggleVote,
} from '@/hooks/useCommunityPosts';
import { useFarmer } from '@/hooks/useFarmer';
import { storageApi } from '@/services/endpoints';

function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function Avatar({ author, size = 40 }: { author: PostAuthor | null; size?: number }) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (author?.avatarUrl) {
    return <Image source={{ uri: author.avatarUrl }} style={dimension} />;
  }
  return (
    <View style={[dimension, styles.avatarFallback]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>
        {(author?.fullName ?? 'F').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function RepliesSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const { data: replies = [], isLoading } = useCommunityReplies(postId);
  const addReply = useAddReply(postId);

  async function submit() {
    const content = text.trim();
    if (!content) return;
    try {
      await addReply.mutateAsync(content);
      setText('');
    } catch (error) {
      Alert.alert('Could not post', (error as Error).message);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Replies</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
              <MaterialIcons name="close" size={22} color={Colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.sheetLoader} />
          ) : replies.length === 0 ? (
            <Text style={styles.sheetEmpty}>No replies yet. Be the first to help.</Text>
          ) : (
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetList}>
              {replies.map((reply) => (
                <View key={reply.id} style={styles.replyRow}>
                  <Avatar author={reply.author} size={32} />
                  <View style={styles.replyBubble}>
                    <Text style={styles.replyAuthor}>{reply.author?.fullName ?? 'Farmer'}</Text>
                    <Text style={styles.replyText}>{reply.content}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a reply"
              placeholderTextColor={Colors.outline}
              style={styles.composerInput}
              multiline
            />
            <Pressable
              onPress={submit}
              disabled={!text.trim() || addReply.isPending}
              accessibilityRole="button"
              accessibilityLabel="Send reply"
              style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            >
              {addReply.isPending ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : (
                <MaterialIcons name="send" size={18} color={Colors.onPrimary} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ComposeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video'; mime: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const createPost = useCreatePost();

  async function pickMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach an image or video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    const type = asset.type === 'video' ? 'video' : 'image';
    setMedia({
      uri: asset.uri,
      type,
      mime: asset.mimeType ?? (type === 'video' ? 'video/mp4' : 'image/jpeg'),
    });
  }

  function reset() {
    setTitle('');
    setContent('');
    setMedia(null);
  }

  async function submit() {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    try {
      // The API uploads to storage; the app never holds a storage credential.
      let imageUrl: string | undefined;
      if (media) {
        const extension = media.mime.split('/')[1] ?? 'jpg';
        const upload = await storageApi.upload(
          'community-media',
          media.uri,
          `post.${extension}`,
          media.mime,
        );
        imageUrl = upload.publicUrl;
      }

      await createPost.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        imageUrl,
        mediaType: media?.type,
      });
      reset();
      onClose();
    } catch (error) {
      Alert.alert('Could not post', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Ask the community</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
              <MaterialIcons name="close" size={22} color={Colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.composeBody}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What is the question?"
              placeholderTextColor={Colors.outline}
              style={styles.titleInput}
              maxLength={160}
            />
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Describe what you are seeing, and what you have already tried."
              placeholderTextColor={Colors.outline}
              style={styles.contentInput}
              multiline
              textAlignVertical="top"
            />

            {media ? (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                <Pressable
                  onPress={() => setMedia(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove attachment"
                  style={styles.mediaRemove}
                >
                  <MaterialIcons name="close" size={16} color={Colors.onError} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.composeActions}>
              <Button label="Attach" variant="text" icon="add-photo-alternate" onPress={pickMedia} />
              <Button
                label="Post"
                onPress={submit}
                loading={busy}
                disabled={!title.trim() || !content.trim()}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PostCard({
  post,
  onReply,
  onVote,
  onDelete,
}: {
  post: CommunityPost;
  onReply: () => void;
  onVote: () => void;
  onDelete: () => void;
}) {
  return (
    <Card variant="outlined" style={styles.post}>
      <View style={styles.postHeader}>
        <Avatar author={post.author} />
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{post.author?.fullName ?? 'Farmer'}</Text>
          <Text style={styles.postSubtitle}>
            {[post.author?.district, post.author?.state].filter(Boolean).join(', ') || 'India'}
            {' · '}
            {relativeTime(post.createdAt)}
          </Text>
        </View>
        {post.isOwn ? (
          <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete post" hitSlop={8}>
            <MaterialIcons name="delete-outline" size={20} color={Colors.onSurfaceVariant} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent}>{post.content}</Text>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.postActions}>
        <Pressable onPress={onVote} accessibilityRole="button" style={styles.postAction} hitSlop={6}>
          <MaterialIcons name="thumb-up-off-alt" size={18} color={Colors.onSurfaceVariant} />
          <Text style={styles.postActionLabel}>{post.upvotes}</Text>
        </Pressable>
        <Pressable onPress={onReply} accessibilityRole="button" style={styles.postAction} hitSlop={6}>
          <MaterialIcons name="chat-bubble-outline" size={18} color={Colors.onSurfaceVariant} />
          <Text style={styles.postActionLabel}>
            {post.replyCount === 0 ? 'Reply' : post.replyCount}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [composing, setComposing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: farmer } = useFarmer();
  const { data: posts, isLoading, refetch, isRefetching } = useCommunityPosts();
  const vote = useToggleVote();
  const remove = useDeletePost();

  function confirmDelete(postId: string) {
    Alert.alert('Delete post', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(postId) },
    ]);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.appBar, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.appBarText}>
          <Text style={styles.appBarTitle}>Community</Text>
          <Text style={styles.appBarSubtitle}>
            {farmer?.district ? `Farmers near ${farmer.district}` : 'Farmers across India'}
          </Text>
        </View>
        <Button label="Ask" icon="edit" onPress={() => setComposing(true)} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2].map((key) => (
              <Card key={key} variant="outlined" style={styles.post}>
                <Skeleton width="55%" height={16} />
                <Skeleton width="90%" height={20} />
                <Skeleton height={48} />
              </Card>
            ))}
          </View>
        ) : posts?.length ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReply={() => setReplyingTo(post.id)}
              onVote={() => vote.mutate({ postId: post.id, liked: false })}
              onDelete={() => confirmDelete(post.id)}
            />
          ))
        ) : (
          <EmptyState
            icon="forum"
            title="No questions yet"
            description="Ask about a pest, a price or a practice. Farmers nearby see it first."
            actionLabel="Ask a question"
            onAction={() => setComposing(true)}
          />
        )}
      </ScrollView>

      <ComposeSheet visible={composing} onClose={() => setComposing(false)} />
      {replyingTo ? (
        <RepliesSheet postId={replyingTo} onClose={() => setReplyingTo(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  appBarText: { flex: 1 },
  appBarTitle: { ...Type.headlineSmall, color: Colors.onSurface },
  appBarSubtitle: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  skeletonList: { gap: Spacing.md },

  post: { padding: Spacing.lg, gap: Spacing.sm },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  postMeta: { flex: 1 },
  postAuthor: { ...Type.titleSmall, color: Colors.onSurface },
  postSubtitle: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  postTitle: { ...Type.titleMedium, color: Colors.onSurface },
  postContent: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: Shape.medium,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  postActions: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.xs },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  postActionLabel: { ...Type.labelLarge, color: Colors.onSurfaceVariant },

  avatarFallback: {
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { ...Type.titleMedium, color: Colors.onSecondaryContainer },

  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Shape.extraLarge,
    borderTopRightRadius: Shape.extraLarge,
    paddingBottom: Spacing.xl,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  sheetTitle: { ...Type.titleLarge, color: Colors.onSurface },
  sheetLoader: { margin: Spacing.xl },
  sheetEmpty: {
    ...Type.bodyMedium,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    padding: Spacing.xl,
  },
  sheetScroll: { maxHeight: 360 },
  sheetList: { gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },

  replyRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  replyBubble: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shape.medium,
    padding: Spacing.md,
    gap: 2,
  },
  replyAuthor: { ...Type.labelLarge, color: Colors.onSurface },
  replyText: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: Shape.extraLarge,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    ...Type.bodyMedium,
    color: Colors.onSurface,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: Shape.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },

  composeBody: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  titleInput: {
    height: 56,
    borderRadius: Shape.small,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: Spacing.lg,
    ...Type.titleMedium,
    color: Colors.onSurface,
  },
  contentInput: {
    minHeight: 120,
    borderRadius: Shape.small,
    backgroundColor: Colors.surfaceContainerHighest,
    padding: Spacing.lg,
    ...Type.bodyMedium,
    color: Colors.onSurface,
  },
  mediaPreview: { borderRadius: Shape.medium, overflow: 'hidden' },
  mediaImage: { width: '100%', height: 180, backgroundColor: Colors.surfaceContainerHighest },
  mediaRemove: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: Shape.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
