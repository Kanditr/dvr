export default function HeroSection() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-6 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome Credit Team User,
          </h1>
          <p className="text-sm text-gray-500">
            Quickly Assess, Sync, and Report Your Business Partner's Credit Evaluations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#0056b8] text-[#0056b8] rounded text-sm font-medium hover:bg-blue-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Master Data
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#0056b8] text-white rounded text-sm font-medium hover:bg-[#004a9f] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Calculate Credit Score
          </button>
        </div>
      </div>
    </div>
  );
}
