import React, { useState } from 'react';
import { Download, Copy, Check, Image as ImageIcon, FileText } from 'lucide-react';
import { Modal } from './Modal';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string | null;
  asciiText: string;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  imageDataUrl,
  asciiText,
}) => {
  const [copied, setCopied] = useState(false);

  const handleDownloadPng = () => {
    if (!imageDataUrl) return;
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = `face-art-${Date.now()}.png`;
    a.click();
  };

  const handleDownloadAscii = () => {
    if (!asciiText) return;
    const blob = new Blob([asciiText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `face-ascii-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAscii = async () => {
    if (!asciiText) return;
    try {
      await navigator.clipboard.writeText(asciiText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy ASCII art', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Snapshot Export"
      icon={<ImageIcon size={20} className="text-cyan-400" />}
      maxWidth="680px"
    >
      <div className="snapshot-modal-content">
        {imageDataUrl ? (
          <div className="snapshot-preview-container">
            <img
              src={imageDataUrl}
              alt="Face art capture"
              className="snapshot-preview-image"
            />
          </div>
        ) : (
          <div className="snapshot-empty-state">No image snapshot available</div>
        )}

        <div className="snapshot-actions-row">
          <button className="btn-primary" onClick={handleDownloadPng}>
            <Download size={16} />
            Download High-Res PNG
          </button>

          {asciiText && (
            <>
              <button className="btn-secondary" onClick={handleDownloadAscii}>
                <FileText size={16} />
                Download ASCII (.txt)
              </button>

              <button className="btn-secondary" onClick={handleCopyAscii}>
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                {copied ? 'Copied ASCII to Clipboard!' : 'Copy ASCII Text'}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
