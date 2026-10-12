import type { VisualizerConfig } from '../types/visualizer';
import { COLOR_THEMES } from '../config/constants';
import { hexToRgb } from './colorUtils';

const VS_SOURCE = `
precision highp float;
precision highp int;

attribute vec2 a_position; // Randomized base pos: -1.0 to 1.0
attribute vec2 a_texCoord; // UV pos: 0.0 to 1.0
attribute float a_random;  // Pseudo-random seed 0.0 to 1.0

uniform sampler2D u_videoTexture;
uniform vec2 u_resolution;
uniform vec2 u_mouse;      // in screen pixels, -1 if inactive
uniform float u_mouseRadius;
uniform float u_mouseStrength;
uniform float u_particleSize;
uniform float u_fontSize;
uniform float u_halftoneScale;
uniform float u_sizeVariation;
uniform bool u_removeBackground;
uniform float u_bgRemovalThreshold;
uniform int u_bgRemovalMode;
uniform vec2 u_subjectCentroid;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform int u_renderMode;   // 0: particle, 1: ascii, 2: ring, 3: square, 4: halftone, 5: matrix
uniform float u_depth3D;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_threshold;
uniform float u_time;
uniform float u_zoom;
uniform float u_floatJitter;
uniform bool u_mirror;

varying vec4 v_color;
varying float v_brightness;
varying vec2 v_texCoord;
varying float v_random;

void main() {
  // Correct aspect ratio via object-fit: cover mapping
  vec2 uv = a_texCoord * u_uvScale + u_uvOffset;

  if (u_mirror) {
    uv.x = 1.0 - uv.x;
  }
  
  // Digital Zoom
  if (u_zoom > 1.0) {
    uv = (uv - 0.5) / u_zoom + 0.5;
  }

  vec4 srcColor = texture2D(u_videoTexture, uv);

  // Brightness and contrast
  vec3 rgb = srcColor.rgb * u_brightness;
  float contrastFactor = (259.0 * (u_contrast + 255.0)) / (255.0 * (259.0 - u_contrast));
  rgb = clamp(contrastFactor * (rgb - 0.5) + 0.5, 0.0, 1.0);

  // Luminance: 0.299R + 0.587G + 0.114B
  float lum = dot(rgb, vec3(0.299, 0.587, 0.114));

  v_brightness = lum;
  v_color = vec4(rgb, srcColor.a);
  v_texCoord = a_texCoord;
  v_random = a_random;

  // Threshold cutoff
  if (lum < (u_threshold / 255.0)) {
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // clip away
    return;
  }

  // Live Background Removal
  if (u_removeBackground) {
    vec2 toCentroid = (uv - u_subjectCentroid) * vec2(1.0, 0.82);
    float distToSubject = length(toCentroid);

    if (u_bgRemovalMode == 0) {
      // Silhouette Proximity Mask
      if (distToSubject > u_bgRemovalThreshold) {
        gl_PointSize = 0.0;
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }
    } else if (u_bgRemovalMode == 1) {
      // Luminance / Depth Contrast Mask
      if (lum < u_bgRemovalThreshold || distToSubject > (u_bgRemovalThreshold * 1.5)) {
        gl_PointSize = 0.0;
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }
    } else if (u_bgRemovalMode == 2) {
      // Skin Chroma & Face Silhouette Mask: checks warm chroma (R > B)
      bool isSubjectTone = (rgb.r > rgb.b * 1.05) && (rgb.r > 0.15);
      if ((!isSubjectTone && distToSubject > 0.22) || distToSubject > u_bgRemovalThreshold) {
        gl_PointSize = 0.0;
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }
    }
  }

  vec2 pos = a_position;

  // Organic micro-drift / floating jitter to break up any linearity
  if (u_floatJitter > 0.0) {
    float driftAngle = a_random * 6.28318 + u_time * 1.5;
    vec2 drift = vec2(cos(driftAngle), sin(driftAngle)) * (u_floatJitter * 0.006);
    pos += drift;
  }

  // Screen coordinate for mouse interaction
  vec2 screenPos = (pos * 0.5 + 0.5) * u_resolution;
  screenPos.y = u_resolution.y - screenPos.y; // Flip Y for screen match

  if (u_mouse.x >= 0.0) {
    float dist = distance(screenPos, u_mouse);
    if (dist < u_mouseRadius && dist > 0.001) {
      vec2 dir = normalize(screenPos - u_mouse);
      float force = ((u_mouseRadius - dist) / u_mouseRadius) * u_mouseStrength * 2.2;
      pos += (dir * force) / (u_resolution * 0.5);
    }
  }

  // 3D Depth relief based on facial luminance
  float z = (lum - 0.5) * u_depth3D;

  // Perspective division
  float pZ = 1.0 + z * 0.8;
  vec2 finalPos = pos / pZ;

  gl_Position = vec4(finalPos, z * 0.5, 1.0);

  // Dynamic point size scaling based on authentic luminance and u_sizeVariation across ALL modes
  float dynamicScale = mix(1.0, clamp(lum * 2.4, 0.18, 2.6), u_sizeVariation * 0.6);

  if (u_renderMode == 1 || u_renderMode == 5) {
    // ASCII or Matrix Mode: font glyph size varies dynamically with brightness
    gl_PointSize = max(8.0, u_fontSize * dynamicScale / pZ);
  } else if (u_renderMode == 4) {
    // Halftone Mode: dot size varies dramatically with luminance
    gl_PointSize = max(2.5, u_particleSize * 3.4 * u_halftoneScale * dynamicScale / pZ);
  } else {
    // Particles Mode: particles scale dynamically from fine dust to prominent radiant nodes
    gl_PointSize = max(1.0, u_particleSize * 1.6 * dynamicScale / pZ);
  }
}
`;

