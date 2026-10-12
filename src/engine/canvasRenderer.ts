import type { Particle, VisualizerConfig } from '../types/visualizer';
import type { SampledPoint } from './pixelSampler';
import { AsciiRenderer } from './asciiRenderer';
import { resolveElementColor } from './colorUtils';

export class CanvasRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    points: SampledPoint[],
    particles: Particle[],
    config: VisualizerConfig
  ): void {
    // 1. Clear & Background Fill
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if (points.length === 0) {
      return;
    }

    const getColor = (r: number, g: number, b: number, brightness: number) =>
      resolveElementColor(r, g, b, brightness, config);

    switch (config.mode) {
      case 'ascii':
        AsciiRenderer.renderAsciiGrid(ctx, points, config, getColor);
        break;

      case 'particles':
        this.renderParticles(ctx, particles, config, getColor);
        break;

      case 'ascii-particles':
        this.renderAsciiParticles(ctx, particles, config, getColor);
        break;

      case 'halftone':
        this.renderHalftone(ctx, points, config, getColor);
        break;

      case 'matrix-rain':
        this.renderMatrixStyle(ctx, points, config, getColor);
        break;

      default:
        this.renderParticles(ctx, particles, config, getColor);
        break;
    }
  }

  private static renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    config: VisualizerConfig,
    getColor: (r: number, g: number, b: number, brightness: number) => string
  ): void {
    // Optional constellation connections
    if (config.connectLines && config.connectDistance > 0) {
      const maxDistSq = config.connectDistance * config.connectDistance;
      const count = Math.min(particles.length, 1200); // safety cap for O(n^2) links
      ctx.lineWidth = 0.5;

      for (let i = 0; i < count; i += 2) {
        const p1 = particles[i];
        for (let j = i + 1; j < count; j += 2) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const alpha = (1 - Math.sqrt(distSq) / config.connectDistance) * 0.25;
            ctx.strokeStyle = `rgba(0, 255, 204, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    }

    const shape = config.particleShape;
    const isGlow = shape === 'glow';

    if (isGlow) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = config.colorMode === 'custom' ? config.customColor : 'rgba(0, 255, 204, 0.7)';
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = getColor(p.r, p.g, p.b, p.brightness);

      if (shape === 'square') {
        const size = p.radius * 2;
        ctx.fillRect(p.x - p.radius, p.y - p.radius, size, size);
      } else if (shape === 'ring') {
        ctx.strokeStyle = getColor(p.r, p.g, p.b, p.brightness);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Circle / Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, p.radius), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
  }

  private static renderAsciiParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    config: VisualizerConfig,
    getColor: (r: number, g: number, b: number, brightness: number) => string
  ): void {
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (config.charGlow) {
      ctx.shadowBlur = 6;
      ctx.shadowColor = config.colorMode === 'custom' ? config.customColor : 'rgba(0, 255, 204, 0.5)';
    }

    const charset = config.asciiCharset;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const char = AsciiRenderer.getCharForBrightness(p.brightness, charset);
      if (char === ' ') continue;

      ctx.fillStyle = getColor(p.r, p.g, p.b, p.brightness);
      ctx.fillText(char, p.x, p.y);
    }

    ctx.shadowBlur = 0;
  }

  private static renderHalftone(
    ctx: CanvasRenderingContext2D,
    points: SampledPoint[],
    config: VisualizerConfig,
    getColor: (r: number, g: number, b: number, brightness: number) => string
  ): void {
    const baseMax = (config.samplingDensity / 2) * 1.3 * (config.halftoneScale || 1.2);
    const shape = config.halftoneDotShape || 'circle';
    const angleRad = ((config.halftoneAngle || 0) * Math.PI) / 180;

    const sizeVar = config.sizeVariation !== undefined ? config.sizeVariation : 1.8;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const normB = pt.brightness / 255;
      const dynamicScale = Math.pow(normB, Math.max(0.4, 2.2 - sizeVar * 0.5));
      const radius = dynamicScale * baseMax;
      if (radius < 0.4) continue;

      ctx.fillStyle = getColor(pt.r, pt.g, pt.b, pt.brightness);

      ctx.save();
      ctx.translate(pt.x, pt.y);
      if (angleRad !== 0) {
        ctx.rotate(angleRad);
      }

      if (shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.2);
        ctx.lineTo(radius * 1.2, 0);
        ctx.lineTo(0, radius * 1.2);
        ctx.lineTo(-radius * 1.2, 0);
        ctx.closePath();
        ctx.fill();
      } else if (shape === 'line') {
        const lineH = Math.max(1, radius * 0.85);
        ctx.fillRect(-config.samplingDensity / 2, -lineH / 2, config.samplingDensity, lineH);
      } else if (shape === 'square') {
        const side = radius * 2;
        ctx.fillRect(-radius, -radius, side, side);
      } else if (shape === 'ring') {
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1, radius), 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, radius * 0.45);
        ctx.strokeStyle = getColor(pt.r, pt.g, pt.b, pt.brightness);
        ctx.stroke();
      } else {
        // Circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private static renderMatrixStyle(
    ctx: CanvasRenderingContext2D,
    points: SampledPoint[],
    config: VisualizerConfig,
    getColor: (r: number, g: number, b: number, brightness: number) => string
  ): void {
    ctx.font = `bold ${config.fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const matrixChars = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789:・."=*+-<>';
    const nowSec = performance.now() / 1000.0;
    const step = Math.max(3, config.samplingDensity);

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const faceLum = pt.brightness / 255.0;

      // Determine discrete column and row
      const col = Math.floor(pt.x / step);
      const row = Math.floor(pt.y / step);

      // Pseudo-random speed, phase offset, and trail length per column
      const speedHash = Math.abs(Math.sin(col * 17.382 + 5.12));
      const offsetHash = Math.abs(Math.sin(col * 93.123 + 12.98));
      const trailHash = Math.abs(Math.sin(col * 41.517 + 8.76));

      const dropSpeed = 12.0 + speedHash * 22.0;       // 12 to 34 rows per second
      const trailLength = 8.0 + trailHash * 18.0;      // 8 to 26 characters trail
      const loopSpan = 60.0 + trailLength + 10.0;

      const dropHead = (nowSec * dropSpeed + offsetHash * loopSpan) % loopSpan;
      const distBehind = dropHead - (row % 60.0);

      let isHead = false;
      let rainIntensity = 0.0;

      if (distBehind >= 0.0 && distBehind < 1.0) {
        isHead = true;
        rainIntensity = 1.0;
      } else if (distBehind >= 1.0 && distBehind < trailLength) {
        const trailProgress = (distBehind - 1.0) / (trailLength - 1.0);
        rainIntensity = Math.pow(1.0 - trailProgress, 1.55);
      }

      // Visibility blends rain drops with authentic facial contours
      const totalVisibility = Math.max(rainIntensity, faceLum * 0.88);
      if (totalVisibility < 0.08) continue;

      // Authentic glyph cycling as rain cascades
      const glyphChangeRate = Math.floor(nowSec * 9.0 + (col * 31.7) % 50.0);
      const charIdx = Math.floor(Math.abs(glyphChangeRate + row * 3.0 + col * 7.0)) % matrixChars.length;
      const char = matrixChars[charIdx] || '0';

      if (isHead) {
        // Glowing white tip
        ctx.fillStyle = `rgba(240, 255, 245, ${Math.min(1.0, totalVisibility * 1.2)})`;
      } else {
        // Authentic matrix green palette (#00ff66 fading to deep dark green)
        const gVal = Math.floor(65 + rainIntensity * 190);
        const rVal = faceLum > 0.4 ? Math.floor((faceLum - 0.4) * 160) : 0;
        const bVal = faceLum > 0.4 ? Math.floor((faceLum - 0.4) * 180) : Math.floor(rainIntensity * 40);
        const alpha = Math.min(1.0, Math.max(0.2, totalVisibility * 1.15));

        if (config.colorMode === 'source') {
          ctx.fillStyle = `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`;
        } else {
          ctx.fillStyle = getColor(pt.r, pt.g, pt.b, pt.brightness);
        }
      }

      ctx.fillText(char, pt.x, pt.y);
    }
  }
}

