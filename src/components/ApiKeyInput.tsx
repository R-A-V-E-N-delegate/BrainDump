import { useState, useCallback } from 'react';

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
}

export function ApiKeyInput({ onSubmit }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    // Basic validation - Gemini API keys start with specific prefixes
    if (!apiKey.startsWith('AIza')) {
      setError('Invalid API key format. Gemini API keys start with "AIza"');
      return;
    }

    // Save to localStorage for convenience
    localStorage.setItem('braindump_api_key', apiKey);
    onSubmit(apiKey);
  }, [apiKey, onSubmit]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BrainDump</h1>
          <p className="text-slate-400">Voice-powered document creation</p>
        </div>

        {/* API Key Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder="AIza..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
          >
            Get Started
          </button>

          <p className="mt-4 text-xs text-slate-500 text-center">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </form>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white">Voice First</h3>
            <p className="text-xs text-slate-400 mt-1">Just talk, AI writes</p>
          </div>

          <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white">Real-time</h3>
            <p className="text-xs text-slate-400 mt-1">See changes instantly</p>
          </div>

          <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white">Refine Verbally</h3>
            <p className="text-xs text-slate-400 mt-1">Edit with commands</p>
          </div>

          <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white">Local Key</h3>
            <p className="text-xs text-slate-400 mt-1">Your key stays private</p>
          </div>
        </div>
      </div>
    </div>
  );
}
