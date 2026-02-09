import ReactMarkdown from 'react-markdown';
import { useDocumentStore } from '../stores/document';

export function DocumentPanel() {
  const { content, historyIndex, history, undo, redo, clear } = useDocumentStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-slate-200">Document</h2>

        <div className="flex items-center gap-2">
          {/* Undo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${
              canUndo
                ? 'hover:bg-slate-700 text-slate-300'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${
              canRedo
                ? 'hover:bg-slate-700 text-slate-300'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>

          {/* Clear */}
          <button
            onClick={clear}
            disabled={!content}
            className={`p-2 rounded-lg transition-colors ${
              content
                ? 'hover:bg-red-500/20 text-red-400'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Clear document"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Copy */}
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            disabled={!content}
            className={`p-2 rounded-lg transition-colors ${
              content
                ? 'hover:bg-slate-700 text-slate-300'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-auto p-6">
        {content ? (
          <article className="prose prose-invert prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-slate-100 mb-4 pb-2 border-b border-slate-700">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-slate-200 mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium text-slate-300 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-slate-300 leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 text-slate-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-slate-300">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-400 my-4">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300 text-sm">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-slate-800 p-4 rounded-lg text-sm overflow-x-auto">
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium mb-2">Your document will appear here</p>
              <p className="text-sm">Start speaking to add content</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with word count */}
      {content && (
        <div className="px-4 py-2 border-t border-slate-700/50 text-xs text-slate-500">
          {content.split(/\s+/).filter(Boolean).length} words
          {' • '}
          {history.length} revisions
        </div>
      )}
    </div>
  );
}
