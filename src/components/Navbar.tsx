import { useState, useRef, useEffect } from 'react';
import gcLogo from '../assets/gc-logo.png';

interface NavbarProps {
  currentUser: string;
  onNavigateHome: () => void;
  onLogout: () => void;
}

export default function Navbar({ currentUser, onNavigateHome, onLogout }: NavbarProps) {

  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  function handleConfirmLogout() {
    setLoggingOut(true);
    setTimeout(() => onLogout(), 1000);
  }

  function handleCancelLogout() {
    setShowLogoutConfirm(false);
    setLoggingOut(false);
    setCountdown(3);
  }

  const initials = currentUser.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={gcLogo} alt="GC Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={onNavigateHome} />
          <span className="text-sm font-bold text-gray-700 cursor-pointer" onClick={onNavigateHome}>Document Verification</span>
        </div>

        <div />

        {/* Right: User avatar */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
                {initials}
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
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{currentUser}</p>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setProfileOpen(false); setShowLogoutConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>

    {/* Logout confirmation modal */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={!loggingOut ? handleCancelLogout : undefined} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">

          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>

          {!loggingOut ? (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Confirm Logout</h3>
              <p className="text-xs text-gray-500 mb-6">
                Are you sure you want to logout? You will be returned to the login screen.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelLogout}
                  className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="px-4 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-2 gap-3">
              <svg className="w-7 h-7 animate-spin text-red-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">Logging out…</p>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
