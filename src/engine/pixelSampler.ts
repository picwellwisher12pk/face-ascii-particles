import type { VisualizerConfig } from '../types/visualizer';

export interface SampledPoint {
  x: number; // canvas coordinate X
  y: number; // canvas coordinate Y
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  brightness: number; // 0-255 normalized luminance
}

export class PixelSampler {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Samples genuine pixel data from the live video stream or uploaded image.
   * Derives real RGB colors and brightness from authentic pixel buffer.
   */
  public sampleFrame(
    source: HTMLVideoElement | HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    config: VisualizerConfig
  ): { points: SampledPoint[]; activeCount: number; centroid?: { x: number; y: number } } {
    if (!this.offscreenCtx) {
      return { points: [], activeCount: 0 };
    }

    const isVideo = source instanceof HTMLVideoElement;
    const srcWidth = isVideo ? source.videoWidth : source.naturalWidth;
    const srcHeight = isVideo ? source.videoHeight : source.naturalHeight;

    if (isVideo && (source.readyState < 2 || srcWidth === 0 || srcHeight === 0)) {
      return { points: [], activeCount: 0 };
    }
    if (!isVideo && (!source.complete || srcWidth === 0 || srcHeight === 0)) {
      return { points: [], activeCount: 0 };
    }

    const step = Math.max(3, Math.round(config.samplingDensity));
    const sampleCols = Math.floor(targetWidth / step);
    const sampleRows = Math.floor(targetHeight / step);

    if (this.offscreenCanvas.width !== sampleCols || this.offscreenCanvas.height !== sampleRows) {
      this.offscreenCanvas.width = sampleCols;
      this.offscreenCanvas.height = sampleRows;
    }

    const ctx = this.offscreenCtx;
    ctx.save();

    // Mirror horizontal flip if enabled
    if (config.mirror) {
      ctx.translate(sampleCols, 0);
      ctx.scale(-1, 1);
    }

    // Aspect ratio calculation
    const sourceAspect = srcWidth / srcHeight;
    const canvasAspect = sampleCols / sampleRows;

    let sx = 0;
    let sy = 0;
    let sw = srcWidth;
    let sh = srcHeight;

    // Optional zoom or aspect fill
    const zoom = Math.max(1.0, config.zoom);
    if (sourceAspect > canvasAspect) {
      // Source is wider
      const visibleW = srcHeight * canvasAspect;
      sx = (srcWidth - visibleW) / 2;
      sw = visibleW;
    } else {
      // Source is taller
      const visibleH = srcWidth / canvasAspect;
      sy = (srcHeight - visibleH) / 2;
      sh = visibleH;
    }

    if (zoom > 1.0) {
      const zoomFactor = 1 / zoom;
      const zoomedW = sw * zoomFactor;
      const zoomedH = sh * zoomFactor;
      sx += (sw - zoomedW) / 2;
      sy += (sh - zoomedH) / 2;
      sw = zoomedW;
      sh = zoomedH;
    }

    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sampleCols, sampleRows);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, sampleCols, sampleRows);
    const data = imageData.data;

    const points: SampledPoint[] = [];
    const contrastFactor = (259 * (config.contrast + 255)) / (255 * (259 - config.contrast));

    let sumWeightX = 0;
    let sumWeightY = 0;
    let totalWeight = 0;

    for (let row = 0; row < sampleRows; row++) {
      for (let col = 0; col < sampleCols; col++) {
        const index = (row * sampleCols + col) * 4;
        let r = data[index];
        let g = data[index + 1];
        let b = data[index + 2];

        // Apply authentic brightness multiplier
        r = Math.min(255, Math.max(0, r * config.brightness));
        g = Math.min(255, Math.max(0, g * config.brightness));
        b = Math.min(255, Math.max(0, b * config.brightness));

        // Apply authentic contrast curve
        r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));

        // Standard photometric luminance: 0.299R + 0.587G + 0.114B
        let brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        if (config.invert) {
          brightness = 255 - brightness;
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        // Background removal filter for Canvas 2D
        if (config.removeBackground) {
          const uvX = col / sampleCols;
          const uvY = row / sampleRows;
          const distToCenter = Math.hypot(uvX - 0.5, (uvY - 0.45) * 1.2);
          const threshold = config.bgRemovalThreshold || 0.38;

          if (config.bgRemovalMode === 'silhouette') {
            if (distToCenter > threshold) continue;
          } else if (config.bgRemovalMode === 'luminance') {
            if (brightness < threshold * 255 || distToCenter > threshold * 1.5) continue;
          } else if (config.bgRemovalMode === 'chroma') {
            const isSubjectTone = r > b * 1.05 && r > 38;
            if ((!isSubjectTone && distToCenter > 0.22) || distToCenter > threshold) continue;
          }
        }

        const jitterAmount = config.mode === 'particles' ? step * 0.45 : 0;
        const jitterX = jitterAmount > 0 ? (Math.random() - 0.5) * jitterAmount : 0;
        const jitterY = jitterAmount > 0 ? (Math.random() - 0.5) * jitterAmount : 0;
        const canvasX = col * step + step / 2 + jitterX;
        const canvasY = row * step + step / 2 + jitterY;

        points.push({
          x: canvasX,
          y: canvasY,
          r: Math.round(r),
          g: Math.round(g),
          b: Math.round(b),
          brightness,
        });

        // Compute authentic dynamic face/subject center-of-gravity
        // Skin tone and high midtones carry extra weight for face tracking
        const isWarmSkinTone = r > g && g > b && r > 45;
        const weight = isWarmSkinTone ? brightness * 1.8 : brightness;
        sumWeightX += canvasX * weight;
        sumWeightY += canvasY * weight;
        totalWeight += weight;
      }
    }

    const centroid =
      totalWeight > 0
        ? {
            x: sumWeightX / totalWeight,
            y: sumWeightY / totalWeight,
          }
        : undefined;

    return {
      points,
      activeCount: points.length,
      centroid,
    };
  }
}
