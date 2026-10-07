import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { MarkdownText } from '@/features/sahayak/components/MarkdownText';
import { ModelDownloadCard } from '@/features/sahayak/components/ModelDownloadCard';
import { useSahayak } from '@/features/sahayak/useSahayak';
import { useSahayakVoice } from '@/features/sahayak/useSahayakVoice';
import { LANGUAGES } from '@/constants';

const SUGGESTIONS = [
  'When should I irrigate?',
  'What is today’s mandi rate?',
  'My leaves have yellow spots',
];

export default function SahayakScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /**
   * Android reports a bottom inset of zero while the keyboard is up, because
   * the navigation bar is behind it. Reading it live made the composer jump by
   * the height of that bar every time the keyboard opened or closed. Captured
   * once, it stays where the farmer last saw it.
   */
  const [bottomInset] = useState(() => insets.bottom);
  const {
    status, error, messages, streaming, summary, send, stop, load, variant,
    onModelReady, language, setLanguage,
  } = useSahayak();
  const voice = useSahayakVoice(language);
  const [draft, setDraft] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const scroller = useRef<ScrollView>(null);

  /**
   * Streaming calls setMessages on every token, so an effect keyed on
   * `messages` started a fresh animated scroll dozens of times a second and
   * each one cancelled the last — the thread looked frozen. Following the
   * content size fires once per layout instead, and only while the reader is
   * already at the bottom, so scrolling up to re-read is never yanked back.
   */
  const stick = useRef(true);
  const [atLatest, setAtLatest] = useState(true);

  const onContentSizeChange = useCallback(() => {
    if (stick.current) scroller.current?.scrollToEnd({ animated: false });
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const near = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
    stick.current = near;
    // Only on a change: this fires every frame while scrolling.
    setAtLatest((was) => (was === near ? was : near));
  }, []);

  const jumpToLatest = useCallback(() => {
    stick.current = true;
    setAtLatest(true);
    scroller.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    if (voice.heard) setDraft(voice.heard);
  }, [voice.heard]);

  // Read the finished answer aloud, never a half-streamed one.
  const last = messages[messages.length - 1];
  useEffect(() => {
    if (!speakReplies || streaming) return;
    if (last?.role === 'assistant' && last.text) voice.speak(last.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, speakReplies]);

  function submit(text?: string) {
    const question = (text ?? draft).trim();
    if (!question) return;
    setDraft('');
    stick.current = true;
    void send(question);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Sahayak</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{summary}</Text>
        </View>

        <Pressable
          onPress={() => setLangOpen((v) => !v)}
          style={styles.langChip}
          accessibilityLabel="Answer language"
        >
          <MaterialIcons name="translate" size={16} color={Colors.onSecondaryContainer} />
          <Text style={styles.langText}>
            {LANGUAGES.find((l) => l.code === language)?.label ?? 'English'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (voice.speaking) voice.stopSpeaking();
            setSpeakReplies((v) => !v);
          }}
          style={styles.iconBtn}
          accessibilityLabel={speakReplies ? 'Stop reading answers aloud' : 'Read answers aloud'}
        >
          <MaterialIcons
            name={speakReplies ? 'volume-up' : 'volume-off'}
            size={22}
            color={speakReplies ? Colors.primary : Colors.onSurfaceVariant}
          />
        </Pressable>
      </View>

      {langOpen && (
        <View style={styles.langSheet}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => {
                setLanguage(l.code);
                setLangOpen(false);
              }}
              style={[styles.langOption, l.code === language && styles.langOptionActive]}
            >
              <Text style={[styles.langOptionText, l.code === language && styles.langOptionTextActive]}>
                {l.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/*
        SDK 54 draws Android edge to edge, and under that the window is no
        longer resized for the keyboard however windowSoftInputMode is set —
        so nothing lifted the composer and the keyboard covered it. Padding
        behaviour works on both platforms here because neither resizes.
      */}
      <KeyboardAvoidingView
        style={styles.fill}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {status === 'unsupported' ? (
          <Notice icon="phonelink-off" title="Not available here" body={error ?? 'Sahayak runs on-device on Android.'} />
        ) : status === 'checking' ? (
          <View style={styles.centre}><ActivityIndicator color={Colors.primary} /></View>
        ) : status === 'missing' ? (
          <ScrollView><ModelDownloadCard variant={variant} onReady={onModelReady} /></ScrollView>
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
              ref={scroller}
              style={styles.fill}
              contentContainerStyle={styles.thread}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={onContentSizeChange}
              onScroll={onScroll}
              scrollEventThrottle={16}
            >
              {messages.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Ask about your farm</Text>
                  <Text style={styles.emptyBody}>
                    Answers come from your own records and run entirely on this phone.
                  </Text>
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map((s) => (
                      <Pressable key={s} onPress={() => submit(s)} style={styles.suggestion}>
                        <Text style={styles.suggestionText}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                messages.map((m) =>
                  m.role === 'user' ? (
                    <Animated.View
                      key={m.id}
                      entering={FadeInDown.duration(220)}
                      style={[styles.bubble, styles.bubbleUser]}
                    >
                      <Text style={styles.userText}>{m.text}</Text>
                    </Animated.View>
                  ) : (
                    <View
                      key={m.id}
                      style={[styles.bubble, styles.bubbleAssistant]}
                    >
                      {m.text ? (
                        <MarkdownText text={m.text} color={Colors.onSurface} />
                      ) : (
                        <ActivityIndicator color={Colors.primary} />
                      )}
                    </View>
                  ),
                )
              )}
            </ScrollView>

            {!atLatest && messages.length > 0 && (
              <Pressable
                onPress={jumpToLatest}
                style={styles.jump}
                accessibilityRole="button"
                accessibilityLabel="Jump to the latest answer"
              >
                <MaterialIcons name="arrow-downward" size={20} color={Colors.onPrimary} />
              </Pressable>
            )}

            <View style={[styles.composer, { paddingBottom: bottomInset + Spacing.sm }]}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask Sahayak"
                placeholderTextColor={Colors.onSurfaceVariant}
                style={styles.input}
                multiline
              />
              <Pressable
                onPress={() => (voice.listening ? voice.stopListening() : voice.listen())}
                style={[styles.mic, voice.listening && styles.micActive]}
                accessibilityLabel={voice.listening ? 'Stop listening' : 'Speak to Sahayak'}
              >
                <MaterialIcons
                  name={voice.listening ? 'stop' : 'mic'}
                  size={22}
                  color={voice.listening ? Colors.onPrimary : Colors.onSurfaceVariant}
                />
              </Pressable>
              <Pressable
                onPress={() => (streaming ? stop() : submit())}
                style={[styles.send, !draft.trim() && !streaming && styles.sendIdle]}
                disabled={!draft.trim() && !streaming}
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
      </KeyboardAvoidingView>
    </View>
  );
}

function Notice({
  icon, title, body, actionLabel, onAction,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string; body: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeIcon}>
        <MaterialIcons name={icon} size={30} color={Colors.onSecondaryContainer} />
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
  root: { flex: 1, backgroundColor: Colors.surface },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  subtitle: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  centreText: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },

  thread: { padding: Spacing.lg, gap: Spacing.md },
  threadEmpty: { flexGrow: 1 },
  bubble: { maxWidth: '92%', padding: Spacing.md, borderRadius: Shape.extraLarge },
  bubbleUser: {
    alignSelf: 'flex-end', backgroundColor: Colors.primary,
    borderBottomRightRadius: Shape.small,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start', backgroundColor: Colors.surfaceContainerHigh,
    borderBottomLeftRadius: Shape.small,
  },
  userText: { ...Type.bodyLarge, color: Colors.onPrimary },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  emptyTitle: { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  emptyBody: {
    ...Type.bodyMedium, color: Colors.onSurfaceVariant,
    textAlign: 'center', maxWidth: 300, marginBottom: Spacing.lg,
  },
  suggestions: { gap: Spacing.sm, width: '100%' },
  suggestion: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Shape.full, borderWidth: 1, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  suggestionText: { ...Type.bodyLarge, color: Colors.onSurface, textAlign: 'center' },

  jump: {
    position: 'absolute', alignSelf: 'center', bottom: 96,
    width: 40, height: 40, borderRadius: Shape.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1, minHeight: 52, maxHeight: 140,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md,
    borderRadius: Shape.extraLarge, backgroundColor: Colors.surfaceContainerHigh,
    ...Type.bodyLarge, color: Colors.onSurface,
  },
  send: {
    width: 52, height: 52, borderRadius: Shape.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendIdle: { backgroundColor: Colors.outlineVariant },
  mic: {
    width: 52, height: 52, borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  micActive: { backgroundColor: Colors.error },

  langChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, height: 36, borderRadius: Shape.full,
    backgroundColor: Colors.secondaryContainer,
  },
  langText: { ...TypeEmphasized.labelMedium, color: Colors.onSecondaryContainer },
  langSheet: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    padding: Spacing.lg, backgroundColor: Colors.surfaceContainerLow,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  langOption: {
    paddingHorizontal: Spacing.lg, height: 40, justifyContent: 'center',
    borderRadius: Shape.full, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  langOptionActive: { backgroundColor: Colors.primary, borderColor: 'transparent' },
  langOptionText: { ...Type.bodyMedium, color: Colors.onSurface },
  langOptionTextActive: { ...TypeEmphasized.bodyMedium, color: Colors.onPrimary },

  notice: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xxl },
  noticeIcon: {
    width: 72, height: 72, borderRadius: Shape.full,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  noticeTitle: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  noticeBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 320 },
  noticeBtn: {
    marginTop: Spacing.md, height: 56, paddingHorizontal: Spacing.xxl,
    borderRadius: Shape.full, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeBtnText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
});
