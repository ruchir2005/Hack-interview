"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, AlertCircle, CheckCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface BehaviorFeedback {
  presence: boolean;
  eye_contact: string;
  confidence_score: number;
  posture: {
    slouch_angle: number;
    is_good: boolean;
  };
  head_pose: {
    yaw: number;
    pitch: number;
  };
  feedback: string[];
  overall: string;
  timestamp: number;
}

interface BehaviorMonitorProps {
  sessionId?: string;
  isActive?: boolean;
  onFeedbackUpdate?: (feedback: BehaviorFeedback) => void;
}

export default function BehaviorMonitor({ 
  sessionId, 
  isActive = true,
  onFeedbackUpdate 
}: BehaviorMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [feedback, setFeedback] = useState<BehaviorFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start webcam
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsInitializing(false);
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Unable to access webcam. Please grant camera permission.");
        setIsInitializing(false);
      }
    };

    if (isActive) {
      startWebcam();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  // Capture and analyze frames
  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    const analyzeFrame = async () => {
      if (isAnalyzing || !videoRef.current || !canvasRef.current) return;

      setIsAnalyzing(true);
      
      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);

        const response = await fetch(`${API_BASE}/api/analyze-behavior`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageData,
            sessionId: sessionId
          }),
        });

        if (!response.ok) {
          throw new Error("Analysis failed");
        }

        const data: BehaviorFeedback = await response.json();
        setFeedback(data);
        setError(null);
        
        if (onFeedbackUpdate) {
          onFeedbackUpdate(data);
        }
      } catch (err) {
        console.error("Error analyzing frame:", err);
        setError("Analysis error");
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Analyze every 2 seconds
    intervalRef.current = setInterval(analyzeFrame, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, sessionId, isAnalyzing, onFeedbackUpdate]);

  if (!isActive) {
    return (
      <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
        <p className="text-sm text-gray-400">Behavior monitoring inactive</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden video and canvas for capture */}
      <div className="hidden">
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>

      {/* Initializing State */}
      {isInitializing && !error && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <div>
              <p className="text-sm text-blue-300 font-medium">Initializing camera...</p>
              <p className="text-xs text-blue-200/70">Please grant camera permission</p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Display */}
      <AnimatePresence mode="wait">
        {!isInitializing && feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg glass-effect border border-blue-500/30"
          >
            {/* Header with confidence score */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Behavior Analysis
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Confidence:</span>
                <div className="flex items-center gap-1">
                  <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        feedback.confidence_score >= 70
                          ? "bg-green-500"
                          : feedback.confidence_score >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${feedback.confidence_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white">
                    {feedback.confidence_score}%
                  </span>
                </div>
              </div>
            </div>

            {/* Overall feedback */}
            <div className="mb-3 p-2 bg-blue-500/10 rounded border border-blue-500/20">
              <p className="text-sm text-blue-200">{feedback.overall}</p>
            </div>

            {/* Detailed feedback messages */}
            <div className="space-y-2">
              {feedback.feedback.map((msg, idx) => {
                const isPositive = msg.startsWith("✓");
                const isWarning = msg.startsWith("⚠");
                const isError = msg.startsWith("❌");
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-start gap-2 p-2 rounded ${
                      isPositive
                        ? "bg-green-500/10 border border-green-500/20"
                        : isWarning
                        ? "bg-yellow-500/10 border border-yellow-500/20"
                        : isError
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-gray-500/10 border border-gray-500/20"
                    }`}
                  >
                    {isPositive && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />}
                    {(isWarning || isError) && <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />}
                    <span className="text-xs text-gray-200">{msg}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Metrics */}
            <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Eye Contact:</span>
                <span className={`ml-1 font-semibold ${
                  feedback.eye_contact === "good" ? "text-green-400" : "text-yellow-400"
                }`}>
                  {feedback.eye_contact === "good" ? "Good" : "Away"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Posture:</span>
                <span className={`ml-1 font-semibold ${
                  feedback.posture.is_good ? "text-green-400" : "text-yellow-400"
                }`}>
                  {feedback.posture.is_good ? "Good" : "Slouching"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Presence:</span>
                <span className={`ml-1 font-semibold ${
                  feedback.presence ? "text-green-400" : "text-red-400"
                }`}>
                  {feedback.presence ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting for first analysis */}
      {!isInitializing && !feedback && !error && (
        <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-2 w-2 bg-blue-400 rounded-full"></div>
            <p className="text-sm text-gray-300">Waiting for analysis...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Analyzing indicator */}
      {isAnalyzing && feedback && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
          <span>Analyzing behavior...</span>
        </div>
      )}
    </div>
  );
}
