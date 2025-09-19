"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CodeEditor from "../components/CodeEditor";
import { API_BASE } from "../lib/api";

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
  const [language, setLanguage] = useState("python");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Timer and feedback states
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Form state for dynamic prompt inputs
  const [companyName, setCompanyName] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<string>("");
  const [jobRole, setJobRole] = useState("");
  const roles = [
    "Software Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Engineer",
    "Mobile Engineer",
    "Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "Data Engineer",
    "DevOps Engineer",
    "Site Reliability Engineer (SRE)",
    "Cloud Engineer",
    "Security Engineer",
    "QA/Test Engineer",
    "Automation Engineer",
    "Product Manager",
    "Program Manager",
    "UI/UX Designer",
    "Solution Architect",
    "Systems Engineer",
    "Embedded Systems Engineer",
  ];
  const router = useRouter();

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
  }, [isTimerActive]); // Remove timeRemaining from dependency to avoid re-creating interval

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateQuestionState = (data: any) => {
    setQuestion(data.questionData.question);
    setRoundTitle(data.roundTitle);
    setRoundType(data.questionData.type);
    setIsComplete(data.isComplete);
    setUserAnswer("");
    setFeedback(data.feedback);
    setShowFeedback(!!data.feedback);

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
      setInitialCode(data.questionData.initial_code);
      setUserAnswer(data.questionData.initial_code);
    } else {
      setInitialCode("");
    }
  };

  const handlePlayQuestion = async (text: string) => {
    try {
        const response = await fetch(`${API_BASE}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice: "Kore" }),
        });
        const data = await response.json();
        if (data.audio_data) {
            const audioUrl = `data:audio/wav;base64,${data.audio_data}`;
            const audio = new Audio(audioUrl);
            audio.play();
        }
    } catch (err) {
        console.error("Failed to play audio:", err);
    }
  };

  // Remove auto-start. Show a form to begin interview dynamically.

  const startInterviewSession = async () => {
    if (!companyName.trim() || !jobRole.trim() || !yearsOfExperience.trim()) {
      setError("Please fill in company, role, and years of experience.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("companyName", companyName.trim());
      form.append("jobRole", jobRole.trim());
      form.append("yearsOfExperience", String(parseInt(yearsOfExperience, 10)));
      // Backend ignores jobDescription/resume; send empty JD for compatibility
      form.append("jobDescription", "");

      const response = await fetch(`${API_BASE}/api/start-interview`, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start interview session.');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      updateQuestionState(data);
    } catch (err: any) {
      console.error("Error starting interview:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
  
  const handleVoiceToggle = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  if (isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">Interview Complete! 🎉</h1>
          <p className="text-gray-700">Congratulations, you have completed the mock interview.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start a New Interview
          </button>
        </div>
      </div>
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-3xl p-8 bg-white rounded-lg shadow-md">
        {!sessionId ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-center text-gray-800">Start a Mock Interview</h1>
            <p className="text-center text-gray-600">Prompts will be built using the fields below. Resume is not used.</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google"
                  className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  placeholder="e.g., 3"
                  className="mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Role</label>
                <div className="mt-1 border rounded-lg h-48 overflow-y-auto p-2 space-y-2">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setJobRole(role)}
                      className={`w-full text-left px-3 py-2 rounded-md border transition ${
                        jobRole === role ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                {jobRole && (
                  <p className="mt-2 text-sm text-gray-600">Selected: <span className="font-medium">{jobRole}</span></p>
                )}
              </div>
            </div>
            <button
              onClick={startInterviewSession}
              disabled={!companyName.trim() || !jobRole.trim() || !yearsOfExperience.trim() || isLoading}
              className={`w-full py-3 rounded-lg text-white font-semibold transition-colors duration-300 ${
                (!companyName.trim() || !jobRole.trim() || !yearsOfExperience.trim() || isLoading)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Starting...' : 'Start Interview'}
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">{roundTitle}</h1>

            {isLoading ? (
              <div className="text-center text-gray-500 flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Loading question...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timer and Progress Bar */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Round:</span> {roundTitle}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {roundType?.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${timeRemaining <= 60 ? 'text-red-600' : timeRemaining <= 180 ? 'text-orange-600' : 'text-green-600'}`}>
                      ⏱️ {formatTime(timeRemaining)}
                    </div>
                    {isTimerActive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg border">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Question:</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{question}</p>
                </div>

                {/* Feedback Display */}
                {showFeedback && feedback && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Feedback for Previous Answer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${feedback.score >= 8 ? 'text-green-600' : feedback.score >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {feedback.score}/10
                        </div>
                        <div className="text-sm text-gray-600">Score</div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-700 mb-1">✅ Strengths:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {feedback.strengths?.map((strength: string, idx: number) => (
                            <li key={idx}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-700 mb-1">🔧 Areas to Improve:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {feedback.weaknesses?.map((weakness: string, idx: number) => (
                            <li key={idx}>• {weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <p className="text-sm text-gray-700">{feedback.feedback_text}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-4 items-center">
                  <button
                    onClick={() => handlePlayQuestion(question)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    🔊 Play Question
                  </button>
                  <button
                    onClick={handleVoiceToggle}
                    className={`px-4 py-2 rounded-lg text-white transition-colors ${
                      isVoiceEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    {isVoiceEnabled ? '🎤 Voice Mode On' : '🎤 Voice Mode Off'}
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
                            ? "bg-blue-50 border-blue-500 shadow-md"
                            : "bg-white border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        <p className="text-gray-800">{option}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <textarea
                    id="answer"
                    rows={10}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-4 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
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
        )}
      </div>
    </div>
  );
}
