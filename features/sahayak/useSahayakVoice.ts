import { useCallback, useEffect, useState } from 'react';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

/** BCP-47 tags the device TTS and recogniser understand. */
const LOCALE: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  pa: 'pa-IN',
  gu: 'gu-IN',
  te: 'te-IN',
  kn: 'kn-IN',
};

export const localeFor = (language: string): string => LOCALE[language] ?? 'en-IN';

/**
 * Speech in and out, both on-device.
 *
 * Markdown is stripped before speaking — a model that writes "**Weather:**"
 * otherwise has the asterisks read aloud.
 */
export function useSahayakVoice(language: string) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [heard, setHeard] = useState('');
  const [error, setError] = useState<string | null>(null);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    setHeard(event.results[0]?.transcript ?? '');
  });
  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message ?? 'Could not hear that');
    setListening(false);
  });

  useEffect(() => () => {
    Speech.stop();
    ExpoSpeechRecognitionModule.abort();
  }, []);

  const listen = useCallback(async () => {
    setError(null);
    setHeard('');
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone permission is needed to speak to Sahayak.');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: localeFor(language),
      interimResults: true,
      continuous: false,
    });
  }, [language]);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const speak = useCallback(
    (text: string) => {
      const plain = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[*_`#]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!plain) return;
      Speech.stop();
      setSpeaking(true);
      Speech.speak(plain, {
        language: localeFor(language),
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    },
    [language],
  );

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  return {
    listening, speaking, heard, error,
    listen, stopListening, speak, stopSpeaking,
    clearHeard: () => setHeard(''),
  };
}
