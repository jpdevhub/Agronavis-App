import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import {
  addTokenListener,
  cancelGeneration,
  generateText,
  isNativeGemmaModuleLinked,
  isModelLoaded,
  loadModel,
} from '@/modules/gemma-llm/src';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useFarmStore } from '@/store/useFarmStore';
import { useScreenContext } from './useScreenContext';
import { clearThread, loadThread, saveThread } from './chatHistory';
import { buildSahayakPrompt, contextSummary } from './farmerContext';
import {
  loadContextSnapshot,
  saveContextSnapshot,
  type CachedContext,
} from './contextCache';
import { deleteModel, detectModelVariant, probeModel, type ModelVariant } from './ondevice/modelFile';

export type SahayakMessage = { id: string; role: 'user' | 'assistant'; text: string };

export type ModelStatus =
  | 'unsupported'
  | 'checking'
  | 'missing'
  | 'ready'
  | 'loading'
  | 'loaded'
  | 'error';

/** Gemma runs through a native Android module; everywhere else is unsupported. */
const SUPPORTED = Platform.OS === 'android';

export function useSahayak() {
  const variant: ModelVariant = useMemo(() => detectModelVariant(), []);
  const [status, setStatus] = useState<ModelStatus>(SUPPORTED ? 'checking' : 'unsupported');
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState<string | null>(null);
  const [messages, setMessages] = useState<SahayakMessage[]>([]);

  // Bring back this afternoon's conversation, if there is one.
  useEffect(() => {
    let cancelled = false;
    loadThread().then((saved) => {
      if (!cancelled && saved.length > 0) setMessages(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [streaming, setStreaming] = useState(false);
  // Written as it changes, but never mid-answer: a half-streamed reply
  // restored later would read as the model having stopped in the middle.
  useEffect(() => {
    if (streaming) return;
    if (messages.length === 0) return;
    saveThread(messages);
  }, [messages, streaming]);
  const streamRef = useRef('');

  const activeFarmId = useFarmStore((s) => s.activeFarmId);
  const activeFieldId = useFarmStore((s) => s.activeFieldId);
  const userId = useAuthStore((s) => s.user?.id) ?? null;
  const userIdForCache = userId ?? undefined;
  /**
   * The farm details, read from what the app already has — never fetched.
   *
   * These used to come from the five data hooks, which meant opening Sahayak
   * fired five requests before the screen could settle. On a cold free-tier
   * instance that is half a minute of nothing, and the screen a farmer was
   * waiting on is the one that needs no network at all: the model runs on
   * their phone.
   *
   * So the cache is read directly. Whatever the dashboard loaded is here
   * already; whatever it did not, the stored snapshot below usually covers;
   * and failing both, Sahayak opens and answers without the farm details
   * rather than making someone wait for them.
   */
  const queryClient = useQueryClient();
  const cached = useMemo(() => {
    const read = <T,>(key: unknown[]): T | undefined => queryClient.getQueryData<T>(key);

    const weatherBundle = activeFieldId
      ? read<{ data?: { current?: unknown } }>(['weather', 'field', activeFieldId])
      : read<{ data?: { current?: unknown } }>(['weather', 'farm', activeFarmId]);

    return {
      farmer: read<CachedContext['farmer']>(['farmer', userIdForCache]),
      fields: read<CachedContext['fields']>(['fields', userIdForCache]),
      weather: (weatherBundle?.data?.current ?? undefined) as CachedContext['weather'],
      soil: read<CachedContext['soil']>(['soil', activeFieldId]),
      advisories: read<CachedContext['advisories']>(['advisories', activeFarmId]),
    };
    // Re-read when the farmer switches field or farm; the cache itself is not
    // reactive here, which is the point — this must never trigger a fetch.
  }, [queryClient, activeFieldId, activeFarmId, userIdForCache]);

  const farmer = cached.farmer;
  const fields = cached.fields;
  const weather = cached.weather;
  const soil = cached.soil;
  const advisories = cached.advisories ?? [];

  const { pathname } = useScreenContext();
  const [snapshot, setSnapshot] = useState<{ context: CachedContext; savedAt: string } | null>(null);

  // Restore the last synced farm details once, for a cold start with no signal.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadContextSnapshot(userId).then((found) => {
      if (!cancelled && found) setSnapshot(found);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const live = useMemo<CachedContext>(
    () => ({ farmer, fields, weather, soil: soil ?? undefined, advisories }),
    [farmer, fields, weather, soil, advisories],
  );

  // Keep the snapshot current while the farm details are readable.
  useEffect(() => {
    if (!userId || !farmer) return;
    void saveContextSnapshot(userId, live);
  }, [userId, farmer, live]);

  /**
   * Live details win. The snapshot only stands in when the profile has not
   * loaded — offline, or before the first fetch lands.
   */
  const usingSnapshot = !farmer && snapshot !== null;
  const context = useMemo(
    () => ({
      ...(usingSnapshot ? (snapshot as { context: CachedContext }).context : live),
      pathname,
      ...(usingSnapshot ? { dataSavedAt: snapshot?.savedAt } : {}),
    }),
    [usingSnapshot, snapshot, live, pathname],
  );
  const replyLanguage = language ?? context.farmer?.language ?? 'en';
  const systemPrompt = useMemo(
    () => buildSahayakPrompt({ ...context, replyLanguage }),
    [context, replyLanguage],
  );
  const summary = useMemo(() => contextSummary(context), [context]);

  useEffect(() => {
    if (!SUPPORTED) return;

    // Both of these reach native code. A throw here escapes the effect and
    // becomes a blank screen with no message — the screen is meant to open
    // instantly and say what it found, including "nothing".
    let linked: boolean;
    try {
      linked = isNativeGemmaModuleLinked();
    } catch {
      linked = false;
    }

    if (!linked) {
      setStatus('unsupported');
      setError(
        'The on-device model is not part of this build. Expo Go cannot load it at all, '
        + 'and a release build needs modules/gemma-llm compiled in.',
      );
      return;
    }

    let cancelled = false;
    probeModel(variant)
      .then((probe) => {
        if (cancelled) return;
        setModelPath(probe.complete ? probe.path : null);

        // The engine outlives this screen. If it is still holding the model,
        // go straight to the chat — asking someone to press "Start" so it can
        // reload several gigabytes it already has is the whole of the wait
        // they were complaining about.
        if (probe.complete && isModelLoaded()) {
          setStatus('loaded');
          return;
        }

        setStatus(probe.complete ? 'ready' : 'missing');
      })
      .catch(() => {
        // Unreadable storage is not a reason to spin forever. Treat it as a
        // model that is not there, which offers the download.
        if (!cancelled) setStatus('missing');
      });

    return () => {
      cancelled = true;
    };
  }, [variant]);

  /**
   * Notice when Android has taken the model back.
   *
   * It releases the engine under memory pressure, which is the whole point of
   * letting it — but the screen would still believe a model was loaded and
   * fail on the next question with something unhelpful. Re-checking as the app
   * returns to the foreground puts it back on "Ready to start" instead.
   */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      setStatus((current) => (current === 'loaded' && !isModelLoaded() ? 'ready' : current));
    });
    return () => sub.remove();
  }, []);

  const load = useCallback(async () => {
    if (!modelPath) return;
    setStatus('loading');
    setError(null);
    try {
      await loadModel(modelPath);
      setStatus('loaded');
    } catch (e) {
      const message = (e as Error).message ?? '';

      /**
       * A file the runtime cannot read is a file worth discarding.
       *
       * The usual cause is a download that stopped early and was recorded as
       * finished — the engine then reports a missing signature, which reads
       * like an incompatible model rather than half of one. Keeping the file
       * means every "try again" fails the same way forever, so it goes, and
       * the screen offers the download instead of a dead end.
       */
      const unreadable = /NOT_FOUND|not found in the model|INVALID_ARGUMENT|corrupt/i.test(message);
      if (unreadable) {
        await deleteModel(variant).catch(() => {
          // If it cannot be removed the download will overwrite it anyway.
        });
        setModelPath(null);
        setStatus('missing');
        setError(
          'That download did not finish properly, so the model could not start. '
          + 'Downloading it again should fix it.',
        );
        return;
      }

      setStatus('error');
      setError(message);
    }
  }, [modelPath]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || streaming) return;

      const userMessage: SahayakMessage = { id: `u${Date.now()}`, role: 'user', text: question };
      const replyId = `a${Date.now()}`;
      setMessages((prev) => [...prev, userMessage, { id: replyId, role: 'assistant', text: '' }]);
      setStreaming(true);
      streamRef.current = '';

      const history = messages
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'Farmer' : 'Sahayak'}: ${m.text}`)
        .join('\n');

      const prompt = [systemPrompt, '', history, `Farmer: ${question}`, 'Sahayak:']
        .filter(Boolean)
        .join('\n');

      /**
       * The answer is finished when the tokens stop, not when the native call
       * returns.
       *
       * LiteRT's flow can stay open after the model has said everything it is
       * going to say, and the native side only reports `done` once that flow
       * closes — which it did by hitting its own sixty-second timeout. The
       * answer was fully on screen while the composer stayed locked and a
       * second question was silently dropped.
       *
       * Going quiet for this long after at least one token has arrived is the
       * reliable end-of-turn signal.
       */
      const QUIET_MS = 2_500;
      let settled = false;
      let idle: ReturnType<typeof setTimeout> | undefined;

      /**
       * Tokens arrive far faster than a screen can usefully redraw.
       *
       * Each one used to call setMessages, so a model emitting twenty or
       * thirty a second produced twenty or thirty full React renders a
       * second — each mapping the whole thread and re-parsing the answer's
       * markdown. That starves the JavaScript thread: the screen stops
       * painting and goes blank, and only comes back when switching to
       * another app and returning forces a repaint. It reads as a crash and
       * is not one.
       *
       * The text still accumulates on every token. Only the redraw is paced,
       * at about twelve frames a second, which is faster than anyone reads.
       */
      const PAINT_MS = 80;
      let painted = 0;
      let paintTimer: ReturnType<typeof setTimeout> | null = null;

      const paint = () => {
        paintTimer = null;
        painted = streamRef.current.length;
        const partial = streamRef.current;
        setMessages((prev) =>
          prev.map((m) => (m.id === replyId ? { ...m, text: partial } : m)),
        );
      };

      const schedulePaint = () => {
        if (paintTimer) return;
        paintTimer = setTimeout(paint, PAINT_MS);
      };

      const paintNow = () => {
        if (paintTimer) {
          clearTimeout(paintTimer);
          paintTimer = null;
        }
        if (streamRef.current.length !== painted) paint();
      };

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(idle);
        // A pending redraw after the turn has settled would repaint a
        // message that is already final.
        if (paintTimer) {
          clearTimeout(paintTimer);
          paintTimer = null;
        }
        subscription.remove();
        setStreaming(false);
      };

      const nudge = () => {
        clearTimeout(idle);
        idle = setTimeout(finish, QUIET_MS);
      };

      const subscription = addTokenListener((token: string, done: boolean) => {
        if (settled) return;
        streamRef.current += token;

        if (done) {
          paintNow();
          finish();
          return;
        }

        schedulePaint();
        if (streamRef.current.length > 0) nudge();
      });

      try {
        const full = await generateText(prompt);
        // Whatever is still buffered belongs on screen before the final text.
        paintNow();
        // A late return must not overwrite an answer the farmer is reading, nor
        // revive a turn that has already been settled.
        if (full && full.length >= streamRef.current.length) {
          setMessages((prev) =>
            prev.map((m) => (m.id === replyId ? { ...m, text: full } : m)),
          );
        }
      } catch (e) {
        if (!settled) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyId ? { ...m, text: `Could not answer: ${(e as Error).message}` } : m,
            ),
          );
        }
      } finally {
        finish();
      }
    },
    [messages, streaming, systemPrompt],
  );

  const stop = useCallback(() => {
    cancelGeneration();
    setStreaming(false);
  }, []);

  return {
    language: replyLanguage,
    setLanguage,
    variant,
    status,
    /** Starts a new conversation and forgets the stored one. */
    reset: () => {
      setMessages([]);
      clearThread();
    },
    error,
    modelPath,
    messages,
    streaming,
    summary,
    send,
    stop,
    load,
    onModelReady: (path: string) => {
      setModelPath(path);
      setStatus('ready');
    },
  };
}
