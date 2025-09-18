"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export default function ResumeUploadPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | ''>('');
  const [jobRole, setJobRole] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (
        file.type !== "application/pdf" &&
        file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setError("Please upload a PDF or DOCX file.");
        setResumeFile(null);
      } else {
        setResumeFile(file);
        setError(null);
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!resumeFile || !jobDescription || yearsOfExperience === '' || !jobRole || !companyName) {
      setError("Please fill in all the required fields.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("resumeFile", resumeFile);
    formData.append("jobDescription", jobDescription);
    formData.append("yearsOfExperience", String(yearsOfExperience));
    formData.append("jobRole", jobRole);
    formData.append("companyName", companyName);

    try {
      const response = await fetch('http://localhost:8000/api/start-interview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start interview session.');
      }

      const data = await response.json();
      console.log("Backend response:", data);
      
      router.push("/interview");

    } catch (err: any) {
      console.error(err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Prepare for Your Interview
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Upload your resume and the job details to get started.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Resume Upload Section */}
          <div>
            <label htmlFor="resume" className="block text-lg font-medium text-gray-700 mb-2">
              1. Upload Your Resume (PDF or DOCX)
            </label>
            <div
              className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${
                resumeFile ? "border-green-500" : "border-gray-300"
              }`}
            >
              <input
                id="resume"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx"
              />
              <label
                htmlFor="resume"
                className="flex flex-col items-center justify-center w-full h-full text-center text-gray-500 cursor-pointer"
              >
                {resumeFile ? (
                  <p className="text-green-600 font-medium">{resumeFile.name} uploaded.</p>
                ) : (
                  <p>Drag and drop or click to upload</p>
                )}
              </label>
            </div>
          </div>

          {/* Job Description Section */}
          <div>
            <label htmlFor="jobDescription" className="block text-lg font-medium text-gray-700 mb-2">
              2. Paste Job Description
            </label>
            <textarea
              id="jobDescription"
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-4 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste the job description here..."
            />
          </div>

          {/* Job Role, Years of Experience, Company Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="jobRole" className="block text-lg font-medium text-gray-700 mb-2">
                3. Your Job Role
              </label>
              <input
                id="jobRole"
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Senior SDE"
              />
            </div>
            <div>
              <label htmlFor="yearsOfExperience" className="block text-lg font-medium text-gray-700 mb-2">
                4. Years of Experience
              </label>
              <input
                id="yearsOfExperience"
                type="number"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="companyName" className="block text-lg font-medium text-gray-700 mb-2">
                5. Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Google"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg text-white font-semibold transition-colors duration-300 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Proceed to Interview"}
          </button>
        </form>
      </div>
    </div>
  );
}