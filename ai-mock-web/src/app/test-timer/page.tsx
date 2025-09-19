"use client";

import { useState, useEffect, useRef } from "react";

export default function TestTimer() {
  const [timeRemaining, setTimeRemaining] = useState<number>(10); // 10 seconds for testing
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    setTimeRemaining(10);
    setIsTimerActive(true);
  };

  const stopTimer = () => {
    setIsTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          console.log("Timer tick:", prev);
          if (prev <= 1) {
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">Timer Test</h1>
        
        <div className={`text-4xl font-bold mb-6 ${timeRemaining <= 3 ? 'text-red-600' : timeRemaining <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
          ⏱️ {formatTime(timeRemaining)}
        </div>
        
        <div className="mb-4">
          <p>Timer Active: {isTimerActive ? "Yes" : "No"}</p>
          <p>Time Remaining: {timeRemaining}s</p>
        </div>
        
        <div className="space-x-4">
          <button
            onClick={startTimer}
            disabled={isTimerActive}
            className={`px-4 py-2 rounded-lg font-semibold ${
              isTimerActive 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Start Timer
          </button>
          
          <button
            onClick={stopTimer}
            disabled={!isTimerActive}
            className={`px-4 py-2 rounded-lg font-semibold ${
              !isTimerActive 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Stop Timer
          </button>
        </div>
        
        {isTimerActive && (
          <div className="mt-4 w-2 h-2 bg-green-500 rounded-full animate-pulse mx-auto"></div>
        )}
      </div>
    </div>
  );
}
