import React from 'react';
import { Info, Sparkles, Terminal, Cpu, MousePointer } from 'lucide-react';
import { Modal } from './Modal';
import { APP_VERSION } from '../../version';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Face Art Visualizer v${APP_VERSION}`}
      icon={<Info size={20} className="text-cyan-400" />}
      maxWidth="600px"
    >
      <div className="info-modal-content">
        <p className="info-intro">
          A real-time biometric visualizer that transforms live webcam facial feeds into interactive
          physics-driven particles and ASCII typography.
        </p>

        <div className="info-feature-grid">
          <div className="info-card">
            <div className="info-card-header">
              <Sparkles size={18} className="text-cyan-400" />
              <h4>Particle Physics</h4>
            </div>
            <p>
              Particles sample real video pixel colors and luminance. Move your mouse across the canvas
              to disperse particles with spring restitution returning them to your face.
            </p>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <Terminal size={18} className="text-emerald-400" />
              <h4>ASCII Typography</h4>
            </div>
            <p>
              Converts pixel density into monospace ASCII glyphs. Switch between classic, cyberpunk hex,
              dense blocks, or custom user strings.
            </p>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <MousePointer size={18} className="text-pink-400" />
              <h4>Interactive Modes</h4>
            </div>
            <p>
              Explore Particles, Classic ASCII, Floating ASCII Particles, Halftone optical dots, and
              Matrix rain. Customize both foreground glyph and background void colors.
            </p>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <Cpu size={18} className="text-amber-400" />
              <h4>Authentic Compute</h4>
            </div>
            <p>
              100% genuine dynamic computation calculated on-device from your live webcam video buffer.
              No static demo presets or fake coordinates.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Got it, Let's Create!
          </button>
        </div>
      </div>
    </Modal>
  );
};
