import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorMessage?: string | null;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  errorMessage,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Camera Access Required"
      icon={<ShieldAlert size={20} className="text-amber-400" />}
    >
      <div className="permission-modal-content">
        <p className="modal-description">
          This visualizer converts your real facial feed into dynamic particles and ASCII glyphs in real-time.
          To begin, your browser needs permission to access your webcam.
        </p>

        {errorMessage && (
          <div className="permission-error-box">
            <strong>System Diagnostic:</strong> {errorMessage}
          </div>
        )}

        <div className="permission-instructions">
          <h4>How to grant access:</h4>
          <ol>
            <li>Click the camera icon or padlock in your browser address bar.</li>
            <li>Select <strong>Allow</strong> for Camera access.</li>
            <li>Click the retry button below to initialize the visualizer feed.</li>
          </ol>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onRetry();
              onClose();
            }}
          >
            <RefreshCw size={16} />
            Request Camera Access
          </button>
        </div>
      </div>
    </Modal>
  );
};
