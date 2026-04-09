import { useState } from 'react';

export default function Pagination() {
  const [page, setPage] = useState(1);
  const totalPages = 20;
  const totalRecords = 200;
  const perPage = 10;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalRecords);

  const pages: (number | '...')[] = [1, 2, 3, 4, '...', totalPages];

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
      <span className="text-sm text-gray-500">{from} to {to} of {totalRecords} records</span>

      <div className="flex items-center gap-1">
        <button
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 disabled:opacity-40 hover:bg-gray-100 transition-colors"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded border text-sm transition-colors ${
                page === p
                  ? 'bg-[#0056b8] text-white border-[#0056b8]'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 disabled:opacity-40 hover:bg-gray-100 transition-colors"
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
