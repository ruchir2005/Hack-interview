// pages/dashboard.tsx (or app/dashboard/page.tsx)

"use client";

import { mockInterviews } from "../data/mockInterview"; // Adjust the path as needed
import { useState } from "react";

export default function DashboardPage() {
  // We'll use state to store the interviews, but for now, it's just the mock data.
  // In the future, this will be fetched from the backend.
  const [interviews, setInterviews] = useState(mockInterviews);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome back! Here are your recent mock interviews.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {interview.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{interview.topic}</p>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    interview.status === "Completed"
                      ? "bg-green-200 text-green-800"
                      : interview.status === "In Progress"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {interview.status}
                </span>
                {interview.score !== null && (
                  <span className="text-lg font-bold text-green-600">
                    {interview.score}%
                  </span>
                )}
              </div>
              <div className="mt-4">
                <a
                  href={`/interview/${interview.id}`} // Link to the interview page
                  className="w-full text-center block bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  {interview.status === "Completed" ? "View Report" : "Start/Continue"}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}