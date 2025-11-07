import React, { useRef, useEffect, useState, useCallback } from 'react';
import Button from './Button';
import { blobToBase64 } from '../utils/imageUtils';

interface CameraCaptureProps {
  onImageCapture: (base64: string, mimeType: string) => void;
  onSwitchToUpload: () => void;
  setError: (message: string | null) => void;
}

// Define props interface for SVG icons to accept className
interface SvgIconProps extends React.SVGProps<SVGSVGElement> {}

// Inline SVG Icons
const FlashOnIcon: React.FC<SvgIconProps> = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const FlashAutoIcon: React.FC<SvgIconProps> = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    {/* Small 'A' for auto mode, adjusted position */}
    <text x="1.5" y="21" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="bold" fill="currentColor">A</text>
  </svg>
);

const GalleryIcon: React.FC<SvgIconProps> = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FlipCameraIcon: React.FC<SvgIconProps> = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

const ThreeDotsIcon: React.FC<SvgIconProps> = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

type FlashMode = 'off' | 'on' | 'auto';
type FacingMode = 'user' | 'environment';

const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageCapture, onSwitchToUpload, setError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [isFlashSupported, setIsFlashSupported] = useState(false);
  const [hasFrontCamera, setHasFrontCamera] = useState(false);
  const [hasRearCamera, setHasRearCamera] = useState(false);

  const getCameraConstraints = useCallback((currentFacingMode: FacingMode) => {
    return {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1920 }, // Request high resolution
        height: { ideal: 1080 },
      },
      audio: false,
    };
  }, []);

  const startCamera = useCallback(async (desiredFacingMode: FacingMode) => {
    setError(null);
    setCapturedImage(null);
    setIsProcessing(true);
    setIsCameraReady(false); // Reset camera ready state

    // Stop any existing tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = getCameraConstraints(desiredFacingMode);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

      // Check for flash (torch) support
      const supportTorch = 'torch' in capabilities && capabilities.torch;
      setIsFlashSupported(!!supportTorch);

      // Apply initial flash mode if supported
      if (supportTorch && flashMode === 'on') {
        await videoTrack.applyConstraints({ advanced: [{ torch: true }] });
      } else if (supportTorch && (flashMode === 'off' || flashMode === 'auto')) { // 'off' or 'auto' means torch off for now
        await videoTrack.applyConstraints({ advanced: [{ torch: false }] });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
      }
      setFacingMode(desiredFacingMode);

    } catch (err: unknown) {
      console.error('Error accessing camera:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No camera found or available.');
      }
      else {
        setError('Could not access camera. Please ensure it is available and not in use.');
      }
      setIsCameraReady(false);
      onSwitchToUpload(); // Fallback to upload if camera fails
    } finally {
      setIsProcessing(false);
    }
  }, [setError, onSwitchToUpload, getCameraConstraints, flashMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  useEffect(() => {
    // Initial camera check and start
    const initializeCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        const frontCamera = videoInputDevices.some(device => device.label.toLowerCase().includes('front') || device.label === '');
        const rearCamera = videoInputDevices.some(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment') || device.label === '');

        setHasFrontCamera(frontCamera);
        setHasRearCamera(rearCamera);

        // Prefer rear camera if available
        const initialFacingMode: FacingMode = rearCamera ? 'environment' : (frontCamera ? 'user' : 'environment');
        
        // Request initial camera permissions and start stream
        await startCamera(initialFacingMode);

      } catch (error) {
        console.error("Error enumerating devices:", error);
        setError("Could not enumerate camera devices. Please check permissions.");
        onSwitchToUpload(); // Fallback
      }
    };
    initializeCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, onSwitchToUpload, setError]); // Re-run effect if start/stop camera changes


  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Draw the image potentially mirrored if front camera
        context.save();
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();

        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const base64 = await blobToBase64(blob);
              setCapturedImage(base64);
              stopCamera(); // Pause camera feed after capture
            } catch (e: unknown) {
              if (e instanceof Error) {
                setError(`Failed to process image: ${e.message}`);
              } else {
                setError('An unknown error occurred during image processing.');
              }
            } finally {
              setIsProcessing(false);
            }
          } else {
            setError('Failed to create image blob.');
            setIsProcessing(false);
          }
        }, 'image/jpeg', 0.9); // JPEG format, 90% quality
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode); // Restart camera with current facing mode
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onImageCapture(capturedImage, 'image/jpeg');
    }
  };

  const toggleFlash = useCallback(async () => {
    if (!isFlashSupported || !streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    let newFlashMode: FlashMode;
    switch (flashMode) {
      case 'off': newFlashMode = 'on'; break;
      case 'on': newFlashMode = 'auto'; break;
      case 'auto': newFlashMode = 'off'; break;
    }
    setFlashMode(newFlashMode);

    try {
      if (newFlashMode === 'on') {
        await videoTrack.applyConstraints({ advanced: [{ torch: true }] });
      } else { // 'off' or 'auto' means torch off for now
        await videoTrack.applyConstraints({ advanced: [{ torch: false }] });
      }
    } catch (e) {
      console.error("Failed to toggle flash:", e);
      setError("Failed to control camera flash.");
    }
  }, [flashMode, isFlashSupported, setError]);

  const toggleFacingMode = useCallback(async () => {
    const newFacingMode: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newFacingMode);
  }, [facingMode, startCamera]);


  return (
    <div className="relative w-screen h-screen bg-black flex flex-col justify-center items-center overflow-hidden">
      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-end items-center z-20 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
        {/* Right controls */}
        <div className="flex items-center space-x-2"> {/* Reduced space-x for tighter grouping like reference */}
          {/* Moon Icon - Placeholder for now (no functionality) */}
          <button
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Night mode toggle"
              disabled={isProcessing || !isCameraReady}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
          </button>

          {isFlashSupported && (
            <button
                onClick={toggleFlash}
                className={`px-3 py-1 rounded-full ${flashMode !== 'off' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'} hover:bg-white/20 transition-colors flex items-center justify-center gap-1`}
                aria-label={`Flash mode: ${flashMode}`}
                disabled={isProcessing || !isCameraReady}
            >
                {flashMode === 'auto' ? (
                    <FlashAutoIcon className="text-black" /> // Auto icon with 'A'
                ) : (
                    <FlashOnIcon className={flashMode === 'on' ? 'text-black' : 'text-white'} /> // Regular lightning icon
                )}
            </button>
          )}

          <button
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="More options"
              disabled={isProcessing || !isCameraReady}
          >
              <ThreeDotsIcon />
          </button>
        </div>
      </div>

      {/* Camera Feed / Captured Image */}
      {capturedImage ? (
        <img src={`data:image/jpeg;base64,${capturedImage}`} alt="Captured" className="object-contain w-full h-full" />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`object-cover w-full h-full ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
          ></video>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {/* Camera Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-20">
        {!isCameraReady && !isProcessing && !capturedImage && (
          <p className="text-white text-lg animate-pulse">Waiting for camera access...</p>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center text-white">
            <svg className="animate-spin h-10 w-10 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-200 font-medium">Processing...</p>
          </div>
        )}

        {capturedImage ? (
          <div className="flex space-x-4 w-full max-w-sm">
            <Button onClick={handleRetake} fullWidth variant="secondary">
              Retake
            </Button>
            <Button onClick={handleUsePhoto} fullWidth variant="primary">
              Use Photo
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between w-full max-w-lg mb-2">
              {/* Left: Thumbnail/Gallery (for upload) */}
              <button
                onClick={onSwitchToUpload}
                className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center border-2 border-white/30"
                aria-label="View gallery"
                disabled={isProcessing}
              >
                {capturedImage ? (
                  <img src={`data:image/jpeg;base64,${capturedImage}`} alt="Last capture thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <GalleryIcon className="w-8 h-8 text-white" />
                )}
              </button>

              {/* Center: Shutter Button */}
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
                disabled={!isCameraReady || isProcessing || capturedImage !== null}
                aria-label="Take Photo"
              >
              </button>

              {/* Right: Flip Camera */}
              {(hasFrontCamera && hasRearCamera && !isProcessing) && (
                <button
                  onClick={toggleFacingMode}
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  aria-label="Flip camera"
                  disabled={isProcessing || !isCameraReady}
                >
                  <FlipCameraIcon className="w-8 h-8 text-white" />
                </button>
              )}
            </div>

            {/* Photo Mode Indicator (Simplified) */}
            <div className="flex bg-white/20 backdrop-blur-sm rounded-full p-1 text-sm font-semibold mt-4">
                <span className="px-4 py-2 text-white bg-white/30 rounded-full" aria-current="page" aria-label="Photo mode selected">PHOTO</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;