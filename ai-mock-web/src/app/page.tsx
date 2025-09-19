import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="px-6 pt-20 pb-14 md:pt-28 md:pb-20 max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            AI-Powered Mock Interviews
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600">
            Practice with realistic interview rounds, AI-generated questions, and instant feedback.
          </p>
        </div>
      </section>

      {/* Interview Plan Options */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
          Choose Your Interview Experience
        </h2>
        
        <div className="grid gap-8 md:grid-cols-2">
          {/* Company-Based Plan */}
          <div className="rounded-xl border-2 border-blue-200 bg-white p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5.5V9a2 2 0 012-2h2a2 2 0 012 2v6.5M7 7h3v3H7V7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Company-Based Interview Plan</h3>
              <p className="text-gray-600 mb-6">
                Get a realistic interview plan based on actual company practices. AI generates 6-8 rounds 
                matching real hiring processes at top tech companies.
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>✓ Company-specific interview rounds</li>
                <li>✓ Role and experience-based questions</li>
                <li>✓ Realistic round progression</li>
                <li>✓ AI reasoning for plan selection</li>
              </ul>
              <Link
                href="/resume?mode=company"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
              >
                Start Company-Based Plan
              </Link>
            </div>
          </div>

          {/* Custom Plan */}
          <div className="rounded-xl border-2 border-green-200 bg-white p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Custom Interview Plan</h3>
              <p className="text-gray-600 mb-6">
                Design your own interview experience. Choose specific round types, question counts, 
                and focus areas based on your preparation needs.
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>✓ Customize round types and counts</li>
                <li>✓ Focus on specific skill areas</li>
                <li>✓ Flexible interview duration</li>
                <li>✓ Personalized difficulty levels</li>
              </ul>
              <Link
                href="/resume?mode=custom"
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-white font-semibold shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full"
              >
                Create Custom Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">AI-Generated Questions</h3>
            <p className="mt-2 text-gray-600">Fresh, varied questions generated in real-time based on your profile and target role.</p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Smart Answer Analysis</h3>
            <p className="mt-2 text-gray-600">AI evaluates your responses and provides detailed feedback with improvement suggestions.</p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Realistic Experience</h3>
            <p className="mt-2 text-gray-600">Multiple rounds with coding editor, MCQs, and behavioral questions just like real interviews.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
