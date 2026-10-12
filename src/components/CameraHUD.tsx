import React from 'react';
import {
  Camera,
  CameraOff,
  Upload,
  Sparkles,
  CircleDot,
  Grid,
  Type,
  Wind,
  Binary,
} from 'lucide-react';
import type { RenderMode } from '../types/visualizer';

interface CameraHUDProps {
  currentMode: RenderMode;
  onModeChange: (mode: RenderMode) => void;
  isStreaming: boolean;
  onToggleCamera: () => void;
  onUploadPhoto: () => void;
  onTakeSnapshot: () => void;
}

interface ModeItem {
  id: RenderMode;
  label: string;
  icon: React.ReactNode;
}

const MODES: ModeItem[] = [
  { id: 'particles', label: 'Particles', icon: <CircleDot size={16} /> },
  { id: 'halftone', label: 'Halftone', icon: <Grid size={16} /> },
  { id: 'ascii', label: 'ASCII', icon: <Type size={16} /> },
  { id: 'ascii-particles', label: 'Flow', icon: <Wind size={16} /> },
  { id: 'matrix-rain', label: 'Matrix', icon: <Binary size={16} /> },
];

export const CameraHUD: React.FC<CameraHUDProps> = ({
  currentMode,
  onModeChange,
  isStreaming,
  onToggleCamera,
  onUploadPhoto,
  onTakeSnapshot,
}) => {
  return (
    <div className="camera-hud-bottom">
      {/* 1. Floating Lens Carousel */}
      <nav className="lens-carousel" aria-label="Visualizer Mode Selection">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={`lens-pill ${currentMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
            title={`Switch to ${mode.label} mode`}
            aria-label={`${mode.label} mode`}
          >
            <span className="lens-icon">{mode.icon}</span>
            <span className="lens-label">{mode.label}</span>
          </button>
        ))}
      </nav>

      {/* 2. Thumb-Friendly Shutter & Quick Camera Action Bar */}
      <div className="shutter-action-row">
        {/* Camera Toggle Button */}
        <button
          className={`hud-thumb-btn ${isStreaming ? 'btn-live' : 'btn-off'}`}
          onClick={onToggleCamera}
          title={isStreaming ? 'Turn Off Webcam' : 'Turn On Webcam'}
          aria-label={isStreaming ? 'Webcam active' : 'Webcam off'}
        >
          {isStreaming ? <Camera size={22} /> : <CameraOff size={22} />}
          <span className="thumb-label">{isStreaming ? 'Live' : 'Off'}</span>
        </button>

        {/* Big Tactile Snapshot Shutter Button */}
        <button
          className="shutter-button"
          onClick={onTakeSnapshot}
          title="Capture Snapshot & ASCII Art"
          aria-label="Capture Snapshot"
        >
          <div className="shutter-inner">
            <Sparkles size={22} className="shutter-icon" />
          </div>
        </button>

        {/* Upload Photo Button */}
        <button
          className="hud-thumb-btn"
          onClick={onUploadPhoto}
          title="Upload Photo or Selfie"
          aria-label="Upload Photo"
        >
          <Upload size={22} />
          <span className="thumb-label">Photo</span>
        </button>
      </div>
    </div>
  );
};
