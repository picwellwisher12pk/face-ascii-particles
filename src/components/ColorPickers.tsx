import React from 'react';
import type { VisualizerConfig } from '../types/visualizer';
import { COLOR_THEMES, BACKGROUND_PRESETS } from '../config/constants';
import { Palette, Eye } from 'lucide-react';

interface ColorPickersProps {
  config: VisualizerConfig;
  onChange: (patch: Partial<VisualizerConfig>) => void;
}

const QUICK_COLORS = [
  '#00ffcc', // Cyber Cyan
  '#00ff66', // Matrix Green
  '#ffb000', // Amber Phosphor
  '#ff007f', // Neon Magenta
  '#38bdf8', // Ice Blue
  '#f97316', // Plasma Orange
  '#a855f7', // Electric Violet
  '#ffffff', // Pure White
];

export const ColorPickers: React.FC<ColorPickersProps> = ({ config, onChange }) => {
  return (
    <div className="control-section">
      <div className="section-title">
        <Palette size={16} className="text-cyan-400" />
        <span>Color & Background Styling</span>
      </div>

      {/* Color Mode Tabs */}
      <div className="mode-segmented-control">
        <button
          className={`segment-btn ${config.colorMode === 'source' ? 'active' : ''}`}
          onClick={() => onChange({ colorMode: 'source' })}
          title="Sample real RGB directly from video pixels"
        >
          <Eye size={14} />
          Webcam RGB
        </button>
        <button
          className={`segment-btn ${config.colorMode === 'custom' ? 'active' : ''}`}
          onClick={() => onChange({ colorMode: 'custom' })}
          title="Use custom single color"
        >
          Custom Color
        </button>
        <button
          className={`segment-btn ${config.colorMode === 'theme' ? 'active' : ''}`}
          onClick={() => onChange({ colorMode: 'theme' })}
          title="Curated gradient themes"
        >
          Preset Themes
        </button>
      </div>

      {/* Custom Character / Particle Color */}
      {config.colorMode === 'custom' && (
        <div className="control-group">
          <label className="control-label">
            <span>Character / Particle Color</span>
            <span className="value-badge">{config.customColor.toUpperCase()}</span>
          </label>
          <div className="color-picker-row">
            <input
              type="color"
              value={config.customColor}
              onChange={(e) => onChange({ customColor: e.target.value })}
              className="native-color-input"
            />
            <div className="color-swatches">
              {QUICK_COLORS.map((hex) => (
                <button
                  key={hex}
                  className={`color-swatch-dot ${config.customColor === hex ? 'active' : ''}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => onChange({ customColor: hex })}
                  title={`Select ${hex}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Curated Themes */}
      {config.colorMode === 'theme' && (
        <div className="control-group">
          <label className="control-label">Select Color Palette</label>
          <div className="theme-grid">
            {COLOR_THEMES.map((theme) => {
              const isSelected = config.selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  className={`theme-card ${isSelected ? 'selected' : ''}`}
                  onClick={() =>
                    onChange({
                      selectedThemeId: theme.id,
                      backgroundColor: theme.background,
                    })
                  }
                >
                  <div className="theme-color-preview">
                    <span
                      className="theme-bar"
                      style={{ backgroundColor: theme.primary }}
                    />
                    {theme.secondary && (
                      <span
                        className="theme-bar"
                        style={{ backgroundColor: theme.secondary }}
                      />
                    )}
                    <span
                      className="theme-bar bg-indicator"
                      style={{ backgroundColor: theme.background }}
                    />
                  </div>
                  <div className="theme-name">{theme.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Background Color Picker */}
      <div className="control-group">
        <label className="control-label">
          <span>Background Canvas Color</span>
          <span className="value-badge">{config.backgroundColor.toUpperCase()}</span>
        </label>
        <div className="color-picker-row">
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="native-color-input"
          />
          <div className="bg-preset-pills">
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={`bg-preset-btn ${config.backgroundColor === preset.value ? 'active' : ''}`}
                onClick={() => onChange({ backgroundColor: preset.value })}
              >
                <span
                  className="preset-preview-square"
                  style={{ backgroundColor: preset.value }}
                />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invert & Glow Toggles */}
      <div className="toggle-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.invert}
            onChange={(e) => onChange({ invert: e.target.checked })}
          />
          <span>Invert Luminance ({config.invert ? 'Light on Dark' : 'Normal'})</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.charGlow}
            onChange={(e) => onChange({ charGlow: e.target.checked })}
          />
          <span>Neon Glow Bloom</span>
        </label>
      </div>
    </div>
  );
};
