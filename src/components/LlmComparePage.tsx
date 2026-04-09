import { useState, useRef, useCallback } from 'react';
import { compareDocuments, getSystemPrompt } from '../services/llm-compare';
import type { ComparisonResult } from '../services/llm-compare';

export default function LlmComparePage() {
  const [files, setFiles] = useState<(File | null)[]>([null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleFile = useCallback((index: number, file: File) => {
    setFiles(prev => { const next = [...prev]; next[index] = file; return next; });
    const url = URL.createObjectURL(file);
    setPreviews(prev => { const next = [...prev]; next[index] = url; return next; });
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(index, file);
  }, [handleFile]);

  const handleInputChange = useCallback((index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(index, file);
  }, [handleFile]);

  const canCompare = files[0] !== null && files[1] !== null && !loading;

  async function handleCompare() {
    if (!files[0] || !files[1]) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await compareDocuments([files[0], files[1]]);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">LLM Document Comparison</h1>
        <p className="text-sm text-gray-500 mt-1">
          Drop two shipping document images to compare them using Claude's vision capabilities.
        </p>
      </div>

      {/* Drop Zones */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {[0, 1].map(i => (
          <div
            key={i}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop(i)}
            onClick={() => inputRefs[i].current?.click()}
            className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-[#0056b8] transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[240px] p-4"
          >
            <input
              ref={inputRefs[i]}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange(i)}
            />
            {previews[i] ? (
              <div className="w-full">
                <p className="text-xs font-medium text-gray-500 mb-2">Document {i + 1}: {files[i]?.name}</p>
                <img src={previews[i]!} alt={`Document ${i + 1}`} className="max-h-48 mx-auto object-contain rounded" />
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Document {i + 1}</p>
                <p className="text-xs text-gray-400 mt-1">Drag & drop or click to upload</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Compare Button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleCompare}
          disabled={!canCompare}
          className={`px-6 py-2 rounded-md text-sm font-medium text-white transition-colors ${
            canCompare ? 'bg-[#0056b8] hover:bg-[#004494]' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {loading ? 'Comparing...' : 'Compare Documents'}
        </button>
        <button
          onClick={() => setShowPrompt(v => !v)}
          className="px-4 py-2 rounded-md text-sm font-medium text-[#0056b8] border border-[#0056b8] hover:bg-blue-50 transition-colors"
        >
          {showPrompt ? 'Hide' : 'Show'} Raw Instruction
        </button>
      </div>

      {/* Raw Instruction Panel */}
      {showPrompt && (
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <div className="px-4 py-3 bg-[#d9ecf3] border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-700">System Prompt (sent to LLM)</h2>
          </div>
          <pre className="px-4 py-3 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
            {getSystemPrompt()}
          </pre>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6 flex flex-col items-center">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0056b8] rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-600">Analyzing documents with Claude...</p>
          <p className="text-xs text-gray-400 mt-1">This may take 10-30 seconds</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#faeaea] border border-[#e8b4b4] rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-[#8c1d1d]">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Raw Response (collapsible) */}
          {result.rawResponse && (
            <details className="border-b border-gray-200">
              <summary className="px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-50">
                Raw LLM Response
              </summary>
              <pre className="px-4 py-3 text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 max-h-60 overflow-y-auto">
                {result.rawResponse}
              </pre>
            </details>
          )}

          {/* Summary Header */}
          <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-3">
            <span className={`inline-flex items-center px-3 h-7 rounded-full text-xs font-semibold ${
              result.overallStatus === 'match'
                ? 'bg-[#ebf7ed] text-[#267d36]'
                : 'bg-[#fef5e5] text-[#ac6f00]'
            }`}>
              {result.overallStatus === 'match' ? 'Match' : 'Mismatch'}
            </span>
            <p className="text-sm text-gray-700">{result.summary}</p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#d9ecf3] border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-44">Field</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Document 1</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Document 2</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-28">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {result.fields.map((field, idx) => (
                  <tr key={field.field} className={`border-b border-gray-200 ${idx % 2 !== 0 ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap align-top pt-4">
                      {field.field}
                    </td>
                    <td className={`px-4 py-3 align-top ${field.status === 'match' ? 'bg-[#ebf7ed]' : 'bg-[#fef5e5]'}`}>
                      <span className="block text-sm font-medium text-gray-900">{field.doc1Value}</span>
                    </td>
                    <td className={`px-4 py-3 align-top ${field.status === 'match' ? 'bg-[#ebf7ed]' : 'bg-[#fef5e5]'}`}>
                      <span className="block text-sm font-medium text-gray-900">{field.doc2Value}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap align-top pt-4">
                      {field.status === 'match' ? (
                        <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#ebf7ed] text-[#267d36]">
                          Match
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 h-6 rounded-full text-xs font-medium bg-[#fef5e5] text-[#ac6f00]">
                          Mismatch
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 align-top pt-4">
                      {field.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}
