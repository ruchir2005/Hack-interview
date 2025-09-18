import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="px-6 pt-20 pb-14 md:pt-28 md:pb-20 max-w-5xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            AI-Powered Mock Interviews
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600">
            Practice behavioral, technical, and MCQ rounds with instant AI feedback and scoring.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/Interview"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Interview
            </Link>
            <Link
              href="/resume"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-blue-700 font-semibold shadow border border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Upload Resume
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Dynamic Rounds</h3>
            <p className="mt-2 text-gray-600">Behavioral, MCQ, and coding rounds tailored to your role and company.</p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Code Editor</h3>
            <p className="mt-2 text-gray-600">Solve DSA and technical problems with an integrated Monaco editor.</p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Instant Feedback</h3>
            <p className="mt-2 text-gray-600">Get AI-powered scoring, strengths, and improvement tips.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
