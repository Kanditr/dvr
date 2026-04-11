import { useState } from 'react';
import gcLogo from '../assets/gc-logo.png';

interface LoginPageProps {
  onLogin: (displayName: string) => void;
}

// Microsoft logo SVG (4-colour flag)
function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  function toDisplayName(raw: string): string {
    // Try to format "jane.doe" → "Jane Doe", otherwise use as-is
    return raw
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || raw;
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter your username.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setError('');
    setLoading(true);
    // Mock auth: accept any non-empty credentials
    setTimeout(() => {
      setLoading(false);
      onLogin(toDisplayName(username.trim()));
    }, 800);
  }

  function handleMicrosoftLogin() {
    setError('');
    setMsLoading(true);
    // Mock: Microsoft SSO resolves to Jane Doe
    setTimeout(() => {
      setMsLoading(false);
      onLogin('Jane Doe');
    }, 1000);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `
          radial-gradient(ellipse 90% 70% at 10% 55%, #0d3460 0%, transparent 60%),
          radial-gradient(ellipse 70% 90% at 88% 20%, #082952 0%, transparent 55%),
          radial-gradient(ellipse 80% 60% at 55% 95%, #0a3058 0%, transparent 60%),
          radial-gradient(ellipse 60% 80% at 75% 65%, #061e3a 0%, transparent 55%),
          radial-gradient(ellipse 50% 50% at 30% 15%, #0e3d6e 0%, transparent 50%),
          #071525
        `,
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 w-full max-w-sm mx-4">

        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img src={gcLogo} alt="GC Logo" className="h-14 w-auto object-contain" />
        </div>

        {/* Title */}
        <h1 className="text-center text-lg font-bold text-gray-800 mb-7">
          Document Verification
        </h1>

        <form onSubmit={handleLogin} noValidate>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter username"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#0056b8] focus:ring-1 focus:ring-[#0056b8] transition-colors"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter password"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#0056b8] focus:ring-1 focus:ring-[#0056b8] transition-colors"
            />
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between mb-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#0056b8] cursor-pointer"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-[#0056b8] hover:underline"
              onClick={() => {}}
            >
              Forgot password?
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 mb-3 -mt-2">{error}</p>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0056b8] text-white text-sm font-semibold rounded-md hover:bg-[#004a9f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Signing in…
              </>
            ) : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Microsoft login */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={msLoading}
          className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
        >
          {msLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Connecting…
            </>
          ) : (
            <>
              <MicrosoftIcon />
              Login with Microsoft Account
            </>
          )}
        </button>

      </div>
    </div>
  );
}
