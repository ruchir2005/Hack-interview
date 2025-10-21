"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";

export default function UserVideoFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEnabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied");
      setIsEnabled(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-white/20">
      {isEnabled && !error ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
          <CameraOff className="w-12 h-12 mb-2" />
          <p className="text-sm">{error || "Camera Off"}</p>
        </div>
      )}
      
      {/* Camera toggle button */}
      <button
        onClick={toggleCamera}
        className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        title={isEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isEnabled ? (
          <Camera className="w-5 h-5 text-white" />
        ) : (
          <CameraOff className="w-5 h-5 text-white" />
        )}
      </button>

      {/* User label */}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 rounded-full text-white text-xs font-medium">
        You
      </div>
    </div>
  );
}
