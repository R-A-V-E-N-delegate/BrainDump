import { useState, useEffect } from 'react';
import { VoicePanel } from './components/VoicePanel';
import { DocumentPanel } from './components/DocumentPanel';
import { ApiKeyInput } from './components/ApiKeyInput';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Check for saved API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('braindump_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Handle logout/clear API key
  const handleLogout = () => {
    localStorage.removeItem('braindump_api_key');
    setApiKey(null);
  };

  // Show API key input if not set
  if (!apiKey) {
    return <ApiKeyInput onSubmit={setApiKey} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">BrainDump</h1>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Change API Key
        </button>
      </header>

      {/* Main content - split view */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Voice panel - left side */}
        <div className="w-80 flex-shrink-0">
          <VoicePanel apiKey={apiKey} />
        </div>

        {/* Document panel - right side (expands) */}
        <div className="flex-1 min-w-0">
          <DocumentPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
