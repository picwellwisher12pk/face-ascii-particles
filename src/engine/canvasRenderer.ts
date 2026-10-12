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

    const matrixChars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
    const now = performance.now() / 150;

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (pt.brightness < 20) continue;

      // Authentic pseudo-random glyph jitter based on time and location
      const charIdx = Math.floor(Math.abs(Math.sin(pt.x * 13 + pt.y * 7 + now)) * matrixChars.length);
      const char = matrixChars[charIdx] || '0';

      ctx.fillStyle = getColor(pt.r, pt.g, pt.b, pt.brightness);
      ctx.fillText(char, pt.x, pt.y);
    }
  }
}
