export type RenderMode = 'particles' | 'ascii' | 'ascii-particles' | 'halftone' | 'matrix-rain';

export type ColorMode = 'source' | 'custom' | 'theme';

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary?: string;
  background: string;
  description: string;
}

export type ParticleShape = 'circle' | 'square' | 'ring' | 'glow';

export type EngineType = 'webgl' | 'canvas2d';

export interface VisualizerConfig {
  engineType: EngineType;
  mode: RenderMode;
  colorMode: ColorMode;
  customColor: string;
  backgroundColor: string;
  selectedThemeId: string;
  depth3D: number; // 0.0 to 1.5 Z-depth extrusion in WebGL
  
  // Resolution & Sampling
  samplingDensity: number; // grid step size in pixels (e.g., 4 to 20)
  brightness: number; // multiplier 0.5 to 2.0
  contrast: number; // -50 to 50
  invert: boolean;
  mirror: boolean;
  threshold: number; // 0 (none) to 255 (cutoff)

  // Subject & Background Removal
  removeBackground: boolean;
  bgRemovalThreshold: number; // 0.05 to 0.70
  bgRemovalMode: 'silhouette' | 'luminance' | 'chroma';
  sizeVariation: number; // 0.0 to 3.0 (dynamic size scaling by brightness for all modes)
  faceFocus: boolean; // Dynamic luminance center-of-mass cropping
  zoom: number; // 1.0 to 2.5

  // Particle specific
  particleSize: number;
  particleShape: ParticleShape;
  mouseRepelRadius: number;
  mouseRepelStrength: number;
  particleReturnSpeed: number;
  connectLines: boolean;
  connectDistance: number;
  floatJitter: number;

  // ASCII specific
  asciiCharset: string;
  fontSize: number;
  fontFamily: string;
  charGlow: boolean;

  // Halftone specific
  halftoneDotShape: HalftoneDotShape;
  halftoneScale: number; // 0.4 to 2.5
  halftoneAngle: number; // 0 to 90 degrees
  halftoneSoftness: number; // 0.0 to 0.5

  // Output
  showDiagnostics: boolean;
}

export type HalftoneDotShape = 'circle' | 'diamond' | 'line' | 'square' | 'ring';

export interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  r: number;
  g: number;
  b: number;
  a: number;
  brightness: number;
  char?: string;
}

export interface StreamStats {
  fps: number;
  width: number;
  height: number;
  activeElements: number;
  isStreaming: boolean;
  deviceName: string;
}
