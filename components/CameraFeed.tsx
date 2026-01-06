import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, AlertCircle, Maximize2 } from 'lucide-react';

const CameraFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Attempt to get camera with ideal resolution. 
        // Removed facingMode: "environment" as it can cause "device not found" on non-mobile devices (like RPi + USB Cam).
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (mounted) {
          activeStream = mediaStream;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setError(null);
        } else {
          // Component unmounted during await
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.warn("High-res camera access failed, retrying with basic constraints...", err);
        
        if (mounted) {
          try {
            // Fallback: Try any available video device
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });

            if (mounted) {
              activeStream = fallbackStream;
              setStream(fallbackStream);
              if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream;
              }
              setError(null);
            } else {
              fallbackStream.getTracks().forEach(track => track.stop());
            }
          } catch (fallbackErr) {
            console.error("Camera Access Error:", fallbackErr);
            // This error often means no camera device is plugged in or permissions are blocked
            setError("Camera device not found. Please check connection and permissions.");
          }
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full aspect-video'}`}>
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center space-x-2">
            <span className="animate-pulse w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-red-500 font-bold text-sm tracking-wider">LIVE REC</span>
          </div>
          <p className="text-xs text-slate-300 font-mono mt-1">CAM-01 [JVCU100]</p>
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

      {/* Video / Placeholder */}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900">
          <CameraOff className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium text-center px-4">{error}</p>
          <p className="text-sm mt-2 opacity-60">Displaying simulation mode (if available)</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}

      {/* Crosshair / HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute center top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 border border-white/50 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 bg-white/50 rounded-full"></div>
        
        {/* Corner Brackets */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg"></div>
      </div>

    </div>
  );
};

export default CameraFeed;