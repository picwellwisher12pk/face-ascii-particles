import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebcam } from './hooks/useWebcam';
import type { VisualizerConfig, StreamStats, RenderMode } from './types/visualizer';
import { DEFAULT_CONFIG } from './config/constants';
import { PixelSampler } from './engine/pixelSampler';
import { ParticleEngine } from './engine/particleEngine';
import { CanvasRenderer } from './engine/canvasRenderer';
import { AsciiRenderer } from './engine/asciiRenderer';
import { WebGLParticleEngine } from './engine/webglEngine';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { DiagnosticsBar } from './components/DiagnosticsBar';
import { PermissionsModal } from './components/Modals/PermissionsModal';
import { SnapshotModal } from './components/Modals/SnapshotModal';
import { InfoModal } from './components/Modals/InfoModal';
import { Camera, AlertCircle, RefreshCw, Upload } from 'lucide-react';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);

  // Engines
  const pixelSamplerRef = useRef<PixelSampler>(new PixelSampler());
  const particleEngineRef = useRef<ParticleEngine>(new ParticleEngine());
  const webglEngineRef = useRef<WebGLParticleEngine | null>(null);

  // Webcam Hook
  const {
    videoRef,
    status: cameraStatus,
    errorMessage,
    devices,
    selectedDeviceId,
    resolution,
    startCamera,
    stopCamera,
    switchDevice,
  } = useWebcam();

  // App State
  const [config, setConfig] = useState<VisualizerConfig>(DEFAULT_CONFIG);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals state
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [snapshotData, setSnapshotData] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    asciiText: string;
  }>({
    isOpen: false,
    imageUrl: null,
    asciiText: '',
  });

  // Telemetry & FPS
  const [stats, setStats] = useState<StreamStats>({
    fps: 0,
    width: 0,
    height: 0,
    activeElements: 0,
    isStreaming: false,
    deviceName: '',
  });

  // Mouse interaction coordinates
  const mouseCoords = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  // Update config patch helper
  const handleConfigChange = (patch: Partial<VisualizerConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleModeChange = (mode: RenderMode) => {
    handleConfigChange({ mode });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  // Canvas size sync
  const updateCanvasDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      canvasRef.current.style.width = `${rect.width}px`;
      canvasRef.current.style.height = `${rect.height}px`;
    }

    if (webglCanvasRef.current) {
      webglCanvasRef.current.width = width;
      webglCanvasRef.current.height = height;
      webglCanvasRef.current.style.width = `${rect.width}px`;
      webglCanvasRef.current.style.height = `${rect.height}px`;

      if (!webglEngineRef.current) {
        webglEngineRef.current = new WebGLParticleEngine(webglCanvasRef.current);
      }
      webglEngineRef.current.updateGrid(width, height, config.samplingDensity);
    }
  }, [config.samplingDensity]);

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [updateCanvasDimensions]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Pointer event listeners for interactive physics
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const activeCanvas = config.engineType === 'webgl' ? webglCanvasRef.current : canvasRef.current;
    if (!activeCanvas) return;
    const rect = activeCanvas.getBoundingClientRect();
    const scaleX = activeCanvas.width / rect.width;
    const scaleY = activeCanvas.height / rect.height;

    mouseCoords.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerLeave = () => {
    mouseCoords.current = { x: null, y: null };
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        uploadedImageRef.current = img;
        setHasUploadedImage(true);
        setStats((prev) => ({
          ...prev,
          width: img.naturalWidth,
          height: img.naturalHeight,
          isStreaming: true,
        }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Snapshot generation
  const handleTakeSnapshot = () => {
    const activeCanvas = config.engineType === 'webgl' ? webglCanvasRef.current : canvasRef.current;
    const video = videoRef.current;
    const source = (video && cameraStatus === 'active') ? video : uploadedImageRef.current;
    if (!activeCanvas) return;

    const dataUrl = activeCanvas.toDataURL('image/png');
    let asciiText = '';

    if (source) {
      const sampled = pixelSamplerRef.current.sampleFrame(
        source,
        activeCanvas.width,
        activeCanvas.height,
        config
      );
      asciiText = AsciiRenderer.generateAsciiText(
        sampled.points,
        activeCanvas.width,
        config.samplingDensity,
        config.asciiCharset
      );
    }

    setSnapshotData({
      isOpen: true,
      imageUrl: dataUrl,
      asciiText,
    });
  };

  // Main Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const loop = (now: number) => {
      animationFrameId = requestAnimationFrame(loop);

      // Calculate FPS
      frameCount++;
      if (now - lastFpsUpdate >= 500) {
        const measuredFps = (frameCount * 1000) / (now - lastFpsUpdate);
        lastFpsUpdate = now;
        frameCount = 0;

        const activeW = cameraStatus === 'active' ? resolution.width : (uploadedImageRef.current?.naturalWidth || 0);
        const activeH = cameraStatus === 'active' ? resolution.height : (uploadedImageRef.current?.naturalHeight || 0);

        setStats((prev) => ({
          ...prev,
          fps: measuredFps,
          width: activeW,
          height: activeH,
          isStreaming: cameraStatus === 'active' || hasUploadedImage,
        }));
      }

      const video = videoRef.current;
      const activeSource = (video && cameraStatus === 'active' && video.readyState >= 2)
        ? video
        : uploadedImageRef.current;

      if (activeSource) {
        if (config.engineType === 'webgl' && webglCanvasRef.current && webglEngineRef.current) {
          // Hardware-accelerated GPU WebGL shader rendering
          const gpuCount = webglEngineRef.current.render(
            activeSource,
            webglCanvasRef.current.width,
            webglCanvasRef.current.height,
            mouseCoords.current.x,
            mouseCoords.current.y,
            config
          );

          setStats((prev) => ({
            ...prev,
            activeElements: gpuCount,
          }));
        } else if (canvasRef.current) {
          // Canvas 2D CPU rendering
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const sampleResult = pixelSamplerRef.current.sampleFrame(
              activeSource,
              canvas.width,
              canvas.height,
              config
            );

            const particles = particleEngineRef.current.updateParticles(
              sampleResult.points,
              mouseCoords.current.x,
              mouseCoords.current.y,
              config
            );

            CanvasRenderer.render(
              ctx,
              canvas.width,
              canvas.height,
              sampleResult.points,
              particles,
              config
            );

            setStats((prev) => ({
              ...prev,
              activeElements: sampleResult.activeCount,
            }));
          }
        }
      } else {
        // Draw empty standby background
        if (config.engineType === 'canvas2d' && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.fillStyle = config.backgroundColor;
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      }
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [config, cameraStatus, resolution, hasUploadedImage]);

  return (
    <div className="app-container" style={{ backgroundColor: config.backgroundColor }}>
      {/* Top Navigation */}
      <Header
        currentMode={config.mode}
        onModeChange={handleModeChange}
        isStreaming={cameraStatus === 'active'}
        onToggleCamera={() => {
          if (cameraStatus === 'active') {
            stopCamera();
          } else {
            startCamera();
          }
        }}
        onUploadPhoto={() => fileInputRef.current?.click()}
        onTakeSnapshot={handleTakeSnapshot}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        isControlsOpen={isControlsOpen}
        onToggleControls={() => setIsControlsOpen((prev) => !prev)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Hidden File Input for Real Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Main Workspace */}
      <main className="main-workspace" ref={containerRef}>
        <canvas
          ref={webglCanvasRef}
          className="visualizer-canvas"
          style={{ display: config.engineType === 'webgl' ? 'block' : 'none' }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        />
        <canvas
          ref={canvasRef}
          className="visualizer-canvas"
          style={{ display: config.engineType === 'canvas2d' ? 'block' : 'none' }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        />

        {/* Camera Permission / Standby Overlay */}
        {cameraStatus !== 'active' && !hasUploadedImage && (
          <div className="camera-standby-overlay">
            <div className="standby-card">
              {cameraStatus === 'requesting' ? (
                <>
                  <div className="spinner" />
                  <h3>Requesting Camera Access...</h3>
                  <p>Please grant webcam permission in your browser prompt.</p>
                </>
              ) : cameraStatus === 'denied' || cameraStatus === 'error' ? (
                <>
                  <AlertCircle size={44} className="text-amber-400" />
                  <h3>Camera Unavailable</h3>
                  <p className="text-sm text-slate-300">
                    {errorMessage || 'The webcam is currently locked by another application or Chrome tab.'}
                  </p>
                  <div className="standby-buttons-col mt-4">
                    <button
                      className="btn-primary w-full"
                      onClick={() => startCamera()}
                    >
                      <RefreshCw size={16} />
                      Retry Camera Connection
                    </button>
                    <button
                      className="btn-secondary w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={16} />
                      Or Upload Photo / Selfie
                    </button>
                    <button
                      className="btn-secondary w-full"
                      onClick={() => setIsPermissionsModalOpen(true)}
                    >
                      Permissions Diagnostics
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Camera size={44} className="text-cyan-400 opacity-80" />
                  <h3>Camera Standby</h3>
                  <p>Enable your webcam or upload a photo to transform facial contours into dynamic particles & ASCII.</p>
                  <div className="standby-buttons-col mt-4">
                    <button className="btn-primary w-full" onClick={() => startCamera()}>
                      Start Webcam
                    </button>
                    <button className="btn-secondary w-full" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={16} />
                      Upload Photo / Selfie
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Control Drawer */}
        <ControlPanel
          config={config}
          onChange={handleConfigChange}
          onReset={handleReset}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={switchDevice}
          isOpen={isControlsOpen}
          onClose={() => setIsControlsOpen(false)}
        />
      </main>

      {/* Bottom Telemetry Bar */}
      <DiagnosticsBar stats={stats} config={config} />

      {/* App Modals */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        onRetry={() => startCamera()}
        errorMessage={errorMessage}
      />

      <SnapshotModal
        isOpen={snapshotData.isOpen}
        onClose={() => setSnapshotData((prev) => ({ ...prev, isOpen: false }))}
        imageDataUrl={snapshotData.imageUrl}
        asciiText={snapshotData.asciiText}
      />

      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
    </div>
  );
};

export default App;
