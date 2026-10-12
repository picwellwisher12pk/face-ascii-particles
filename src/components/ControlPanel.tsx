import React, { useState } from 'react';
import type { VisualizerConfig, ParticleShape, HalftoneDotShape } from '../types/visualizer';
import type { CameraDevice } from '../hooks/useWebcam';
import { CHARSETS } from '../config/constants';
import { ColorPickers } from './ColorPickers';
import {
  Sparkles,
  Camera,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  X,
  Cpu,
  Scissors,
  Palette,
} from 'lucide-react';

interface ControlPanelProps {
  config: VisualizerConfig;
  onChange: (patch: Partial<VisualizerConfig>) => void;
  onReset: () => void;
  devices: CameraDevice[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'style' | 'isolate' | 'colors' | 'camera' | 'physics';

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  onChange,
  onReset,
  devices,
  selectedDeviceId,
  onSelectDevice,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('style');
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Global listener while dragging to ensure release is caught anywhere
  React.useEffect(() => {
    if (!isDraggingSlider) return;

    const handlePointerUp = () => {
      setIsDraggingSlider(false);
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDraggingSlider]);

  if (!isOpen) return null;

  const handlePointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'range') {
      setIsDraggingSlider(true);
    }
  };

  return (
    <aside
      className={`control-panel-drawer ${isDraggingSlider ? 'studio-dragging' : ''}`}
      aria-label="Visualizer Studio Drawer"
    >
      {/* Drawer Grabber Handle for mobile swipe feel */}
      <div className="drawer-drag-handle" onClick={onClose} title="Tap to close" />

      <div className="panel-header">
        <div className="panel-title-group">
          <SlidersHorizontal size={18} className="text-cyan-400" />
          <h2 className="panel-title">Studio Controls</h2>
        </div>
        <button className="panel-close-btn" onClick={onClose} title="Close Studio" aria-label="Close controls">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`panel-tab ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
          title="Style"
        >
          <Layers size={16} />
          <span className="tab-label">Style</span>
        </button>
        <button
          className={`panel-tab ${activeTab === 'isolate' ? 'active' : ''}`}
          onClick={() => setActiveTab('isolate')}
          title="Isolate"
        >
          <Scissors size={16} />
          <span className="tab-label">Isolate</span>
        </button>
        <button
          className={`panel-tab ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
          title="Colors"
        >
          <Palette size={16} />
          <span className="tab-label">Colors</span>
        </button>
        <button
          className={`panel-tab ${activeTab === 'camera' ? 'active' : ''}`}
          onClick={() => setActiveTab('camera')}
          title="Camera"
        >
          <Camera size={16} />
          <span className="tab-label">Camera</span>
        </button>
        <button
          className={`panel-tab ${activeTab === 'physics' ? 'active' : ''}`}
          onClick={() => setActiveTab('physics')}
          title="Dynamics"
        >
          <Sparkles size={16} />
          <span className="tab-label">Dynamics</span>
        </button>
      </div>

      <div className="panel-content" onPointerDownCapture={handlePointerDownCapture}>
        {/* TAB 1: STYLE & GEOMETRY */}
        {activeTab === 'style' && (
          <div className="tab-pane">
            {/* Primary Sizing & Density */}
            <div className="control-group">
              <label className="control-label">
                <span>Particle Density (Sampling)</span>
                <span className="value-badge">{config.samplingDensity}px</span>
              </label>
              <input
                type="range"
                min={3}
                max={15}
                step={1}
                value={config.samplingDensity}
                onChange={(e) => onChange({ samplingDensity: Number(e.target.value) })}
                className="custom-range"
              />
              <span className="helper-text">
                Lower = high definition / more points. Higher = minimalist retro aesthetic.
              </span>
            </div>

            {/* Dynamic Size Variation */}
            <div className="control-group">
              <label className="control-label">
                <span>Dynamic Size Variation (Contrast)</span>
                <span className="value-badge">{(config.sizeVariation ?? 1.8).toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min={0.0}
                max={3.0}
                step={0.1}
                value={config.sizeVariation ?? 1.8}
                onChange={(e) => onChange({ sizeVariation: Number(e.target.value) })}
                className="custom-range"
              />
              <span className="helper-text">
                Scales particles by brightness: highlights expand prominently, shadows shrink to micro-stardust.
              </span>
            </div>

            {/* 3D Depth Extrusion (WebGL) */}
            {config.engineType === 'webgl' && (
              <div className="control-group">
                <label className="control-label">
                  <span>3D Face Contour Depth</span>
                  <span className="value-badge">{(config.depth3D * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min={0.0}
                  max={1.2}
                  step={0.05}
                  value={config.depth3D}
                  onChange={(e) => onChange({ depth3D: Number(e.target.value) })}
                  className="custom-range"
                />
              </div>
            )}

            {/* Particles specific */}
            {(config.mode === 'particles' || config.mode === 'ascii-particles') && (
              <>
                <div className="control-group">
                  <label className="control-label">
                    <span>Base Particle Size</span>
                    <span className="value-badge">{config.particleSize.toFixed(1)}px</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.2}
                    value={config.particleSize}
                    onChange={(e) => onChange({ particleSize: Number(e.target.value) })}
                    className="custom-range"
                  />
                </div>

                <div className="control-group">
                  <label className="control-label">Particle Geometry</label>
                  <div className="shape-button-group">
                    {(['circle', 'square', 'ring', 'glow'] as ParticleShape[]).map((shape) => (
                      <button
                        key={shape}
                        className={`shape-btn ${config.particleShape === shape ? 'active' : ''}`}
                        onClick={() => onChange({ particleShape: shape })}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Halftone specific */}
            {config.mode === 'halftone' && (
              <>
                <div className="control-group">
                  <label className="control-label">Dot Pattern Shape</label>
                  <div className="shape-button-group">
                    {(['circle', 'diamond', 'line', 'square', 'ring'] as HalftoneDotShape[]).map((shape) => (
                      <button
                        key={shape}
                        className={`shape-btn ${config.halftoneDotShape === shape ? 'active' : ''}`}
                        onClick={() => onChange({ halftoneDotShape: shape })}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    <span>Halftone Scale</span>
                    <span className="value-badge">{(config.halftoneScale || 1.2).toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    value={config.halftoneScale || 1.2}
                    onChange={(e) => onChange({ halftoneScale: Number(e.target.value) })}
                    className="custom-range"
                  />
                </div>

                <div className="control-group">
                  <label className="control-label">
                    <span>Screen Print Angle</span>
                    <span className="value-badge">{config.halftoneAngle || 45}°</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={config.halftoneAngle || 45}
                    onChange={(e) => onChange({ halftoneAngle: Number(e.target.value) })}
                    className="custom-range"
                  />
                </div>
              </>
            )}

            {/* ASCII specific */}
            {(config.mode === 'ascii' || config.mode === 'ascii-particles') && (
              <>
                <div className="control-group">
                  <label className="control-label">ASCII Typography Characters</label>
                  <select
                    className="custom-select"
                    value={
                      Object.entries(CHARSETS).find(([, v]) => v === config.asciiCharset)?.[0] || 'custom'
                    }
                    onChange={(e) => {
                      const key = e.target.value as keyof typeof CHARSETS;
                      if (CHARSETS[key]) {
                        onChange({ asciiCharset: CHARSETS[key] });
                      }
                    }}
                  >
                    <option value="standard">Standard (@%#*+=-:. )</option>
                    <option value="dense">Ultra Dense HD</option>
                    <option value="blocks">Solid Blocks (█▓▒░ )</option>
                    <option value="matrix">Matrix Digital Katakana (ｦｱｳ...)</option>
                    <option value="cyber">Cyber Hex (0-9, A-F)</option>
                    <option value="runes">Geometric Runes (⚡✦★※▲)</option>
                  </select>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    <span>Font Size</span>
                    <span className="value-badge">{config.fontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={22}
                    step={1}
                    value={config.fontSize}
                    onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                    className="custom-range"
                  />
                </div>
              </>
            )}

            {/* Graphics Engine Switcher */}
            <div className="control-group mt-2">
              <label className="control-label">
                <span className="flex items-center gap-1.5">
                  <Cpu size={14} className="text-cyan-400" />
                  Engine Architecture
                </span>
              </label>
              <div className="mode-segmented-control">
                <button
                  className={`segment-btn ${config.engineType === 'webgl' ? 'active' : ''}`}
                  onClick={() => onChange({ engineType: 'webgl' })}
                >
                  ⚡ WebGL GPU
                </button>
                <button
                  className={`segment-btn ${config.engineType === 'canvas2d' ? 'active' : ''}`}
                  onClick={() => onChange({ engineType: 'canvas2d' })}
                >
                  2D Canvas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBJECT ISOLATION & BACKGROUND REMOVAL */}
        {activeTab === 'isolate' && (
          <div className="tab-pane">
            <div className="toggle-card">
              <label className="checkbox-label" style={{ fontWeight: 600, color: '#38bdf8' }}>
                <input
                  type="checkbox"
                  checked={config.removeBackground}
                  onChange={(e) => onChange({ removeBackground: e.target.checked })}
                />
                <span>Remove Camera Background</span>
              </label>
              <span className="helper-text">
                Isolates your face & torso while discarding background room clutter in real time.
              </span>
            </div>

            {config.removeBackground && (
              <>
                <div className="control-group">
                  <label className="control-label">Isolation Mode</label>
                  <div className="mode-segmented-control">
                    <button
                      className={`segment-btn ${config.bgRemovalMode === 'silhouette' ? 'active' : ''}`}
                      onClick={() => onChange({ bgRemovalMode: 'silhouette' })}
                    >
                      Silhouette
                    </button>
                    <button
                      className={`segment-btn ${config.bgRemovalMode === 'luminance' ? 'active' : ''}`}
                      onClick={() => onChange({ bgRemovalMode: 'luminance' })}
                    >
                      Contrast
                    </button>
                    <button
                      className={`segment-btn ${config.bgRemovalMode === 'chroma' ? 'active' : ''}`}
                      onClick={() => onChange({ bgRemovalMode: 'chroma' })}
                    >
                      Face Skin
                    </button>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    <span>Isolation Cutoff / Radius</span>
                    <span className="value-badge">{((config.bgRemovalThreshold || 0.38) * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0.15}
                    max={0.65}
                    step={0.02}
                    value={config.bgRemovalThreshold || 0.38}
                    onChange={(e) => onChange({ bgRemovalThreshold: Number(e.target.value) })}
                    className="custom-range"
                  />
                  <span className="helper-text">
                    Increase to include more of your shoulders, decrease for a tighter face isolation.
                  </span>
                </div>
              </>
            )}

            <div className="control-group">
              <label className="control-label">
                <span>Black Cutoff Threshold</span>
                <span className="value-badge">{config.threshold}</span>
              </label>
              <input
                type="range"
                min={0}
                max={90}
                step={2}
                value={config.threshold}
                onChange={(e) => onChange({ threshold: Number(e.target.value) })}
                className="custom-range"
              />
              <span className="helper-text">
                Removes dark shadows to make visualizer clean and punchy.
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: COLORS */}
        {activeTab === 'colors' && (
          <div className="tab-pane">
            <ColorPickers config={config} onChange={onChange} />
          </div>
        )}

        {/* TAB 4: CAMERA & OPTICS */}
        {activeTab === 'camera' && (
          <div className="tab-pane">
            {devices.length > 1 && (
              <div className="control-group">
                <label className="control-label">Switch Camera Lens</label>
                <select
                  className="custom-select"
                  value={selectedDeviceId}
                  onChange={(e) => onSelectDevice(e.target.value)}
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="control-group">
              <label className="control-label">
                <span>Brightness</span>
                <span className="value-badge">{(config.brightness * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min={0.6}
                max={2.0}
                step={0.05}
                value={config.brightness}
                onChange={(e) => onChange({ brightness: Number(e.target.value) })}
                className="custom-range"
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Contrast</span>
                <span className="value-badge">{config.contrast > 0 ? `+${config.contrast}` : config.contrast}</span>
              </label>
              <input
                type="range"
                min={-30}
                max={50}
                step={2}
                value={config.contrast}
                onChange={(e) => onChange({ contrast: Number(e.target.value) })}
                className="custom-range"
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Digital Zoom</span>
                <span className="value-badge">{config.zoom.toFixed(2)}x</span>
              </label>
              <input
                type="range"
                min={1.0}
                max={2.2}
                step={0.05}
                value={config.zoom}
                onChange={(e) => onChange({ zoom: Number(e.target.value) })}
                className="custom-range"
              />
            </div>

            <div className="toggle-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.mirror}
                  onChange={(e) => onChange({ mirror: e.target.checked })}
                />
                <span>Horizontal Mirror Flip (Selfie)</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: DYNAMICS & TOUCH PHYSICS */}
        {activeTab === 'physics' && (
          <div className="tab-pane">
            <div className="control-group">
              <label className="control-label">
                <span>Touch / Repulsion Force</span>
                <span className="value-badge">{config.mouseRepelStrength.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={1.0}
                max={8.0}
                step={0.5}
                value={config.mouseRepelStrength}
                onChange={(e) => onChange({ mouseRepelStrength: Number(e.target.value) })}
                className="custom-range"
              />
              <span className="helper-text">
                Dragging finger across screen disperses particles and creates fluid shockwaves.
              </span>
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Touch Blast Radius</span>
                <span className="value-badge">{config.mouseRepelRadius}px</span>
              </label>
              <input
                type="range"
                min={40}
                max={200}
                step={5}
                value={config.mouseRepelRadius}
                onChange={(e) => onChange({ mouseRepelRadius: Number(e.target.value) })}
                className="custom-range"
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>Floating Micro-Drift</span>
                <span className="value-badge">{config.floatJitter.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1.0}
                step={0.05}
                value={config.floatJitter}
                onChange={(e) => onChange({ floatJitter: Number(e.target.value) })}
                className="custom-range"
              />
            </div>

            <div className="toggle-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.showDiagnostics}
                  onChange={(e) => onChange({ showDiagnostics: e.target.checked })}
                />
                <span>Show Diagnostics / FPS Indicator</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <button className="reset-btn" onClick={onReset}>
          <RotateCcw size={14} />
          Reset Defaults
        </button>
      </div>
    </aside>
  );
};
