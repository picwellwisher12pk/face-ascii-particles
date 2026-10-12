import React from 'react';
import { Camera, CameraOff, Camera as CameraIcon, Upload, HelpCircle, Sliders, Maximize2, Minimize2 } from 'lucide-react';
import type { RenderMode } from '../types/visualizer';
import { APP_VERSION } from '../version';

interface HeaderProps {
  currentMode: RenderMode;
  onModeChange: (mode: RenderMode) => void;
  isStreaming: boolean;
  onToggleCamera: () => void;
  onUploadPhoto: () => void;
  onTakeSnapshot: () => void;
  onOpenInfo: () => void;
  isControlsOpen: boolean;
  onToggleControls: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const MODES: { id: RenderMode; label: string }[] = [
  { id: 'particles', label: 'Particles' },
  { id: 'halftone', label: 'Halftone' },
  { id: 'ascii', label: 'ASCII' },
  { id: 'ascii-particles', label: 'Flow' },
  { id: 'matrix-rain', label: 'Matrix' },
];

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  isStreaming,
  onToggleCamera,
  onUploadPhoto,
  onTakeSnapshot,
  onOpenInfo,
  isControlsOpen,
  onToggleControls,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="app-header">
      {/* Brand & Version */}
      <div className="header-brand-wrap">
        <div className="logo-badge">
          <span className="logo-pulse" />
          <h1 className="app-title">FACE ART</h1>
          <span className="version-pill">v{APP_VERSION}</span>
        </div>
      </div>

      {/* Mode Pills - touch friendly, scrollable on mobile */}
      <nav className="mode-toggle-group" aria-label="Visualizer Mode Selection">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={`mode-btn ${currentMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
            title={`${mode.label} visualizer mode`}
          >
            {mode.label}
          </button>
        ))}
      </nav>

      {/* Action Controls Toolbar */}
      <div className="header-actions">
        {/* Upload Photo Button */}
        <button
          className="action-icon-btn"
          onClick={onUploadPhoto}
          title="Upload photo / selfie"
          aria-label="Upload photo"
        >
          <Upload size={17} />
        </button>

        {/* Live Camera Toggle */}
        <button
          className={`action-btn-compact ${isStreaming ? 'btn-active' : 'btn-warn'}`}
          onClick={onToggleCamera}
          title={isStreaming ? 'Stop Camera' : 'Start Camera'}
          aria-label={isStreaming ? 'Stop Camera' : 'Start Camera'}
        >
          {isStreaming ? <Camera size={16} /> : <CameraOff size={16} />}
          <span className="compact-label">{isStreaming ? 'Live' : 'Off'}</span>
        </button>

        {/* Snapshot Capture */}
        <button
          className="action-btn-compact btn-highlight"
          onClick={onTakeSnapshot}
          title="Take Snapshot"
          aria-label="Take Snapshot"
        >
          <CameraIcon size={16} />
          <span className="compact-label">Snap</span>
        </button>

        {/* Fullscreen (desktop & supported mobile) */}
        <button
          className="action-icon-btn desktop-only"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          aria-label="Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Studio / Controls Toggle Pill */}
        <button
          className={`action-btn-compact ${isControlsOpen ? 'btn-studio-active' : 'btn-studio'}`}
          onClick={onToggleControls}
          title="Toggle Studio Controls"
          aria-label="Toggle Controls"
        >
          <Sliders size={16} />
          <span className="compact-label">Studio</span>
        </button>

        {/* Help & Info */}
        <button
          className="action-icon-btn"
          onClick={onOpenInfo}
          title="Help & Shortcuts"
          aria-label="Info and Help"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
