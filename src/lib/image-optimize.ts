/**
 * Automatická optimalizace fotek před nahráním (v prohlížeči).
 *
 * Fotka z mobilu má klidně 4000 × 3000 px a 5–10 MB. Na stránce portfolia stačí ~1920 px na delší
 * straně, takže ji zmenšíme a uložíme jako JPEG. Výsledek bývá 200–600 kB, stránky se načítají
 * rychle a místo na serveru vydrží. GIF (animace) a SVG necháváme, jak jsou; malé PNG také
 * (mohou mít průhlednost, např. kresby nebo snímky obrazovky).
 */

export interface OptimizeOptions {
  /** Longest side in pixels */
  maxPx?: number;
  /** Target size; quality steps down until the file fits (or quality hits the floor) */
  maxBytes?: number;
}

const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']);
const SMALL_PNG_BYTES = 400_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/**
 * Returns a smaller JPEG version of `file`, or the original when it is not a photo we can
 * improve (GIF, SVG, small PNG, undecodable formats) or when the result would not be smaller.
 * Browsers apply the photo's EXIF rotation when drawing, so portrait phone photos stay upright.
 */
export async function optimizeImage(file: File, { maxPx = 1920, maxBytes = 900_000 }: OptimizeOptions = {}): Promise<File> {
  if (!file.type.startsWith('image/') || SKIP_TYPES.has(file.type)) return file;
  if (file.type === 'image/png' && file.size <= SMALL_PNG_BYTES) return file;

  let img: HTMLImageElement;
  try { img = await loadImage(file); } catch { return file; } // e.g. HEIC outside Safari — upload as is

  const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#ffffff'; // JPEG has no transparency — paint PNG holes white instead of black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = 0.85;
  let blob = await toBlob(canvas, quality);
  while (blob && blob.size > maxBytes && quality > 0.55) {
    quality = Math.round((quality - 0.1) * 100) / 100;
    blob = await toBlob(canvas, quality);
  }
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: file.lastModified });
}

/** Optimizes images and passes other files through untouched. */
export function optimizeIfImage(file: File, options?: OptimizeOptions): Promise<File> {
  return file.type.startsWith('image/') ? optimizeImage(file, options) : Promise.resolve(file);
}
