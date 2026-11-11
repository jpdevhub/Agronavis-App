/**
 * The photograph is sent to the server, often over a weak mobile signal. A
 * phone camera's full 12–50 megapixels is several megabytes the model throws
 * away — it reads 224 pixels — so the camera is asked for the smallest picture
 * that still holds a leaf's detail.
 */
const MIN_PICTURE_SIDE = 720;

export function pickPictureSize(sizes: string[]): string | undefined {
  const parsed = sizes
    .map((s) => {
      const m = /^(\d+)x(\d+)$/.exec(s.trim());
      return m ? { s, w: Number(m[1]), h: Number(m[2]) } : null;
    })
    .filter((x): x is { s: string; w: number; h: number } => x !== null && Math.min(x.w, x.h) >= MIN_PICTURE_SIDE)
    .sort((a, b) => a.w * a.h - b.w * b.h);
  return parsed[0]?.s;
}
