# Face Art — Real-Time Webcam Particle & ASCII Visualizer

A high-performance biometric visualizer that captures your live webcam feed and dynamically transforms your facial geometry into interactive particles, ASCII characters, matrix streams, and halftone optical grids.

---

## Features

### 1. Dual Graphics Engine Architecture
- **⚡ WebGL 2.0 GPU Shader Engine**:
  - Live webcam video frames are uploaded directly to the GPU as `sampler2D` textures.
  - GLSL Vertex Shader samples luminance directly on the GPU and executes **3D Facial Relief Extrusion** (Z-displacement).
  - Renders **20,000 to 50,000+ simultaneous particles** in a single GPU draw call at 60–144 FPS.
  - GPU texture atlas for high-speed hardware ASCII typography rasterization.
- **Canvas 2D CPU Engine**:
  - Precision pixel-sampled particle physics with Hooke's law spring restitution and constellation links.
  - One-click instant switching between WebGL GPU and Canvas 2D engines right in the app header!

### 2. Multi-Mode Rendering Engine
- **Interactive Particles**: Responsive particle matrix with radius, depth, and opacity determined by authentic pixel luminance.
- **ASCII Typography Grid**: Monospace typography mapped directly to brightness levels with customizable charsets.
- **Floating ASCII Particles**: Hybrid mode where individual ASCII glyphs act as dynamic physics particles.
- **Halftone Pop-Art**: Dynamic optical halftone dots scaled by pixel luminance.
- **Matrix Code Rain**: Futuristic streaming digital rain columns mapped to facial contours.

### 2. Comprehensive Color & Styling Customization
- **Webcam Real RGB**: Direct color sampling preserving authentic skin tone and environmental lighting.
- **Custom Solid Colors**: Interactive color picker with instant hex swatches (*Cyber Cyan*, *Matrix Green*, *Amber CRT*, *Neon Magenta*, *Ice Blue*, *Plasma Orange*, *Chalk White*).
- **Curated Theme Palettes**:
  - *Cyberpunk Neon* (Cyan / Magenta on Deep Void)
  - *Matrix Phosphor* (Vintage 90s CRT green)
  - *Amber Terminal* (VT220 amber radiation display)
  - *Synthwave Sunset* (80s retro sunset glow)
  - *Ice Glacier* (Sub-zero crystalline glow)
  - *Solar Flare* (Molten plasma glow)
  - *Minimal Chalk* (High-contrast monochrome)
- **Background Color**: Full color picker + presets (*Deep Void*, *Pure Black*, *Cyber Dark*, *Matrix Dark*, *Amber Charcoal*, *Paper Light*).
- **Luminance Inversion & Neon Glow**: Toggle inverted luminance curves and bloom shadows.

### 3. Interactive Mouse Physics
- **Repulsion Field**: Hovering or dragging your mouse cursor disperses the particles/glyphs outwards.
- **Spring Restitution**: Particles organically return to their anchor positions on your face.
- **Adjustable Parameters**: Dispersal radius, blast force, spring return speed, and organic floating drift.
- **Constellation Connections**: Optional connective lines between neighboring particles.

### 4. Camera & Optics Controls
- **Live Stream Controls**: Toggle camera feed, device switcher for multiple webcams.
- **Optics Engine**: Brightness multiplier, contrast curve, black cutoff threshold, horizontal mirror flip, and digital zoom.
- **Snapshot Export**: High-resolution PNG image download, ASCII text download (`.txt`), and one-click clipboard copy.

### 5. Strict Data Policy & Quality Standards
- 100% computed from authentic webcam pixel buffers (`ImageData`).
- Zero dummy, mock, or fake coordinates.
- Real-time performance diagnostics (measured FPS via `performance.now()`, live stream resolution, and active element count).
- App-based modals for permissions and exports (no native browser alerts/prompts).

---

## Tech Stack & Architecture

- **Runtime & Package Manager**: Bun 1.3+
- **Frontend**: React 19 + TypeScript
- **Bundler**: Vite
- **Icons**: Lucide React
- **Rendering**: Canvas 2D with offscreen pixel sampling

---

## Getting Started

From the `face-ascii-particles` directory:

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build

# Preview production build
bun run preview
```

---

## Versioning

The centralized application version is maintained in `package.json` (`v0.1.0`) and automatically injected into the UI header and diagnostic metadata.
