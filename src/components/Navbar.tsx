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
  }

  const initials = currentUser.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
    <nav className="bg-white" style={{ boxShadow: 'var(--os-shadow-nav)' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={gcLogo} alt="GC Logo" className="h-8 w-auto object-contain cursor-pointer" onClick={onNavigateHome} />
          <span className="hidden sm:block text-sm font-semibold cursor-pointer" style={{ color: 'var(--os-text-primary)' }} onClick={onNavigateHome}>Document Verification</span>
        </div>

        <div />

        {/* Right: User avatar */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: 'var(--os-primary)' }}>
                {initials}
              </div>
              <span className="hidden sm:block text-sm" style={{ color: 'var(--os-text-secondary)' }}>{currentUser}</span>
              <svg className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--os-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg z-50 overflow-hidden" style={{ border: '1px solid var(--os-border)', boxShadow: 'var(--os-shadow-md)' }}>
                {/* Profile header */}
                <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--os-border)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: 'var(--os-primary)' }}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--os-text-primary)' }}>{currentUser}</p>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setProfileOpen(false); setShowLogoutConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-50"
                    style={{ color: 'var(--os-error)' }}
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
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/30" onClick={!loggingOut ? handleCancelLogout : undefined} />
        <div className="relative bg-white rounded-xl w-full max-w-sm p-6" style={{ boxShadow: 'var(--os-shadow-md)' }}>

          {/* Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--os-error-light)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--os-error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>

          {!loggingOut ? (
            <>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--os-text-primary)' }}>Confirm Logout</h3>
              <p className="text-xs mb-6" style={{ color: 'var(--os-text-muted)' }}>
                Are you sure you want to logout? You will be returned to the login screen.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelLogout}
                  className="px-4 py-1.5 text-sm rounded transition-colors hover:bg-gray-50"
                  style={{ color: 'var(--os-text-secondary)', border: '1px solid var(--os-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="px-4 py-1.5 text-sm text-white rounded transition-colors"
                  style={{ backgroundColor: 'var(--os-error)' }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#b81a1a')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = 'var(--os-error)')}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-2 gap-3">
              <svg className="w-7 h-7 animate-spin" style={{ color: 'var(--os-error)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--os-text-secondary)' }}>Logging out…</p>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
