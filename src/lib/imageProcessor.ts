import { PresetRequirement, ProcessedImageResult } from '@/types/presets';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
  unit?: 'px' | '%';
}

export interface ProcessingOptions {
  crop?: CropArea;
  targetWidth: number;
  targetHeight: number;
  minKB: number;
  maxKB: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
  nameAndDate?: {
    enabled: boolean;
    name: string;
    date: string;
  };
  signatureFilter?: {
    enabled: boolean;
    grayscale: boolean;
    contrast: number; // 0 to 100, default 30
    brightness: number; // -50 to 50, default 10
    removeBackground: boolean; // brighten off-white background
  };
}

/**
 * Loads a File or Blob into an HTMLImageElement
 */
export function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Loads a data URL into an HTMLImageElement
 */
export function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Core Dynamic Canvas Compression Function
 * Takes image and options, crops to exact dimensions, applies overlays/filters,
 * and iteratively steps down JPEG/WEBP quality until file size is strictly <= maxKB.
 */
export async function processAndCompressImage(
  imageSource: HTMLImageElement,
  options: ProcessingOptions
): Promise<ProcessedImageResult> {
  const {
    crop,
    targetWidth,
    targetHeight,
    minKB,
    maxKB,
    format = 'image/jpeg',
    nameAndDate,
    signatureFilter,
  } = options;

  // 1. Create main offscreen canvas with target dimensions
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Fill white background first (crucial for JPEG without transparency)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. Calculate source crop bounds
  const naturalWidth = imageSource.naturalWidth || imageSource.width;
  const naturalHeight = imageSource.naturalHeight || imageSource.height;

  let sx = 0;
  let sy = 0;
  let sWidth = naturalWidth;
  let sHeight = naturalHeight;

  if (crop && crop.width > 0 && crop.height > 0) {
    if (crop.unit === '%') {
      sx = (crop.x / 100) * naturalWidth;
      sy = (crop.y / 100) * naturalHeight;
      sWidth = (crop.width / 100) * naturalWidth;
      sHeight = (crop.height / 100) * naturalHeight;
    } else {
      sx = crop.x;
      sy = crop.y;
      sWidth = crop.width;
      sHeight = crop.height;
    }
  } else {
    // If no crop provided, auto-center-crop to match target aspect ratio
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = naturalWidth / naturalHeight;

    if (sourceRatio > targetRatio) {
      // Source is wider than target
      sWidth = naturalHeight * targetRatio;
      sHeight = naturalHeight;
      sx = (naturalWidth - sWidth) / 2;
      sy = 0;
    } else {
      // Source is taller than target
      sWidth = naturalWidth;
      sHeight = naturalWidth / targetRatio;
      sx = 0;
      sy = (naturalHeight - sHeight) / 2;
    }
  }

  // Draw the cropped portion onto the canvas scaled to targetWidth and targetHeight
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageSource, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

  // 3. Apply signature enhancement filters if requested
  if (signatureFilter?.enabled) {
    applySignatureEnhancements(ctx, targetWidth, targetHeight, signatureFilter);
  }

  // 4. Draw Name & Date banner if enabled (e.g. UPSC OTR)
  if (nameAndDate?.enabled && (nameAndDate.name || nameAndDate.date)) {
    drawNameAndDateBanner(ctx, targetWidth, targetHeight, nameAndDate.name, nameAndDate.date);
  }

  // 5. Dynamic iterative Canvas compression
  const mimeType = format;
  let quality = 0.95;
  const step = 0.04;
  let iterations = 0;
  let bestBlob: Blob | null = null;
  let bestQuality = quality;

  // Helper to convert canvas to blob with specific quality
  const toBlobPromise = (q: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate canvas blob'));
        },
        mimeType,
        q
      );
    });
  };

  // Initial attempt at high quality
  bestBlob = await toBlobPromise(quality);
  iterations++;
  let currentSizeKB = bestBlob.size / 1024;

  // Iteratively step down quality if file size exceeds maxKB
  while (currentSizeKB > maxKB && quality > 0.05) {
    quality = Math.max(0.05, quality - step);
    const candidateBlob = await toBlobPromise(quality);
    iterations++;
    currentSizeKB = candidateBlob.size / 1024;
    bestBlob = candidateBlob;
    bestQuality = quality;
  }

  // If even at quality 0.05 the size exceeds maxKB (extremely rare),
  // adaptively scale canvas resolution by 5% until it strictly meets maxKB
  if (currentSizeKB > maxKB) {
    let scale = 0.95;
    while (currentSizeKB > maxKB && scale > 0.4) {
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.round(targetWidth * scale);
      scaledCanvas.height = Math.round(targetHeight * scale);
      const scaledCtx = scaledCanvas.getContext('2d');
      if (scaledCtx) {
        scaledCtx.fillStyle = '#FFFFFF';
        scaledCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
        scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

        const candidateBlob = await new Promise<Blob>((resolve) =>
          scaledCanvas.toBlob((b) => resolve(b!), mimeType, 0.5)
        );
        iterations++;
        currentSizeKB = candidateBlob.size / 1024;
        if (currentSizeKB <= maxKB) {
          bestBlob = candidateBlob;
          break;
        }
      }
      scale -= 0.05;
    }
  }

  // Check compliance
  const finalSizeKB = Math.round((bestBlob.size / 1024) * 10) / 10;
  const complianceIssues: string[] = [];

  if (finalSizeKB > maxKB) {
    complianceIssues.push(`File size (${finalSizeKB} KB) exceeds maximum allowed ${maxKB} KB`);
  }
  if (minKB > 0 && finalSizeKB < minKB) {
    complianceIssues.push(`File size (${finalSizeKB} KB) is below minimum required ${minKB} KB`);
  }

  const isCompliant = complianceIssues.length === 0;

  // Generate data URL for preview
  const dataUrl = await blobToDataUrl(bestBlob);

  return {
    blob: bestBlob,
    dataUrl,
    fileSizeBytes: bestBlob.size,
    fileSizeKB: finalSizeKB,
    width: targetWidth,
    height: targetHeight,
    quality: Math.round(bestQuality * 100) / 100,
    iterations,
    isCompliant,
    complianceIssues,
  };
}

