"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../lib/api";

export default function ResumeUploadPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | ''>('');
  const [jobRole, setJobRole] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [planPreview, setPlanPreview] = useState<
    | {
        inferred_role: string;
        inferred_years_of_experience: number;
        inferred_company: string;
        rounds: { title: string; type: string; question_count: number; estimated_minutes: number }[];
        total_questions: number;
        total_estimated_minutes: number;
        is_ai_generated: boolean;
        generation_source: string;
      }
    | null
  >(null);
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

  const handlePreviewPlan = async () => {
    setError(null);
    if (!jobRole || yearsOfExperience === '' || !companyName) {
      setError("Please provide Role, Years of Experience, and Company to preview the plan.");
      return;
    }

    setIsPreviewLoading(true);
    setPlanPreview(null);
    const formData = new FormData();
    if (resumeFile) formData.append("resumeFile", resumeFile);
    if (jobDescription) formData.append("jobDescription", jobDescription);
    formData.append("yearsOfExperience", String(yearsOfExperience || 0));
    formData.append("jobRole", jobRole);
    formData.append("companyName", companyName);

    try {
      const res = await fetch(`${API_BASE}/api/preview-plan`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to preview plan.');
      }
      const data = await res.json();
      setPlanPreview(data);
    } catch (e: any) {
      setError(e.message || 'Failed to preview plan.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (yearsOfExperience === '' || !jobRole || !companyName) {
      setError("Please provide Role, Years of Experience, and Company.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    if (resumeFile) formData.append("resumeFile", resumeFile);
    if (jobDescription) formData.append("jobDescription", jobDescription);
    formData.append("yearsOfExperience", String(yearsOfExperience));
    formData.append("jobRole", jobRole);
    formData.append("companyName", companyName);

    try {
      const response = await fetch(`${API_BASE}/api/start-interview`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start interview session.');
      }

      const data = await response.json();
      console.log("Backend response:", data);
      
      router.push("/Interview");

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
              className="w-full p-4 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
              placeholder="Paste the job description here..."
            />
          </div>

          {/* Job Role, Years of Experience, Company Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-lg font-medium text-gray-700 mb-2">
                3. Company Name
              </label>
              <select
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">Select a company</option>
                <option>Amazon</option>
                <option>Google</option>
                <option>Microsoft</option>
                <option>Meta</option>
                <option>Apple</option>
                <option>Netflix</option>
                <option>Uber</option>
                <option>Airbnb</option>
                <option>Stripe</option>
                <option>NVIDIA</option>
                <option>OpenAI</option>
                <option>Adobe</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="jobRole" className="block text-lg font-medium text-gray-700 mb-2">
                4. Your Job Role
              </label>
              <select
                id="jobRole"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">Select a role</option>
                <option>Software Engineer</option>
                <option>SDE 1</option>
                <option>SDE 2</option>
                <option>Senior SDE</option>
                <option>Frontend Engineer</option>
                <option>Backend Engineer</option>
                <option>Full Stack Engineer</option>
                <option>Data Scientist</option>
                <option>ML Engineer</option>
                <option>DevOps Engineer</option>
                <option>Product Manager</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="yearsOfExperience" className="block text-lg font-medium text-gray-700 mb-2">
                5. Years of Experience
              </label>
              <select
                id="yearsOfExperience"
                value={yearsOfExperience === '' ? '' : String(yearsOfExperience)}
                onChange={(e) => setYearsOfExperience(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">Select years</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="10">10</option>
                <option value="12">12</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePreviewPlan}
              className={`w-full py-3 rounded-lg text-white font-semibold transition-colors duration-300 ${
                isPreviewLoading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              disabled={isPreviewLoading}
            >
              {isPreviewLoading ? "Generating Plan..." : "Preview Interview Plan"}
            </button>
            <button
              type="submit"
              className={`w-full py-3 rounded-lg text-white font-semibold transition-colors duration-300 ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Starting..." : "Proceed to Interview"}
            </button>
          </div>
        </form>

        {planPreview && (
          <div className="mt-8 p-6 bg-gray-50 border rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800">Interview Plan Preview</h2>
            <p className="mt-2 text-gray-700">
              <span className="font-medium">Role:</span> {planPreview.inferred_role || '—'} | {" "}
              <span className="font-medium">Experience:</span> {planPreview.inferred_years_of_experience} yrs | {" "}
              <span className="font-medium">Company:</span> {planPreview.inferred_company || '—'}
            </p>
            
            {/* Generation Source Indicator */}
            <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2">
                {planPreview.is_ai_generated ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">AI Generated</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-orange-700">Fallback Plan</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{planPreview.generation_source}</p>
            </div>

            <div className="mt-4 space-y-3">
              {planPreview.rounds.map((r, idx) => (
                <div key={idx} className="p-4 bg-white border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{r.title} <span className="ml-2 text-xs uppercase tracking-wide text-gray-500">{r.type}</span></p>
                    <p className="text-gray-600 text-sm">Questions: {r.question_count}</p>
                  </div>
                  <p className="text-gray-700 font-medium">~ {r.estimated_minutes} min</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-gray-800">
              <p className="font-medium">Total Questions: {planPreview.total_questions}</p>
              <p className="font-semibold">Estimated Duration: ~ {planPreview.total_estimated_minutes} minutes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}