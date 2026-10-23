import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Text,
  TextInput,
  View,
} from 'react-native';
import { confirmAction } from '@/utils/alert';
import { useGoBack } from '@/hooks/useGoBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { MarkdownText } from '@/features/sahayak/components/MarkdownText';
import { ModelDownloadCard } from '@/features/sahayak/components/ModelDownloadCard';
import { APPROX_SIZE_GB } from '@/features/sahayak/ondevice/modelFile';
import { useSahayak } from '@/features/sahayak/useSahayak';
import { useSahayakVoice } from '@/features/sahayak/useSahayakVoice';
import { LANGUAGES } from '@/constants';
import { Loader } from '@/components/ui';

const SUGGESTIONS = [
  'When should I irrigate?',
  'What is today’s mandi rate?',
  'My leaves have yellow spots',
];

export default function SahayakScreen() {
  const goBack = useGoBack('/(tabs)/dashboard');
  const insets = useSafeAreaInsets();

  /**
   * Android reports a bottom inset of zero while the keyboard is up, because
   * the navigation bar sits behind it. Reading it live made the composer jump
   * by the height of that bar every time the keyboard opened. Captured once,
   * it stays where the farmer last saw it.
   */
  const [bottomInset] = useState(() => insets.bottom);

  /** The download card appears on request rather than replacing the chat. */
  const [showDownload, setShowDownload] = useState(false);


  /**
   * The keyboard's height, tracked rather than inferred.
   *
   * KeyboardAvoidingView was doing this, and on Android under edge-to-edge it
   * kept its padding after the keyboard closed — so once the first message was
   * sent the composer stayed lifted with a band of empty screen beneath it.
   * Listening to the keyboard directly means the value returns to zero when
   * the keyboard goes, because that is what the dismiss event says.
   */
  const [keyboard, setKeyboard] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboard(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboard(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const {
    status, error, messages, streaming, summary, send, stop, load, variant,
    onModelReady, language, setLanguage, reset,
  } = useSahayak();
  /**
   * Sahayak is not on this phone, so nothing can be asked of it yet.
   *
   * Distinct from "loading" or "ready": those are a wait, this is a missing
   * file. The screen invites the download rather than offering a composer
   * whose every question comes back as an error.
   */
  const needsModel = status === 'missing' || status === 'unsupported';
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
  const dragging = useRef(false);
  const [atLatest, setAtLatest] = useState(true);

  const onContentSizeChange = useCallback(() => {
    if (stick.current) scroller.current?.scrollToEnd({ animated: false });
  }, []);

  const nearBottom = (e: NativeSyntheticEvent<NativeScrollEvent>): boolean => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    return contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
  };

  /**
   * Only a scroll the reader performed may change whether the thread follows
   * the answer. Programmatic ones must not: scrollToEnd fires onScroll too, so
   * reading position alone meant every streamed token re-armed the follow and
   * yanked the reader back the moment they scrolled up.
   */
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const near = nearBottom(e);
    if (dragging.current) stick.current = near;
    // Only on a change: this fires every frame while scrolling.
    setAtLatest((was) => (was === near ? was : near));
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    dragging.current = true;
  }, []);

  const onScrollEndDrag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    dragging.current = false;
    stick.current = nearBottom(e);
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

    /**
     * Asking is as good as pressing Start.
     *
     * The model used to be a gate in front of the chat, so there was no way
     * to type before it was up. Now that the composer is always there, a
     * question typed while it is still loading should start it rather than
     * disappear.
     */
    if (status === 'ready') {
      setDraft('');
      setPending(question);
      void load();
      return;
    }

    setDraft('');
    stick.current = true;
    void send(question);
  }

  /**
   * A question asked before the model was ready, sent once it is.
   */
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    if (status !== 'loaded' || !pending) return;
    const question = pending;
    setPending(null);
    stick.current = true;
    void send(question);
  }, [status, pending, send]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => goBack()} style={styles.iconBtn} accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Sahayak</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{summary}</Text>
        </View>

        {/* Clearing is the farmer's own decision and cannot be undone, so it
            asks — but only when there is something to lose. */}
        <Pressable
          onPress={() => {
            if (messages.length === 0 || streaming) return;
            confirmAction(
              'Start a new chat?',
              'This conversation will be deleted from this phone.',
              'Delete and start new',
              reset,
            );
          }}
          style={[styles.iconBtn, (messages.length === 0 || streaming) && styles.iconBtnOff]}
          disabled={messages.length === 0 || streaming}
          accessibilityRole="button"
          accessibilityLabel="Start a new chat"
        >
          <MaterialIcons name="add-comment" size={20} color={Colors.onSurface} />
        </Pressable>

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
        longer resized for the keyboard however windowSoftInputMode is set — so
        something has to lift the composer. KeyboardAvoidingView did it, but on
        Android it kept its padding after the keyboard closed, leaving the
        composer stranded above a band of empty screen from the first message
        onward. A plain View padded by the tracked keyboard height goes back
        down, because the dismiss event says so.
      */}
      <View style={[styles.fill, { paddingBottom: keyboard }]}>
        {/*
          The thread and the composer are always on screen.

          Every model state used to replace the whole chat, so opening
          Sahayak showed a spinner on white until several gigabytes had
          been read off disk — on the one screen that needs nothing from
          anywhere, because the model runs on the handset. What the model
          is doing appears as a strip above the composer instead.
        */}
            <ScrollView
              ref={scroller}
              style={styles.fill}
              contentContainerStyle={[styles.thread, messages.length === 0 && styles.threadEmpty]}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={onContentSizeChange}
              onScroll={onScroll}
              onScrollBeginDrag={onScrollBeginDrag}
              onScrollEndDrag={onScrollEndDrag}
              onMomentumScrollEnd={onScrollEndDrag}
              scrollEventThrottle={16}
            >
              {messages.length === 0 ? (
                needsModel ? (
                  /*
                    Sahayak is not on the phone yet, so there is nothing to
                    ask. This used to be a thin strip above the composer while
                    the middle of the screen sat empty — and the composer
                    still accepted questions, which came back as "Model not
                    loaded. Call load() first." The invitation belongs where
                    the farmer is looking.
                  */
                  <View style={styles.gate}>
                    <View style={styles.gateIcon}>
                      <MaterialIcons name="download" size={30} color={Colors.onPrimaryContainer} />
                    </View>
                    <Text style={styles.gateTitle}>Bring Sahayak to your phone</Text>
                    <Text style={styles.gateBody}>
                      Sahayak answers without sending anything anywhere, so it has to live on your
                      handset. It is a {APPROX_SIZE_GB[variant]} GB download, once, and best done
                      on wi-fi. You can carry on using the app while it arrives.
                    </Text>
                    <Pressable
                      onPress={() => setShowDownload(true)}
                      style={styles.gateBtn}
                      accessibilityRole="button"
                    >
                      <MaterialIcons name="download" size={20} color={Colors.onPrimary} />
                      <Text style={styles.gateBtnText}>Download Sahayak</Text>
                    </Pressable>
                  </View>
                ) : (
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
                )
              ) : (
                messages.map((m) =>
                  m.role === 'user' ? (
                    // Plain View. A Reanimated entering animation here
                    // measures the bubble as it mounts, and a second one
                    // arriving re-ran that pass over the thread — which is
                    // what stretched the first answer and left the scroll
                    // position fighting the layout. It already broke this
                    // screen once, on the streaming bubble.
                    <View key={m.id} style={[styles.bubble, styles.bubbleUser]}>
                      <Text style={styles.userText}>{m.text}</Text>
                    </View>
                  ) : (
                    <View
                      key={m.id}
                      style={[styles.bubble, styles.bubbleAssistant]}
                    >
                      {m.text ? (
                        <MarkdownText text={m.text} color={Colors.onSurface} />
                      ) : (
                        <Loader size={28} />
                      )}
                    </View>
                  ),
                )
              )}
            </ScrollView>

            {/* What the model is doing, as a strip rather than a screen. */}
            {status !== 'loaded' ? (
              <View style={styles.modelBar}>
                {status === 'checking' || status === 'loading' ? (
                  <>
                    <Loader size={20} />
                    <Text style={styles.modelBarText}>
                      {status === 'checking'
                        ? 'Looking for the model on your phone'
                        : 'Reading the model into memory — once per app start'}
                    </Text>
                  </>
                ) : status === 'ready' ? (
                  <>
                    <MaterialIcons name="bolt" size={18} color={Colors.onSecondaryContainer} />
                    <Text style={styles.modelBarText}>Sahayak is on this phone and ready</Text>
                    <Pressable onPress={load} style={styles.modelBarBtn}>
                      <Text style={styles.modelBarBtnText}>Start</Text>
                    </Pressable>
                  </>
                ) : status === 'missing' ? (
                  <>
                    <MaterialIcons name="download" size={18} color={Colors.onSecondaryContainer} />
                    <Text style={styles.modelBarText}>Sahayak needs downloading once</Text>
                    <Pressable onPress={() => setShowDownload(true)} style={styles.modelBarBtn}>
                      <Text style={styles.modelBarBtnText}>Get it</Text>
                    </Pressable>
                  </>
                ) : status === 'unsupported' ? (
                  <Text style={styles.modelBarText}>{error ?? 'Sahayak runs on Android.'}</Text>
                ) : (
                  <>
                    <MaterialIcons name="error-outline" size={18} color={Colors.error} />
                    <Text style={styles.modelBarText} numberOfLines={2}>{error ?? 'Could not start.'}</Text>
                    <Pressable onPress={load} style={styles.modelBarBtn}>
                      <Text style={styles.modelBarBtnText}>Retry</Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : null}

            {showDownload ? (
              <View style={styles.downloadSheet}>
                <ModelDownloadCard
                  variant={variant}
                  onReady={(path) => {
                    setShowDownload(false);
                    onModelReady(path);
                  }}
                />
              </View>
            ) : null}

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
                editable={!needsModel}
                placeholder={needsModel ? 'Download Sahayak to ask it anything' : 'Ask Sahayak'}
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
                disabled={needsModel || (!draft.trim() && !streaming)}
                accessibilityLabel={streaming ? 'Stop' : 'Send'}
              >
                <MaterialIcons
                  name={streaming ? 'stop' : 'arrow-upward'}
                  size={22}
                  color={Colors.onPrimary}
                />
              </Pressable>
            </View>
      </View>
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

  // ── Sahayak is not on the phone yet ────────────────────────────────
  gate: {
    alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl,
  },
  gateIcon: {
    width: 64, height: 64, borderRadius: Shape.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
  },
  gateTitle: { ...TypeEmphasized.titleLarge, color: Colors.onSurface, textAlign: 'center' },
  gateBody: {
    ...Type.bodyMedium, color: Colors.onSurfaceVariant,
    textAlign: 'center', lineHeight: 20,
  },
  gateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderRadius: Shape.full, backgroundColor: Colors.primary,
    ...Elevation.level1,
  },
  gateBtnText: { ...TypeEmphasized.titleSmall, color: Colors.onPrimary },

  // ── The model's state, above the composer ──────────────────────────
  modelBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Shape.full, backgroundColor: Colors.secondaryContainer,
  },
  modelBarText: { ...Type.bodySmall, color: Colors.onSecondaryContainer, flex: 1 },
  modelBarBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Shape.full, backgroundColor: Colors.onSecondaryContainer,
  },
  modelBarBtnText: { ...TypeEmphasized.labelSmall, color: Colors.secondaryContainer },
  downloadSheet: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },


  thread: { padding: Spacing.lg, gap: Spacing.md },
  threadEmpty: { flexGrow: 1 },
  bubble: {
    maxWidth: '92%',
    padding: Spacing.md,
    borderRadius: Shape.extraLarge,
    // Sized by its own text, never by what the thread has room for.
    flexShrink: 0,
    flexGrow: 0,
  },
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

  iconBtnOff: { opacity: 0.38 },
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
});
