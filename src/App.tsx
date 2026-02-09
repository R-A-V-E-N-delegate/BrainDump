import { useState, useEffect, useCallback } from 'react';
import { VoicePanel } from './components/VoicePanel';
import { DemoVoicePanel } from './components/DemoVoicePanel';
import { DocumentPanel } from './components/DocumentPanel';
import { ApiKeyInput } from './components/ApiKeyInput';
import { useDocumentStore } from './stores/document';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { content, undo, redo } = useDocumentStore();

  // Check for saved API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('braindump_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Cmd/Ctrl + Shift + Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Cmd/Ctrl + Y = Redo (alternative)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Handle logout/clear API key
  const handleLogout = () => {
    localStorage.removeItem('braindump_api_key');
    setApiKey(null);
  };

  // Export document as markdown file
  const handleExport = useCallback(() => {
    if (!content) return;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `braindump-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content]);

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

        <div className="flex items-center gap-4">
          {/* Export button */}
          {content && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-all"
              title="Export as Markdown (Cmd+S)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          )}

          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Change API Key
          </button>
        </div>
      </header>

      {/* Main content - split view */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Voice panel - left side */}
        <div className="w-80 flex-shrink-0">
          {apiKey === 'DEMO_MODE' ? (
            <DemoVoicePanel />
          ) : (
            <VoicePanel apiKey={apiKey} />
          )}
        </div>

        {/* Document panel - right side (expands) */}
        <div className="flex-1 min-w-0">
          <DocumentPanel />
        </div>
      </main>

      {/* Keyboard shortcuts hint */}
      <footer className="px-6 py-2 border-t border-slate-700/50 text-xs text-slate-500 flex justify-between">
        <div className="flex gap-4">
          <span>⌘Z Undo</span>
          <span>⌘⇧Z Redo</span>
          <span>Select text for context</span>
        </div>
        {apiKey === 'DEMO_MODE' && (
          <span className="text-purple-400 flex items-center gap-1">
            🎬 Demo Mode
          </span>
        )}
      </footer>
    </div>
  );
}

export default App;
