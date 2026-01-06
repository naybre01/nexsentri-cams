import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Maximize2, RefreshCw, Radio, Network } from 'lucide-react';
import { CameraConfig } from '../types';

interface CameraFeedProps {
  config: CameraConfig;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ config }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Clean up function for local stream
  const stopLocalStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    stopLocalStream();
    setError(null);

    const startCamera = async () => {
      // MODE: HTTP Stream (Node-RED/Frigate)
      if (config.mode === 'stream') {
        // For MJPEG streams, we just let the <img> tag handle connection.
        // We clear error initially. The img onError handler will set it if needed.
        return;
      }

      // MODE: Local Hardware
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (mounted) setError("Camera API not available. Browser must be HTTPS or localhost.");
        return;
      }

      try {
        // Enumerate to see if device exists
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
            console.warn("No video devices listed via enumerateDevices.");
        }

        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user' 
          },
          audio: false
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (mounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setError(null);
        } else {
          mediaStream.getTracks().forEach(track => track.stop());
        }

      } catch (err: any) {
        console.warn("Camera access failed:", err);
        if (mounted) {
            // Provide specific helpful messages
            let msg = "Connection failed.";
            if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
              msg = "Device busy (likely used by Frigate). Switch to Stream Mode in settings.";
            } else if (err.message && err.message.includes('Requested device not found')) {
               msg = "Device not found. Is it plugged in? Or switch to Stream Mode.";
            } else if (err.name === 'NotAllowedError') {
              msg = "Permission denied.";
            }
            setError(msg);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      stopLocalStream();
    };
  }, [config.mode, config.streamUrl, retryCount]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  const handleRetry = () => setRetryCount(prev => prev + 1);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full aspect-video'}`}>
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-red-500 animate-pulse'}`}></span>
            <span className="text-red-500 font-bold text-sm tracking-wider">
              {config.mode === 'stream' ? 'NET FEED' : 'LOCAL REC'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1 flex items-center gap-1">
            {config.mode === 'stream' ? <Network className="w-3 h-3"/> : <Camera className="w-3 h-3"/>}
            {config.mode === 'stream' ? 'Node-RED/MQTT' : 'CAM-01 [JVCU100]'}
          </p>
        </div>
        
        <div className="flex space-x-2 pointer-events-auto">
           <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700 text-white backdrop-blur-sm transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900 z-0 p-6 text-center">
          <CameraOff className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-red-400 mb-2">{error}</p>
          <p className="text-sm text-slate-400 max-w-md">
            {config.mode === 'local' 
             ? "Since you are using Frigate, the camera is likely locked. Go to Settings and switch to 'Stream Mode'." 
             : `Ensure Node-RED is serving MJPEG at ${config.streamUrl}`}
          </p>
          <button 
            onClick={handleRetry}
            className="mt-6 flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      ) : (
        <>
          {config.mode === 'stream' ? (
             /* MJPEG / Image Stream Mode */
             <img 
               src={config.streamUrl}
               className="w-full h-full object-contain"
               alt="Live Stream"
               onError={() => setError(`Failed to load stream from ${config.streamUrl}`)}
             />
          ) : (
             /* Local Webcam Mode */
             <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
             />
          )}
        </>
      )}

      {/* Crosshair / HUD Overlay - Only show if no error */}
      {!error && (
        <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute center top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 border border-white/50 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 bg-white/50 rounded-full"></div>
            
            {/* Corner Brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg"></div>
        </div>
      )}

    </div>
  );
};

export default CameraFeed;