const FS_SOURCE = `
precision highp float;
precision highp int;

uniform int u_renderMode;    // 0: particle, 1: ascii, 2: ring, 3: square, 4: halftone, 5: matrix
uniform int u_halftoneDotShape; // 0: circle, 1: diamond, 2: line, 3: square, 4: ring
uniform float u_halftoneAngle;   // radians
uniform float u_halftoneSoftness; // 0.0 to 0.5
uniform int u_colorMode;     // 0: source, 1: custom, 2: theme
uniform vec3 u_customColor;  // RGB 0-1
uniform vec3 u_themePrimary; // RGB 0-1
uniform vec3 u_themeSecondary;// RGB 0-1
uniform bool u_invert;
uniform bool u_charGlow;
uniform sampler2D u_asciiAtlas;
uniform float u_atlasCharsCount;
uniform float u_time;

varying vec4 v_color;
varying float v_brightness;
varying vec2 v_texCoord;
varying float v_random;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float alpha = 1.0;

  if (u_renderMode == 0) {
    // Smooth Circular Particle
    if (dist > 0.5) discard;
    alpha = u_charGlow ? smoothstep(0.5, 0.15, dist) : 1.0;
  } else if (u_renderMode == 2) {
    // Ring Shape
    if (dist > 0.5 || dist < 0.28) discard;
    alpha = 1.0;
  } else if (u_renderMode == 3) {
    // Square Shape: full quad
    alpha = 1.0;
  } else if (u_renderMode == 4) {
    // Halftone Mode: rotates and renders multiple patterns
    float cosA = cos(u_halftoneAngle);
    float sinA = sin(u_halftoneAngle);
    vec2 rotCoord = vec2(coord.x * cosA - coord.y * sinA, coord.x * sinA + coord.y * cosA);
    float maxR = 0.48;

    if (u_halftoneDotShape == 0) {
      // Circle Dot
      float dotR = clamp(v_brightness * maxR, 0.04, maxR);
      float d = length(rotCoord);
      if (d > dotR) discard;
      alpha = u_halftoneSoftness > 0.01 ? smoothstep(dotR, dotR * (1.0 - u_halftoneSoftness * 1.5), d) : 1.0;
    } else if (u_halftoneDotShape == 1) {
      // Diamond Dot
      float dotR = clamp(v_brightness * maxR * 1.15, 0.05, maxR * 1.15);
      float d = abs(rotCoord.x) + abs(rotCoord.y);
      if (d > dotR) discard;
      alpha = u_halftoneSoftness > 0.01 ? smoothstep(dotR, dotR * (1.0 - u_halftoneSoftness * 1.5), d) : 1.0;
    } else if (u_halftoneDotShape == 2) {
      // Engraving Line
      float dotR = clamp(v_brightness * 0.45, 0.03, 0.45);
      float d = abs(rotCoord.y);
      if (d > dotR) discard;
      alpha = u_halftoneSoftness > 0.01 ? smoothstep(dotR, dotR * (1.0 - u_halftoneSoftness * 1.5), d) : 1.0;
    } else if (u_halftoneDotShape == 3) {
      // Square Dot
      float dotR = clamp(v_brightness * maxR, 0.05, maxR);
      float d = max(abs(rotCoord.x), abs(rotCoord.y));
      if (d > dotR) discard;
      alpha = u_halftoneSoftness > 0.01 ? smoothstep(dotR, dotR * (1.0 - u_halftoneSoftness * 1.5), d) : 1.0;
    } else if (u_halftoneDotShape == 4) {
      // Ring Dot
      float d = length(rotCoord);
      float outerR = clamp(v_brightness * maxR, 0.08, maxR);
      float innerR = outerR * 0.55;
      if (d > outerR || d < innerR) discard;
      alpha = 1.0;
    }
  } else if (u_renderMode == 1) {
    // ASCII Mode: sample character glyph from texture atlas
    float b = u_invert ? (1.0 - v_brightness) : v_brightness;
    float charIndex = floor(clamp(b, 0.0, 0.999) * u_atlasCharsCount);
    
    float charW = 1.0 / u_atlasCharsCount;
    vec2 atlasUV = vec2((charIndex + gl_PointCoord.x) * charW, gl_PointCoord.y);
    vec4 glyph = texture2D(u_asciiAtlas, atlasUV);
    if (glyph.a < 0.25) discard;
    alpha = glyph.a;
  } else if (u_renderMode == 5) {
    // Matrix Mode: animated digital streaming glyphs
    float flicker = mod(v_random * 100.0 + u_time * 4.0, u_atlasCharsCount);
    float charIndex = floor(flicker);
    
    float charW = 1.0 / u_atlasCharsCount;
    vec2 atlasUV = vec2((charIndex + gl_PointCoord.x) * charW, gl_PointCoord.y);
    vec4 glyph = texture2D(u_asciiAtlas, atlasUV);
    if (glyph.a < 0.25) discard;
    alpha = glyph.a;
  }

  // Resolve foreground color
  vec3 outColor = v_color.rgb;
  if (u_colorMode == 1) {
    outColor = u_customColor;
  } else if (u_colorMode == 2) {
    outColor = mix(u_themeSecondary, u_themePrimary, v_brightness);
  }

  if (u_invert && u_colorMode == 0) {
    outColor = 1.0 - outColor;
  }

  gl_FragColor = vec4(outColor, alpha);
}
`;

