import type { VisualizerConfig } from '../types/visualizer';
import type { SampledPoint } from './pixelSampler';

export class AsciiRenderer {
  public static getCharForBrightness(brightness: number, charset: string): string {
    if (!charset || charset.length === 0) return ' ';
    const normalized = Math.min(1, Math.max(0, brightness / 255));
    // Index from bright to dark or dark to bright: standard is index 0 = densest/brightest
    const index = Math.floor(normalized * (charset.length - 1));
    return charset[index] || ' ';
  }

  /**
   * Generates a raw text representation of the face for copying or file export.
   */
  public static generateAsciiText(
    points: SampledPoint[],
    targetWidth: number,
    step: number,
    charset: string
  ): string {
    if (points.length === 0) return '';
    const cols = Math.floor(targetWidth / step);
    const grid: string[][] = [];

    for (const pt of points) {
      const col = Math.floor(pt.x / step);
      const row = Math.floor(pt.y / step);
      if (!grid[row]) grid[row] = [];
      grid[row][col] = this.getCharForBrightness(pt.brightness, charset);
    }

    const lines: string[] = [];
    for (let r = 0; r < grid.length; r++) {
      const rowArr = grid[r] || [];
      let line = '';
      for (let c = 0; c < cols; c++) {
        line += rowArr[c] || ' ';
      }
      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Draws ASCII grid directly to canvas context.
   */
  public static renderAsciiGrid(
    ctx: CanvasRenderingContext2D,
    points: SampledPoint[],
    config: VisualizerConfig,
    resolveColor: (r: number, g: number, b: number, brightness: number) => string
  ): void {
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (config.charGlow) {
      ctx.shadowBlur = 6;
      ctx.shadowColor = config.colorMode === 'custom' ? config.customColor : 'rgba(0, 255, 204, 0.6)';
    } else {
      ctx.shadowBlur = 0;
    }

    const charset = config.asciiCharset;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const char = this.getCharForBrightness(pt.brightness, charset);
      if (char === ' ') continue;

      ctx.fillStyle = resolveColor(pt.r, pt.g, pt.b, pt.brightness);
      ctx.fillText(char, pt.x, pt.y);
    }

    ctx.shadowBlur = 0;
  }
}
