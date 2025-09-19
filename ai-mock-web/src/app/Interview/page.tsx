"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import CodeEditor from "../components/CodeEditor";
import { API_BASE } from "../lib/api";
import { useSpeak } from "@/hooks/useSpeak";
import InterviewSummary from "@/components/InterviewSummary";

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [initialCode, setInitialCode] = useState("");
  const [mcqOptions, setMcqOptions] = useState<string[] | null>(null);
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);
  const [roundTitle, setRoundTitle] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundType, setRoundType] = useState<string | null>(null);
  const [language] = useState<string>("python");
  const [isRecording, setIsRecording] = useState(false);
  
  // Timer and feedback states
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [feedback, setFeedback] = useState<{
    score?: number;
    strengths?: string[];
    weaknesses?: string[];
    feedback_text?: string;
  } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { speakIfEnabled } = useSpeak();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Timer functions
  const startTimer = (minutes: number) => {
    setTimeRemaining(minutes * 60);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerActive]); // Intentionally exclude timeRemaining from deps to avoid re-creating interval

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateQuestionState = useCallback((data: {
    questionData: {
      question: string;
      type: string;
      options?: string[];
      initial_code?: string;
    };
    roundTitle: string;
    isComplete: boolean;
    feedback?: {
      feedback_text?: string;
      score?: number;
      strengths?: string[];
      weaknesses?: string[];
    };
  }) => {
    setQuestion(data.questionData.question);
    setRoundTitle(data.roundTitle);
    setRoundType(data.questionData.type);
    setIsComplete(data.isComplete);
    setUserAnswer("");
    setFeedback(data.feedback ?? null);
    setShowFeedback(!!data.feedback);

    // Auto-speak question if voice is enabled
    if (data.questionData.question) {
      speakIfEnabled(data.questionData.question);
    }

    // Auto-speak feedback if voice is enabled
    if (data.feedback?.feedback_text) {
      speakIfEnabled(data.feedback.feedback_text);
    }

    // Start timer based on question type
    if (data.questionData.type === "technical" || data.questionData.type === "dsa") {
      startTimer(45); // 45 minutes for coding questions
    } else if (data.questionData.type === "mcq") {
      startTimer(2); // 2 minutes per MCQ
    } else {
      startTimer(8); // 8 minutes for behavioral questions
    }

    if (data.questionData.type === "mcq" && data.questionData.options) {
      setMcqOptions(data.questionData.options);
      setSelectedMcqOption(null);
    } else {
      setMcqOptions(null);
      setSelectedMcqOption(null);
    }

    if (data.questionData.type === "technical" || data.questionData.type === "dsa") {
      setInitialCode(data.questionData.initial_code ?? "");
      setUserAnswer(data.questionData.initial_code ?? "");
    } else {
      setInitialCode("");
    }
  }, [speakIfEnabled]);

  // Removed unused handlePlayQuestion to satisfy no-unused-vars

  // Initialize from sessionStorage set by /resume page after start-interview
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('interviewSession');
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.sessionId) {
          setSessionId(data.sessionId);
          updateQuestionState(data);
          return;
        }
      }
    } catch {
      // ignore JSON errors
    }
    // Fallback to resume if nothing is present
    router.push('/resume');
  }, [router, updateQuestionState]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (e) => {
            audioChunksRef.current.push(e.data);
          };
          mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            audioChunksRef.current = [];
            
            const audioFormData = new FormData();
            audioFormData.append('audio_file', audioBlob);

            try {
              const response = await fetch(`${API_BASE}/api/stt`, {
                method: 'POST',
                body: audioFormData,
              });
              const data = await response.json();
              setUserAnswer(data.text);
            } catch (err) {
              console.error("STT error:", err);
              setError("Failed to transcribe audio.");
            }
          };
          mediaRecorderRef.current.start();
          setIsRecording(true);
        })
        .catch(err => {
          console.error("Microphone access denied:", err);
          setError("Please grant microphone access to use voice mode.");
        });
    }
  };


  const handleSubmitAnswer = async () => {
    if (!sessionId) {
      return;
    }
    
    let answerToSubmit = userAnswer;
    if (roundType === 'mcq' && selectedMcqOption) {
      answerToSubmit = selectedMcqOption;
    } else if (roundType === 'mcq' && !selectedMcqOption) {
      setError("Please select an option.");
      return;
    }

    if (!answerToSubmit.trim() && roundType !== 'mcq') {
      return;
    }

    stopTimer(); // Stop timer when submitting
    setIsLoading(true);
    setShowFeedback(false);
    
    try {
      const response = await fetch(`${API_BASE}/api/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, userAnswer: answerToSubmit }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit answer.');
      }

      const data = await response.json();
      updateQuestionState(data);
    } catch (err: any) {
      console.error("Error submitting answer:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove local voice toggle - using global voice context now

  if (isComplete && sessionId) {
    return (
      <InterviewSummary 
        sessionId={sessionId} 
        onNewInterview={() => router.push("/resume")} 
      />
    );
  }

  if (error && !sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error 😞</h1>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 flex flex-col items-center justify-center">
      <div className="animated-grid" />
      <div className="relative w-full max-w-3xl p-8 rounded-lg glass-effect neon-border">
        {sessionId ? (
          <>
            <h1 className="page-title text-center mb-6">{roundTitle}</h1>

            {isLoading ? (
              <div className="text-center text-white/80 flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Loading question...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timer and Progress Bar */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-white/15 bg-white/5">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-white/80">
                      <span className="font-medium text-white">Round:</span> {roundTitle}
                    </div>
                    <div className="text-sm text-white/80">
                      <span className="font-medium text-white">Type:</span> {roundType?.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${timeRemaining <= 60 ? 'text-red-400' : timeRemaining <= 180 ? 'text-orange-300' : 'text-green-300'}`}>
                      ⏱️ {formatTime(timeRemaining)}
                    </div>
                    {isTimerActive && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-lg border border-white/15 bg-white/5">
                  <h2 className="section-title mb-2 text-white">Question:</h2>
                  <p className="text-white whitespace-pre-wrap">{question}</p>
                </div>

                {/* Feedback Display */}
                {showFeedback && feedback && (
                  <div className="p-6 rounded-lg border border-white/15 bg-white/5">
                    <h3 className="card-title mb-3 text-white">📊 Feedback for Previous Answer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${(feedback?.score ?? 0) >= 8 ? 'text-green-300' : (feedback?.score ?? 0) >= 6 ? 'text-yellow-200' : 'text-red-300'}`}>
                          {(feedback?.score ?? 0)}/10
                        </div>
                        <div className="text-sm text-white/70">Score</div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-300 mb-1">✅ Strengths:</h4>
                        <ul className="text-sm text-white/90 space-y-1">
                          {feedback.strengths?.map((strength: string, idx: number) => (
                            <li key={idx}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-300 mb-1">🔧 Areas to Improve:</h4>
                        <ul className="text-sm text-white/90 space-y-1">
                          {feedback.weaknesses?.map((weakness: string, idx: number) => (
                            <li key={idx}>• {weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="p-3 rounded border border-white/15 bg-white/5">
                      <p className="text-sm text-white/90">{feedback.feedback_text}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-4 items-center">
                  <button
                    onClick={() => speakIfEnabled(question)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    🔊 Repeat Question
                  </button>
                  {showFeedback && (
                    <button
                      onClick={() => setShowFeedback(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Hide Feedback
                    </button>
                  )}
                </div>

                {/* Conditional rendering for the code editor, MCQ options, or textarea */}
                {roundType === "dsa" || roundType === "technical" ? (
                  <CodeEditor
                    initialCode={userAnswer || initialCode}
                    onCodeChange={setUserAnswer}
                    language={language}
                  />
                ) : roundType === "mcq" && mcqOptions ? (
                  <div className="space-y-4">
                    {mcqOptions.map((option, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedMcqOption(option)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedMcqOption === option
                            ? "border-blue-400 bg-white/10 shadow-md"
                            : "border-white/20 bg-white/5 hover:border-blue-300"
                        } text-white`}
                      >
                        <p className="text-white">{option}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <textarea
                    id="answer"
                    rows={10}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-4 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/50 bg-white/5 border-white/20"
                    placeholder="Type your answer here..."
                  />
                )}
                
                <button
                  onClick={handleSubmitAnswer}
                  disabled={(!userAnswer.trim() && !selectedMcqOption) || isLoading}
                  className={`w-full py-3 rounded-lg text-white font-semibold transition-colors duration-300 ${
                    (userAnswer.trim() || selectedMcqOption) && !isLoading
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Submit Answer
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading interview session...</p>
          </div>
        )}
      </div>
    </div>
  );
}
