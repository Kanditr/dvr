import { useState, useRef, useEffect } from 'react';
import gcLogo from '../assets/gc-logo.png';

interface NavbarProps {
  currentView: string;
  currentUser: string;
  onNavigateHome: () => void;
  onNavigateToLlmCompare: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export default function Navbar({ currentView, currentUser, onNavigateHome, onNavigateToLlmCompare, onNavigateToSettings, onLogout }: NavbarProps) {
  const isHome = currentView === 'home' || currentView === 'detail';
  const isLlmCompare = currentView === 'llm-compare';
  const isSettings = currentView === 'settings';

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={gcLogo} alt="GC Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={onNavigateHome} />
          <span className="text-sm font-bold text-gray-700 cursor-pointer" onClick={onNavigateHome}>Document Verification</span>
        </div>

        {/* Center: Nav links */}
        <div className="flex items-center h-full text-sm">
          <button
            onClick={onNavigateHome}
            className={`flex items-center h-full px-4 font-medium ${
              isHome ? 'border-b-2 border-[#0056b8] text-[#0056b8]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={onNavigateToLlmCompare}
            className={`flex items-center h-full px-4 font-medium ${
              isLlmCompare ? 'border-b-2 border-[#0056b8] text-[#0056b8]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            LLM Compare
          </button>
        </div>

        {/* Right: User avatar */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                {currentUser.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <span className="text-sm text-gray-700">{currentUser}</span>
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden">
                {/* Profile header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {currentUser.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{currentUser}</p>
                  </div>
                </div>

                <div className="py-1">
                  {/* Settings */}
                  <button
                    onClick={() => { setProfileOpen(false); onNavigateToSettings(); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isSettings ? 'text-[#0056b8] bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={() => { setProfileOpen(false); onLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
