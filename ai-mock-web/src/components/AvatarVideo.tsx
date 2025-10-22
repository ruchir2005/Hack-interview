"use client";

import { useEffect, useState, useRef } from "react";
import { User } from "lucide-react";

interface AvatarVideoProps {
  isSpeaking?: boolean;
  videoUrl?: string; // Optional video URL for avatar
  onEnded?: () => void; // Callback when video ends
}

export default function AvatarVideo({ isSpeaking = false, videoUrl, onEnded }: AvatarVideoProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setPulseAnimation(isSpeaking);
  }, [isSpeaking]);

  // Auto-play video when component mounts
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch(err => {
        console.log("Video autoplay prevented:", err);
      });
    }
  }, [videoUrl]);

  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg overflow-hidden border border-white/20">
      {videoUrl ? (
        // Video avatar
        <video
          ref={videoRef}
          src={videoUrl}
          loop={false}
          muted
          playsInline
          onEnded={onEnded}
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        // Fallback to animated avatar
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`relative ${
              pulseAnimation ? "animate-pulse" : ""
            }`}
          >
            {/* Avatar circle */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
              <User className="w-12 h-12 text-white" />
            </div>
            
            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1 h-6 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1 h-4 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interviewer label */}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 rounded-full text-white text-xs font-medium">
        AI Interviewer
      </div>

      {/* Status indicator */}
      {isSpeaking && (
        <div className="absolute top-3 right-3 flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-300 text-xs font-medium">Speaking</span>
        </div>
      )}
    </div>
  );
}
