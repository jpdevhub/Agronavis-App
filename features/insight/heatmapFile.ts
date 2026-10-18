import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Turns the heatmap the API sent into something a map can actually load.
 *
 * The PNG arrives inline as a base64 `data:` URI, which is how it gets past
 * the fact that a map's image loader carries none of our auth headers. But
 * Mapbox's native ImageSource takes an HTTP or a file URL — a data URI is not
 * in its contract, and handing it one fails at the native layer where no
 * JavaScript catch can help.
 *
 * So the bytes are written once to the cache directory and the file URL is
 * handed over instead. The authentication property is unchanged: the image
 * still arrived inside a response the app had to be signed in to receive.
 *
 * Returns null until the file exists, and on any failure — the overlay is
 * worth having and never worth crashing for.
 */
export function useHeatmapFile(dataUri: string | null, key: string | null): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!dataUri || !key) {
      setUri(null);
      return;
    }

    const comma = dataUri.indexOf(',');
    if (!dataUri.startsWith('data:image/png;base64,') || comma < 0) {
      setUri(null);
      return;
    }

    // Named for the reading it belongs to, so a new pass replaces the old one
    // rather than accumulating a file per render.
    const path = `${FileSystem.cacheDirectory}ndvi-${key.replace(/[^\w.-]/g, '')}.png`;

    (async () => {
      try {
        await FileSystem.writeAsStringAsync(path, dataUri.slice(comma + 1), {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!cancelled) setUri(path);
      } catch {
        // No overlay this time; the reading and the trend still show.
        if (!cancelled) setUri(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataUri, key]);

  return uri;
}
