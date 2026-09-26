import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useSahayak } from '../useSahayak';
import { ModelDownloadCard } from './ModelDownloadCard';

export function SahayakSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { status, error, messages, streaming, summary, send, stop, load, variant, onModelReady } =
    useSahayak();
  const [draft, setDraft] = useState('');

  function submit() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void send(text);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.scrim}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Sahayak</Text>
                <Text style={styles.subtitle}>{summary}</Text>
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
                <MaterialIcons name="close" size={22} color={Colors.onSurface} />
              </Pressable>
            </View>

            {status === 'unsupported' ? (
              <Notice
                icon="phonelink-off"
                title="Not available here"
                body={error ?? 'Sahayak runs on-device on Android. Open the app on an Android phone.'}
              />
            ) : status === 'checking' ? (
              <View style={styles.centre}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : status === 'missing' ? (
              <ModelDownloadCard variant={variant} onReady={onModelReady} />
            ) : status === 'ready' ? (
              <Notice
                icon="bolt"
                title="Ready to start"
                body="The model is on your phone. Loading it takes a few seconds the first time."
                actionLabel="Start Sahayak"
                onAction={load}
              />
            ) : status === 'loading' ? (
              <View style={styles.centre}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.centreText}>Loading the model…</Text>
              </View>
            ) : status === 'error' ? (
              <Notice icon="error-outline" title="Could not start" body={error ?? 'Unknown error.'} actionLabel="Try again" onAction={load} />
            ) : (
              <>
                <ScrollView
                  style={styles.thread}
                  contentContainerStyle={styles.threadContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {messages.length === 0 && (
                    <Text style={styles.hint}>
                      Ask about irrigation, a pest you have seen, fertiliser dose or today&apos;s
                      mandi rate. Answers use your own farm records.
                    </Text>
                  )}
                  {messages.map((m) => (
                    <View
                      key={m.id}
                      style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
                    >
                      <Text style={m.role === 'user' ? styles.bubbleUserText : styles.bubbleAssistantText}>
                        {m.text || '…'}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.composer}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Ask Sahayak"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    style={styles.input}
                    multiline
                    onSubmitEditing={submit}
                  />
                  <Pressable
                    onPress={streaming ? stop : submit}
                    style={[styles.sendBtn, !draft.trim() && !streaming && styles.sendBtnIdle]}
                    disabled={!draft.trim() && !streaming}
                    accessibilityRole="button"
                    accessibilityLabel={streaming ? 'Stop' : 'Send'}
                  >
                    <MaterialIcons
                      name={streaming ? 'stop' : 'arrow-upward'}
                      size={22}
                      color={Colors.onPrimary}
                    />
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Notice({
  icon, title, body, actionLabel, onAction,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeIcon}>
        <MaterialIcons name={icon} size={28} color={Colors.onSecondaryContainer} />
      </View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.noticeBtn}>
          <Text style={styles.noticeBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(11,28,48,0.4)', justifyContent: 'flex-end' },
  fill: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Shape.extraLarge,
    borderTopRightRadius: Shape.extraLarge,
    paddingTop: Spacing.md,
    // Grow with the content up to most of the screen, rather than a fixed
    // height that clips the shorter states.
    maxHeight: '88%',
    minHeight: '45%',
  },
  handle: {
    width: 40, height: 4, borderRadius: Shape.full,
    backgroundColor: Colors.outlineVariant, alignSelf: 'center',
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerText: { flex: 1 },
  title: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  subtitle: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 2 },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  centreText: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },

  thread: { flex: 1 },
  threadContent: { padding: Spacing.xl, gap: Spacing.md },
  hint: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center', paddingVertical: Spacing.xl },
  bubble: { maxWidth: '88%', padding: Spacing.md, borderRadius: Shape.extraLarge },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: Shape.small },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceContainerHigh, borderBottomLeftRadius: Shape.small },
  bubbleUserText: { ...Type.bodyLarge, color: Colors.onPrimary },
  bubbleAssistantText: { ...Type.bodyLarge, color: Colors.onSurface },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm,
  },
  input: {
    flex: 1, minHeight: 52, maxHeight: 120,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md,
    borderRadius: Shape.extraLarge, backgroundColor: Colors.surfaceContainerHigh,
    ...Type.bodyLarge, color: Colors.onSurface,
  },
  sendBtn: {
    width: 52, height: 52, borderRadius: Shape.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnIdle: { backgroundColor: Colors.outlineVariant },

  notice: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  noticeIcon: {
    width: 64, height: 64, borderRadius: Shape.full,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  noticeTitle: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  noticeBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 320 },
  noticeBtn: {
    marginTop: Spacing.md, height: 52, paddingHorizontal: Spacing.xxl,
    borderRadius: Shape.full, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeBtnText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
});
