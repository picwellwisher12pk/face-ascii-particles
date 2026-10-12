import { useState, useEffect, useRef, useCallback } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Enumerate video devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Unable to enumerate camera devices', err);
    }
  }, [selectedDeviceId]);

  // Start webcam stream
  const startCamera = useCallback(
    async (deviceId?: string) => {
      setStatus('requesting');
      setErrorMessage(null);

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      try {
        const targetDeviceId = deviceId || selectedDeviceId;
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: targetDeviceId
            ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setResolution({
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          });
        }

        setStatus('active');
        await updateDeviceList();
      } catch (err: unknown) {
        console.error('Camera access error:', err);
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setStatus('denied');
          setErrorMessage('Camera access was denied by browser permissions.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setStatus('error');
          setErrorMessage('No camera hardware was detected on this device.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError' || error.message?.includes('Device in use')) {
          setStatus('error');
          setErrorMessage('The webcam is currently in use by another Chrome tab or application. Please close any tabs or apps using the camera and click Retry.');
        } else {
          setStatus('error');
          setErrorMessage(error.message || 'Failed to start camera feed.');
        }
      }
    },
    [selectedDeviceId, updateDeviceList]
  );

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
    setResolution({ width: 0, height: 0 });
  }, []);

  // Switch camera device
  const switchDevice = useCallback(
    async (newDeviceId: string) => {
      setSelectedDeviceId(newDeviceId);
      if (status === 'active') {
        await startCamera(newDeviceId);
      }
    },
    [status, startCamera]
  );

  useEffect(() => {
    // Create hidden video element
    const video = document.createElement('video');
    video.playsInline = true;
    video.muted = true;
    video.autoplay = true;

    const onLoadedMetadata = () => {
      setResolution({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    videoRef.current = video;

    // Auto-request camera on mount
    startCamera();

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    status,
    errorMessage,
    devices,
    selectedDeviceId,
    resolution,
    startCamera,
    stopCamera,
    switchDevice,
  };
}
