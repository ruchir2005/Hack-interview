"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CodeEditor from "../components/CodeEditor";

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [initialCode, setInitialCode] = useState("");
  const [mcqOptions, setMcqOptions] = useState<string[] | null>(null);
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);
  const [roundTitle, setRoundTitle] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundType, setRoundType] = useState<string | null>(null);
  const [language, setLanguage] = useState("python");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false); // New state for voice mode
  const [isRecording, setIsRecording] = useState(false); // New state for recording status
  const router = useRouter();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const updateQuestionState = (data: any) => {
    setQuestion(data.questionData.question);
    setRoundTitle(data.roundTitle);
    setRoundType(data.questionData.type);
    setIsComplete(data.isComplete);
    setUserAnswer("");

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
        const response = await fetch('http://localhost:8000/api/tts', {
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

  useEffect(() => {
    const startInterviewSession = async () => {
      setIsLoading(true);
      try {
        const mockData = new FormData();
        mockData.append("jobDescription", "Software Engineer role at a fast-growing company.");
        mockData.append("yearsOfExperience", "3");
        mockData.append("jobRole", "Software Engineer");
        mockData.append("companyName", "Google");
        const mockFile = new Blob(["resume content"], { type: "text/plain" });
        mockData.append("resumeFile", mockFile, "resume.txt");

        const response = await fetch('http://localhost:8000/api/start-interview', {
          method: 'POST',
          body: mockData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to start interview session.');
        }

        const data = await response.json();
        setSessionId(data.sessionId);
        updateQuestionState(data);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error starting interview:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    startInterviewSession();
  }, []);

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
              const response = await fetch('http://localhost:8000/api/stt', {
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

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/submit-answer', {
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error 😞</h1>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-3xl p-8 bg-white rounded-lg shadow-md">
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
            <div className="p-6 bg-gray-50 rounded-lg border">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Question:</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{question}</p>
            </div>
            
            <div className="flex space-x-4 items-center">
              <button
                onClick={() => handlePlayQuestion(question)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Play Question
              </button>
              <button
                onClick={handleVoiceToggle}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  isVoiceEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                {isVoiceEnabled ? 'Voice Mode On' : 'Voice Mode Off'}
              </button>
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
                className="w-full p-4 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>
    </div>
  );
}