/**
 * Draw candidate name and photo capture date at the bottom of the photo
 */
function drawNameAndDateBanner(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  name: string,
  date: string
) {
  const bannerHeight = Math.max(36, Math.round(height * 0.16));
  const bannerY = height - bannerHeight;

  // White background box
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, bannerY, width, bannerHeight);

  // Top border separator line
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, bannerY);
  ctx.lineTo(width, bannerY);
  ctx.stroke();

  // Text formatting
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = Math.max(10, Math.min(14, Math.round(bannerHeight * 0.28)));
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;

  if (name && date) {
    ctx.fillText(name.toUpperCase(), width / 2, bannerY + bannerHeight * 0.32);
    ctx.font = `500 ${Math.max(9, fontSize - 2)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(`D.O.P: ${date}`, width / 2, bannerY + bannerHeight * 0.72);
  } else if (name) {
    ctx.fillText(name.toUpperCase(), width / 2, bannerY + bannerHeight * 0.5);
  } else if (date) {
    ctx.fillText(`DATE: ${date}`, width / 2, bannerY + bannerHeight * 0.5);
  }
}

/**
 * Filters for signature to enhance contrast and remove murky/yellow phone camera paper background
 */
function applySignatureEnhancements(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: NonNullable<ProcessingOptions['signatureFilter']>
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const contrastFactor = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Grayscale conversion
    if (filters.grayscale) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // Brightness adjustment
    r += filters.brightness;
    g += filters.brightness;
    b += filters.brightness;

    // Contrast adjustment
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Background whitening (threshold off-white paper towards pure white 255)
    if (filters.removeBackground) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance > 185) {
        // Boost light background to pure white
        r = 255;
        g = 255;
        b = 255;
      } else if (luminance < 110) {
        // Darken actual ink for crisp signature
        r = Math.max(0, r - 30);
        g = Math.max(0, g - 30);
        b = Math.max(0, b - 30);
      }
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Convert Blob to Data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Triggers instant browser download of a Blob
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Creates high-quality demo/sample images for instant user testing
 */
export function createSamplePhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Gradient clean light blue/grey studio background
  const bg = ctx.createLinearGradient(0, 0, 0, 900);
  bg.addColorStop(0, '#e2e8f0');
  bg.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 700, 900);

  // Torso / Suit jacket
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(100, 900);
  ctx.quadraticCurveTo(350, 620, 600, 900);
  ctx.fill();

  // Shirt collar
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(270, 720);
  ctx.lineTo(350, 780);
  ctx.lineTo(430, 720);
  ctx.lineTo(350, 640);
  ctx.fill();

  // Tie
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(335, 720);
  ctx.lineTo(365, 720);
  ctx.lineTo(375, 880);
  ctx.lineTo(350, 900);
  ctx.lineTo(325, 880);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#e2a373';
  ctx.beginPath();
  ctx.rect(300, 520, 100, 140);
  ctx.fill();

  // Face oval
  ctx.fillStyle = '#f0b588';
  ctx.beginPath();
  ctx.ellipse(350, 420, 140, 180, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#1e1b18';
  ctx.beginPath();
  ctx.ellipse(350, 310, 150, 110, 0, 0, Math.PI);
  ctx.fill();

  // Eyebrows
  ctx.fillStyle = '#26211d';
  ctx.fillRect(260, 370, 55, 9);
  ctx.fillRect(385, 370, 55, 9);

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(288, 400, 18, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(412, 400, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#372b22';
  ctx.beginPath();
  ctx.arc(288, 400, 9, 0, Math.PI * 2);
  ctx.arc(412, 400, 9, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.strokeStyle = '#c9895c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(350, 410);
  ctx.lineTo(355, 455);
  ctx.lineTo(340, 465);
  ctx.stroke();

  // Gentle smile
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(350, 490, 40, 0.1 * Math.PI, 0.9 * Math.PI, false);
  ctx.stroke();

  // Professional watermark badge
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE PASSPORT PHOTO', 350, 850);

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Creates sample realistic signature
 */
export function createSampleSignature(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Crisp white paper
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 600, 240);

  // Realistic ink stroke
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw cursive signature flourish
  ctx.beginPath();
  ctx.moveTo(70, 140);
  ctx.bezierCurveTo(90, 40, 130, 40, 140, 140);
  ctx.bezierCurveTo(150, 180, 180, 180, 190, 120);
  ctx.bezierCurveTo(210, 80, 230, 160, 260, 130);
  ctx.bezierCurveTo(280, 100, 310, 150, 340, 125);
  ctx.bezierCurveTo(370, 90, 390, 170, 430, 110);
  ctx.bezierCurveTo(460, 70, 490, 150, 530, 120);
  // Underline flourish
  ctx.moveTo(110, 170);
  ctx.bezierCurveTo(250, 195, 420, 185, 520, 165);
  ctx.stroke();

  return canvas.toDataURL('image/jpeg', 0.95);
}

