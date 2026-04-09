import { useState, useRef, useEffect } from 'react';
import gcLogo from '../assets/gc-logo.png';

interface NavbarProps {
  currentView: string;
  onNavigateHome: () => void;
  onNavigateToLlmCompare: () => void;
}

export default function Navbar({ currentView, onNavigateHome, onNavigateToLlmCompare }: NavbarProps) {
  const isHome = currentView === 'home' || currentView === 'detail';
  const isLlmCompare = currentView === 'llm-compare';

  const [mgmtOpen, setMgmtOpen] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const mgmtRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!mgmtOpen) return;
    const handler = (e: MouseEvent) => {
      if (mgmtRef.current && !mgmtRef.current.contains(e.target as Node)) {
        setMgmtOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mgmtOpen]);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={gcLogo} alt="GC Logo" className="h-8 w-auto object-contain" />
          <span className="text-sm font-bold text-gray-700">
            Document Verification
          </span>
        </div>

        {/* Center: Nav links */}
        <div className="flex items-center h-full text-sm">
          <button
            onClick={onNavigateHome}
            className={`flex items-center h-full px-4 font-medium ${
              isHome
                ? 'border-b-2 border-[#0056b8] text-[#0056b8]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={onNavigateToLlmCompare}
            className={`flex items-center h-full px-4 font-medium ${
              isLlmCompare
                ? 'border-b-2 border-[#0056b8] text-[#0056b8]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            LLM Compare
          </button>
        </div>

        {/* Right: App Management + User avatar */}
        <div className="flex items-center gap-4">
          {/* App Management dropdown */}
          <div className="relative" ref={mgmtRef}>
            <button
              onClick={() => setMgmtOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                mgmtOpen
                  ? 'border-[#0056b8] text-[#0056b8] bg-blue-50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {/* Gear icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              App Management
              <svg className={`w-3.5 h-3.5 transition-transform ${mgmtOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mgmtOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Settings</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auto-approve" className="text-sm text-gray-700 cursor-pointer select-none">
                      Auto-approve task
                    </label>
                    <button
                      id="auto-approve"
                      role="switch"
                      aria-checked={autoApprove}
                      onClick={() => setAutoApprove((v) => !v)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                        autoApprove ? 'bg-[#0056b8]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform mt-0.5 ${
                          autoApprove ? 'translate-x-4 ml-0.5' : 'translate-x-0 ml-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
              JD
            </div>
            <span className="text-sm text-gray-700">Jane Doe</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
}
