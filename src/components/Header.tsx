import React from 'react';
import { HelpCircle, Sliders, Maximize2, Minimize2 } from 'lucide-react';
import { APP_VERSION } from '../version';

interface HeaderProps {
  onOpenInfo: () => void;
  isControlsOpen: boolean;
  onToggleControls: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  zoom?: number;
  onResetZoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInfo,
  isControlsOpen,
  onToggleControls,
  isFullscreen,
  onToggleFullscreen,
  zoom = 1.0,
  onResetZoom,
}) => {
  return (
    <header className="hud-top-bar" aria-label="Application Top Bar">
      {/* Brand & Version Badge */}
      <div className="hud-brand-pill">
        <span className="logo-pulse" />
        <span className="app-title">FACE ART</span>
        <span className="version-pill">v{APP_VERSION}</span>
        {zoom > 1.05 && (
          <button
            className="hud-zoom-badge"
            onClick={onResetZoom}
            title="Pinch to zoom active. Tap to reset to 1.0x"
            aria-label={`Current Zoom ${zoom.toFixed(1)}x. Tap to reset.`}
          >
            {zoom.toFixed(1)}x ↺
          </button>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="hud-top-actions">
        {/* Fullscreen button (desktop) */}
        <button
          className="hud-circle-btn desktop-only"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Studio Drawer / Bottom Sheet Toggle */}
        <button
          className={`hud-studio-pill ${isControlsOpen ? 'active' : ''}`}
          onClick={onToggleControls}
          title="Open Visualizer Studio"
          aria-label="Studio Controls"
        >
          <Sliders size={16} />
          <span className="studio-label">Studio</span>
        </button>

        {/* Info & Guide */}
        <button
          className="hud-circle-btn"
          onClick={onOpenInfo}
          title="User Guide & Tips"
          aria-label="Help Guide"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
