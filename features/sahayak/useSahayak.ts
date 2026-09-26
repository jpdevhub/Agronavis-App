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
import { useFarmStore } from '@/store/useFarmStore';
import { useScreenContext } from './useScreenContext';
import { buildSahayakPrompt, contextSummary } from './farmerContext';
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
  const context = useMemo(
    () => ({ farmer, fields, weather, soil: soil ?? undefined, advisories, pathname }),
    [farmer, fields, weather, soil, advisories, pathname],
  );
  const systemPrompt = useMemo(() => buildSahayakPrompt(context), [context]);
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
