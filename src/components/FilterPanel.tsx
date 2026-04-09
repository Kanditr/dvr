export default function FilterPanel() {
  return (
    <div className="flex flex-wrap gap-4 items-end px-6 py-4 border-b border-gray-200">
      <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
        <label className="text-xs text-gray-500 font-medium">Global Search</label>
        <div className="relative">
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by ID, Name"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0056b8]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-[150px]">
        <label className="text-xs text-gray-500 font-medium">Rating</label>
        <div className="relative">
          <select className="w-full appearance-none px-3 py-2 pr-8 border border-gray-300 rounded text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0056b8] bg-white">
            <option value="">All</option>
            <option>AA</option>
            <option>A</option>
            <option>BB</option>
            <option>B</option>
            <option>C</option>
          </select>
          <svg className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-1 min-w-[180px]">
        <label className="text-xs text-gray-500 font-medium">Status</label>
        <div className="relative">
          <select className="w-full appearance-none px-3 py-2 pr-8 border border-gray-300 rounded text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0056b8] bg-white">
            <option value="">All</option>
            <option>Ready</option>
            <option>Invalid FI Statement</option>
            <option>Pending QA Rating</option>
          </select>
          <svg className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="flex items-end pb-0.5 ml-auto">
        <button className="text-sm text-[#0056b8] hover:underline whitespace-nowrap">
          Reset Filter
        </button>
      </div>
    </div>
  );
}
