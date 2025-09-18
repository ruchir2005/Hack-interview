// pages/InterviewSelectionPage.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InterviewSelectionPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const router = useRouter();

  const handleSelect = (interviewType: string) => {
    setSelectedType(interviewType);
  };

  const handleStartInterview = () => {
    if (selectedType) {
      router.push(`/interview?type=${selectedType}`);
    }
  };

  const interviewOptions = [
    {
      type: "end-to-end",
      title: "End-to-End Interview",
      description: "A comprehensive session covering behavioral, technical, and system design questions.",
    },
    {
      type: "behavioral",
      title: "Behavioral Interview",
      description: "Focus on soft skills and past experiences using the STAR method.",
    },
    {
      type: "dsa",
      title: "Data Structures & Algorithms (DSA)",
      description: "Practice solving coding challenges and technical problems.",
    },
    {
      type: "oa",
      title: "Online Assessment (OA)",
      description: "Simulate a timed coding test with a set number of questions.",
    },
    {
      type: "non-technical",
      title: "Non-Technical Interview",
      description: "Prepare for roles focusing on product, project management, or sales.",
    },
    {
      type: "system-design",
      title: "System Design",
      description: "Design and discuss the architecture of a large-scale system.",
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Choose Your Interview Type
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Select the type of interview you want to practice.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {interviewOptions.map((option) => (
            <div
              key={option.type}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                selectedType === option.type
                  ? "border-blue-500 bg-blue-50 shadow-lg"
                  : "border-gray-300 hover:border-blue-400 hover:shadow-md"
              }`}
              onClick={() => handleSelect(option.type)}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {option.title}
              </h2>
              <p className="text-gray-600 text-sm">{option.description}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleStartInterview}
          disabled={!selectedType}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-colors duration-300 ${
            selectedType
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Start Interview
        </button>
      </div>
    </div>
  );
}