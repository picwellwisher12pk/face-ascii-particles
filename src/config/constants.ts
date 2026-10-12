import type { ColorTheme, VisualizerConfig } from '../types/visualizer';

export const CHARSETS = {
  standard: '@%#*+=-:. ',
  dense: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
  blocks: '█▓▒░ ',
  matrix: '01',
  cyber: '0123456789ABCDEF',
  minimal: '.:*#@',
  runes: '⚡✦★※▲■◆●',
};

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    primary: '#00ffcc',
    secondary: '#ff007f',
    background: '#070913',
    description: 'Electric cyan and neon magenta over deep void',
  },
  {
    id: 'matrix',
    name: 'Matrix Phosphor',
    primary: '#00ff66',
    secondary: '#20cc55',
    background: '#020d04',
    description: 'Authentic 90s monochrome green phosphor CRT',
  },
  {
    id: 'amber-crt',
    name: 'Amber Terminal',
    primary: '#ffb000',
    secondary: '#ff8800',
    background: '#120b02',
    description: 'Vintage VT220 amber radiation display',
  },
  {
    id: 'synthwave',
    name: 'Synthwave Sunset',
    primary: '#ff71ce',
    secondary: '#01cdfe',
    background: '#0e0720',
    description: '80s retro sunset glow',
  },
  {
    id: 'ice-glacier',
    name: 'Ice Glacier',
    primary: '#38bdf8',
    secondary: '#818cf8',
    background: '#030712',
    description: 'Cool crisp sub-zero crystalline glow',
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    primary: '#f97316',
    secondary: '#eab308',
    background: '#140804',
    description: 'Molten plasma radiance',
  },
  {
    id: 'pure-white',
    name: 'Minimal Chalk',
    primary: '#f8fafc',
    secondary: '#94a3b8',
    background: '#09090b',
    description: 'Crisp high-contrast monochrome',
  },
];

export const BACKGROUND_PRESETS = [
  { label: 'Deep Void', value: '#050508' },
  { label: 'Pure Black', value: '#000000' },
  { label: 'Cyber Dark', value: '#0b1120' },
  { label: 'Matrix Dark', value: '#020d06' },
  { label: 'Amber Charcoal', value: '#120b02' },
  { label: 'Paper Light', value: '#f1f5f9' },
];

export const DEFAULT_CONFIG: VisualizerConfig = {
  engineType: 'webgl',
  mode: 'particles',
  colorMode: 'source',
  customColor: '#00ffcc',
  backgroundColor: '#050508',
  selectedThemeId: 'cyberpunk',
  depth3D: 0.45,

  // Resolution & Sampling
  samplingDensity: 7,
  brightness: 1.1,
  contrast: 15,
  invert: false,
  mirror: true,
  threshold: 15,

  // Subject & Background Removal
  removeBackground: false,
  bgRemovalThreshold: 0.38,
  bgRemovalMode: 'silhouette',
  sizeVariation: 1.8,
  faceFocus: false,
  zoom: 1.0,

  // Particle specific
  particleSize: 2.8,
  particleShape: 'circle',
  mouseRepelRadius: 100,
  mouseRepelStrength: 4.5,
  particleReturnSpeed: 0.12,
  connectLines: false,
  connectDistance: 22,
  floatJitter: 0.25,

  // ASCII specific
  asciiCharset: CHARSETS.standard,
  fontSize: 12,
  fontFamily: 'monospace',
  charGlow: true,

  // Halftone specific
  halftoneDotShape: 'circle',
  halftoneScale: 1.2,
  halftoneAngle: 45,
  halftoneSoftness: 0.05,

  showDiagnostics: true,
};
