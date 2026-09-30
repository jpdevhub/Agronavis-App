import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  addTokenListener,
  cancelGeneration,
  generateText,
  isNativeGemmaModuleLinked,
  loadModel,
} from '@/modules/gemma-llm/src';
import { useAdvisories } from '@/hooks/useAdvisories';
import { useFarmFields } from '@/hooks/useFarmFields';
import { useFarmer } from '@/hooks/useFarmer';
import { useSoilHealth } from '@/hooks/useSoilHealth';
import { useWeather } from '@/hooks/useWeather';
import { useAuthStore } from '@/store/useAuthStore';
import { useFarmStore } from '@/store/useFarmStore';
import { useScreenContext } from './useScreenContext';
import { buildSahayakPrompt, contextSummary } from './farmerContext';
import {
  loadContextSnapshot,
  saveContextSnapshot,
  type CachedContext,
} from './contextCache';
import { detectModelVariant, probeModel, type ModelVariant } from './ondevice/modelFile';

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
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef('');

  const activeFarmId = useFarmStore((s) => s.activeFarmId);
  const { data: farmer } = useFarmer();
  const { data: fields } = useFarmFields();
  const { current: weather } = useWeather(activeFarmId);
  const { data: soil } = useSoilHealth();
  const { advisories } = useAdvisories();

  const { pathname } = useScreenContext();
  const userId = useAuthStore((s) => s.user?.id) ?? null;
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
    if (!isNativeGemmaModuleLinked()) {
      setStatus('unsupported');
      setError(
        'The on-device model is not part of this build. Expo Go cannot load it at all, '
        + 'and a release build needs modules/gemma-llm compiled in.',
      );
      return;
    }
    let cancelled = false;
    probeModel(variant).then((probe) => {
      if (cancelled) return;
      setModelPath(probe.complete ? probe.path : null);
      setStatus(probe.complete ? 'ready' : 'missing');
    });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  const load = useCallback(async () => {
    if (!modelPath) return;
    setStatus('loading');
    setError(null);
    try {
      await loadModel(modelPath);
      setStatus('loaded');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
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

      const subscription = addTokenListener((token: string, done: boolean) => {
        streamRef.current += token;
        const partial = streamRef.current;
        setMessages((prev) =>
          prev.map((m) => (m.id === replyId ? { ...m, text: partial } : m)),
        );
        if (done) setStreaming(false);
      });

      try {
        const full = await generateText(prompt);
        setMessages((prev) =>
          prev.map((m) => (m.id === replyId ? { ...m, text: full || streamRef.current } : m)),
        );
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, text: `Could not answer: ${(e as Error).message}` } : m,
          ),
        );
      } finally {
        subscription.remove();
        setStreaming(false);
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
