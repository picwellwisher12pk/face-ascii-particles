import type { VisualizerConfig } from '../types/visualizer';
import { COLOR_THEMES } from '../config/constants';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) {
    return { r: 0, g: 255, b: 204 }; // safe fallback
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function resolveElementColor(
  r: number,
  g: number,
  b: number,
  brightness: number,
  config: VisualizerConfig
): string {
  if (config.colorMode === 'source') {
    return `rgb(${r}, ${g}, ${b})`;
  }

  if (config.colorMode === 'custom') {
    return config.customColor;
  }

  if (config.colorMode === 'theme') {
    const theme = COLOR_THEMES.find((t) => t.id === config.selectedThemeId) || COLOR_THEMES[0];
    const pRgb = hexToRgb(theme.primary);
    const sRgb = theme.secondary ? hexToRgb(theme.secondary) : pRgb;

    // Interpolate primary and secondary based on normalized brightness
    const factor = Math.min(1, Math.max(0, brightness / 255));
    const finalR = Math.round(pRgb.r + (sRgb.r - pRgb.r) * factor);
    const finalG = Math.round(pRgb.g + (sRgb.g - pRgb.g) * factor);
    const finalB = Math.round(pRgb.b + (sRgb.b - pRgb.b) * factor);

    return `rgb(${finalR}, ${finalG}, ${finalB})`;
  }

  return `rgb(${r}, ${g}, ${b})`;
}