export class WebGLParticleEngine {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private videoTexture: WebGLTexture | null = null;
  private asciiAtlasTexture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private randomBuffer: WebGLBuffer | null = null;
  private vertexCount: number = 0;
  private currentGridStep: number = 0;
  private lastWidth: number = 0;
  private lastHeight: number = 0;
  private cachedCharset: string = '';

  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  constructor(canvas: HTMLCanvasElement) {
    this.initGL(canvas);
  }

  private initGL(canvas: HTMLCanvasElement): void {
    const gl =
      (canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: true }) as WebGLRenderingContext) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext);

    if (!gl) {
      console.warn('WebGL not supported on this device.');
      return;
    }

    this.gl = gl;
    this.program = this.createProgram(gl, VS_SOURCE, FS_SOURCE);
    if (!this.program) return;

    gl.useProgram(this.program);

    const uList = [
      'u_videoTexture',
      'u_asciiAtlas',
      'u_resolution',
      'u_mouse',
      'u_mouseRadius',
      'u_mouseStrength',
      'u_particleSize',
      'u_fontSize',
      'u_renderMode',
      'u_depth3D',
      'u_brightness',
      'u_contrast',
      'u_threshold',
      'u_time',
      'u_zoom',
      'u_floatJitter',
      'u_mirror',
      'u_colorMode',
      'u_customColor',
      'u_themePrimary',
      'u_themeSecondary',
      'u_invert',
      'u_charGlow',
      'u_atlasCharsCount',
      'u_halftoneScale',
      'u_halftoneDotShape',
      'u_halftoneAngle',
      'u_halftoneSoftness',
      'u_sizeVariation',
      'u_removeBackground',
      'u_bgRemovalThreshold',
      'u_bgRemovalMode',
      'u_subjectCentroid',
      'u_uvScale',
      'u_uvOffset',
    ];
    for (const name of uList) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }

    this.videoTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.asciiAtlasTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.asciiAtlasTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.positionBuffer = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();
    this.randomBuffer = gl.createBuffer();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private createProgram(
    gl: WebGLRenderingContext,
    vsSrc: string,
    fsSrc: string
  ): WebGLProgram | null {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vs || !fs) return null;

    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('VS Error:', gl.getShaderInfoLog(vs));
      return null;
    }

    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('FS Error:', gl.getShaderInfoLog(fs));
      return null;
    }

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program Link Error:', gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }

  /**
   * Generates a 2D font texture atlas for ASCII characters on GPU
   */
  public updateAsciiAtlas(charset: string): number {
    if (!this.gl || !this.asciiAtlasTexture) return 0;
    const gl = this.gl;
    const chars = charset || '@%#*+=-:. ';

    if (this.cachedCharset === chars) {
      return chars.length;
    }
    this.cachedCharset = chars;

    const count = chars.length;
    const size = 64;

    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = count * size;
    atlasCanvas.height = size;
    const ctx = atlasCanvas.getContext('2d');
    if (!ctx) return 0;

    ctx.clearRect(0, 0, atlasCanvas.width, atlasCanvas.height);
    ctx.font = `bold ${Math.floor(size * 0.85)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < count; i++) {
      ctx.fillText(chars[i], i * size + size / 2, size / 2);
    }

    gl.bindTexture(gl.TEXTURE_2D, this.asciiAtlasTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);

    return count;
  }

  /**
   * Builds the particle vertex grid with randomized jitter (no rigid lines or grid)
   */
  public updateGrid(width: number, height: number, density: number): void {
    if (!this.gl || !this.program || width <= 0 || height <= 0) return;
    if (this.currentGridStep === density && this.lastWidth === width && this.lastHeight === height && this.vertexCount > 0) {
      return;
    }
    const gl = this.gl;
    this.currentGridStep = density;
    this.lastWidth = width;
    this.lastHeight = height;

    const step = Math.max(3, density);
    const cols = Math.floor(width / step);
    const rows = Math.floor(height / step);
    const total = cols * rows;

    const positions = new Float32Array(total * 2);
    const texCoords = new Float32Array(total * 2);
    const randoms = new Float32Array(total);

    const stepNdcX = 2.0 / Math.max(1, cols - 1);
    const stepNdcY = 2.0 / Math.max(1, rows - 1);

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Base NDC position: -1.0 to 1.0
        const baseNdcX = (c / (cols - 1)) * 2.0 - 1.0;
        const baseNdcY = 1.0 - (r / (rows - 1)) * 2.0;

        // Randomized organic jitter: up to 80% of step to break up linear rows/columns
        const jitterX = (Math.random() - 0.5) * stepNdcX * 0.82;
        const jitterY = (Math.random() - 0.5) * stepNdcY * 0.82;

        const posX = Math.max(-1.0, Math.min(1.0, baseNdcX + jitterX));
        const posY = Math.max(-1.0, Math.min(1.0, baseNdcY + jitterY));

        // Sample texture UV at the authentic randomized vertex position
        const u = Math.max(0.0, Math.min(1.0, (posX + 1.0) * 0.5));
        const v = Math.max(0.0, Math.min(1.0, (1.0 - posY) * 0.5));

        positions[idx * 2] = posX;
        positions[idx * 2 + 1] = posY;

        texCoords[idx * 2] = u;
        texCoords[idx * 2 + 1] = v;

        randoms[idx] = Math.random();

        idx++;
      }
    }

    this.vertexCount = total;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.randomBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, randoms, gl.STATIC_DRAW);
  }

  /**
   * Renders the GPU particle / ASCII scene
   */
  public render(
    source: HTMLVideoElement | HTMLImageElement,
    width: number,
    height: number,
    mouseX: number | null,
    mouseY: number | null,
    config: VisualizerConfig,
    centroid?: { x: number; y: number }
  ): number {
    const gl = this.gl;
    if (!gl || !this.program) return 0;

    if (this.vertexCount === 0 && width > 0 && height > 0) {
      this.updateGrid(width, height, config.samplingDensity);
    }

    gl.viewport(0, 0, width, height);

    // Clear background
    const bgRgb = hexToRgb(config.backgroundColor);
    gl.clearColor(bgRgb.r / 255, bgRgb.g / 255, bgRgb.b / 255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Upload camera frame to GPU texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    // Update ASCII font atlas
    const atlasCount = this.updateAsciiAtlas(config.asciiCharset);

    // Bind ASCII Atlas
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.asciiAtlasTexture);

    gl.useProgram(this.program);

    // Set uniforms
    gl.uniform1i(this.uniforms['u_videoTexture'], 0);
    gl.uniform1i(this.uniforms['u_asciiAtlas'], 1);
    gl.uniform2f(this.uniforms['u_resolution'], width, height);

    if (mouseX !== null && mouseY !== null) {
      gl.uniform2f(this.uniforms['u_mouse'], mouseX, mouseY);
    } else {
      gl.uniform2f(this.uniforms['u_mouse'], -1000.0, -1000.0);
    }

    gl.uniform1f(this.uniforms['u_mouseRadius'], config.mouseRepelRadius);
    gl.uniform1f(this.uniforms['u_mouseStrength'], config.mouseRepelStrength);
    gl.uniform1f(this.uniforms['u_particleSize'], config.particleSize * (window.devicePixelRatio || 1));
    gl.uniform1f(this.uniforms['u_fontSize'], config.fontSize * (window.devicePixelRatio || 1));
    gl.uniform1f(this.uniforms['u_depth3D'], config.depth3D || 0.4);
    gl.uniform1f(this.uniforms['u_brightness'], config.brightness);
    gl.uniform1f(this.uniforms['u_contrast'], config.contrast);
    gl.uniform1f(this.uniforms['u_threshold'], config.threshold);
    gl.uniform1f(this.uniforms['u_time'], performance.now() / 1000.0);
    gl.uniform1f(this.uniforms['u_zoom'], config.zoom);
    gl.uniform1f(this.uniforms['u_floatJitter'], config.floatJitter);
    gl.uniform1i(this.uniforms['u_mirror'], config.mirror ? 1 : 0);

    // Map render modes:
    // 0: particles circle, 1: ascii, 2: ring, 3: square, 4: halftone, 5: matrix
    let renderModeVal = 0;
    if (config.mode === 'ascii' || config.mode === 'ascii-particles') {
      renderModeVal = 1;
    } else if (config.mode === 'halftone') {
      renderModeVal = 4;
    } else if (config.mode === 'matrix-rain') {
      renderModeVal = 5;
    } else if (config.particleShape === 'ring') {
      renderModeVal = 2;
    } else if (config.particleShape === 'square') {
      renderModeVal = 3;
    }
    gl.uniform1i(this.uniforms['u_renderMode'], renderModeVal);

    // Color mode
    let colorModeVal = 0;
    if (config.colorMode === 'custom') colorModeVal = 1;
    else if (config.colorMode === 'theme') colorModeVal = 2;
    gl.uniform1i(this.uniforms['u_colorMode'], colorModeVal);

    const customRgb = hexToRgb(config.customColor);
    gl.uniform3f(this.uniforms['u_customColor'], customRgb.r / 255, customRgb.g / 255, customRgb.b / 255);

    const theme = COLOR_THEMES.find((t) => t.id === config.selectedThemeId) || COLOR_THEMES[0];
    const pRgb = hexToRgb(theme.primary);
    const sRgb = theme.secondary ? hexToRgb(theme.secondary) : pRgb;
    gl.uniform3f(this.uniforms['u_themePrimary'], pRgb.r / 255, pRgb.g / 255, pRgb.b / 255);
    gl.uniform3f(this.uniforms['u_themeSecondary'], sRgb.r / 255, sRgb.g / 255, sRgb.b / 255);

    gl.uniform1i(this.uniforms['u_invert'], config.invert ? 1 : 0);
    gl.uniform1i(this.uniforms['u_charGlow'], config.charGlow ? 1 : 0);
    gl.uniform1f(this.uniforms['u_atlasCharsCount'], atlasCount || 10.0);

    // Halftone parameters
    let halftoneShapeVal = 0;
    if (config.halftoneDotShape === 'diamond') halftoneShapeVal = 1;
    else if (config.halftoneDotShape === 'line') halftoneShapeVal = 2;
    else if (config.halftoneDotShape === 'square') halftoneShapeVal = 3;
    else if (config.halftoneDotShape === 'ring') halftoneShapeVal = 4;
    gl.uniform1i(this.uniforms['u_halftoneDotShape'], halftoneShapeVal);

    gl.uniform1f(this.uniforms['u_halftoneScale'], config.halftoneScale || 1.2);
    gl.uniform1f(this.uniforms['u_halftoneAngle'], ((config.halftoneAngle || 0) * Math.PI) / 180.0);
    gl.uniform1f(this.uniforms['u_halftoneSoftness'], config.halftoneSoftness || 0.05);

    // Dynamic Size Variation across all modes
    gl.uniform1f(this.uniforms['u_sizeVariation'], config.sizeVariation !== undefined ? config.sizeVariation : 1.8);

    // Live Background Removal uniforms
    gl.uniform1i(this.uniforms['u_removeBackground'], config.removeBackground ? 1 : 0);
    gl.uniform1f(this.uniforms['u_bgRemovalThreshold'], config.bgRemovalThreshold !== undefined ? config.bgRemovalThreshold : 0.38);

    let bgModeVal = 0;
    if (config.bgRemovalMode === 'luminance') bgModeVal = 1;
    else if (config.bgRemovalMode === 'chroma') bgModeVal = 2;
    gl.uniform1i(this.uniforms['u_bgRemovalMode'], bgModeVal);

    // Aspect Ratio Preservation (object-fit: cover)
    // Ensures camera video is never stretched or squashed horizontally or vertically
    const isVideo = source instanceof HTMLVideoElement;
    const srcW = isVideo ? source.videoWidth : source.naturalWidth;
    const srcH = isVideo ? source.videoHeight : source.naturalHeight;

    let uvScaleX = 1.0;
    let uvScaleY = 1.0;
    let uvOffsetX = 0.0;
    let uvOffsetY = 0.0;

    if (srcW > 0 && srcH > 0 && width > 0 && height > 0) {
      const srcAspect = srcW / srcH;
      const canvasAspect = width / height;

      if (srcAspect > canvasAspect) {
        // Source video is wider than viewport canvas: crop horizontal edges to avoid squashing
        uvScaleX = canvasAspect / srcAspect;
        uvOffsetX = (1.0 - uvScaleX) * 0.5;
      } else {
        // Source video is taller than viewport canvas: crop vertical edges to avoid stretching
        uvScaleY = srcAspect / canvasAspect;
        uvOffsetY = (1.0 - uvScaleY) * 0.5;
      }
    }

    gl.uniform2f(this.uniforms['u_uvScale'], uvScaleX, uvScaleY);
    gl.uniform2f(this.uniforms['u_uvOffset'], uvOffsetX, uvOffsetY);

    // Centroid normalized in UV space [0.0 to 1.0] (default to human face center: x=0.5, y=0.45)
    const normCentroidX = centroid ? Math.max(0.0, Math.min(1.0, centroid.x / width)) : 0.5;
    const normCentroidY = centroid ? Math.max(0.0, Math.min(1.0, centroid.y / height)) : 0.45;
    gl.uniform2f(this.uniforms['u_subjectCentroid'], normCentroidX, normCentroidY);

    // Bind Attributes
    const aPos = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const aTex = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    const aRand = gl.getAttribLocation(this.program, 'a_random');
    if (aRand !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.randomBuffer);
      gl.enableVertexAttribArray(aRand);
      gl.vertexAttribPointer(aRand, 1, gl.FLOAT, false, 0, 0);
    }

    // Single GPU Draw Call
    gl.drawArrays(gl.POINTS, 0, this.vertexCount);

    return this.vertexCount;
  }
}
