import { useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useDocumentStore } from '../stores/document';

export function DocumentPanel() {
  const {
    content,
    historyIndex,
    history,
    selection,
    undo,
    redo,
    clear,
    setSelection,
    clearSelection
  } = useDocumentStore();

  const contentRef = useRef<HTMLDivElement>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !contentRef.current) {
      // No selection or cursor only
      return;
    }

    // Check if selection is within our content area
    const range = sel.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText) {
      clearSelection();
      return;
    }

    // Find position in the original markdown content
    // This is approximate - we match the selected text in the content
    const startOffset = content.indexOf(selectedText);
    const endOffset = startOffset >= 0 ? startOffset + selectedText.length : -1;

    setSelection({
      text: selectedText,
      startOffset,
      endOffset,
    });
  }, [content, setSelection, clearSelection]);

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Clear selection when clicking outside
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If clicking on a button or interactive element, don't clear
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-200">Document</h2>

          {/* Selection indicator */}
          {selection && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs text-blue-300 max-w-[150px] truncate">
                "{selection.text}"
              </span>
              <button
                onClick={clearSelection}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Clear selection"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

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
      <div
        ref={contentRef}
        className="flex-1 overflow-auto p-6 select-text"
        onMouseDown={handleMouseDown}
      >
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
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Ready to brain dump</h3>
              <p className="text-slate-400 mb-6">
                Click the mic and start speaking. Your thoughts will be organized into a document.
              </p>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div className="text-xs font-medium text-slate-400 mb-1">Add ideas</div>
                  <p className="text-xs text-slate-500">"Add a section about marketing"</p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div className="text-xs font-medium text-slate-400 mb-1">Edit with selection</div>
                  <p className="text-xs text-slate-500">Highlight text, then "make this shorter"</p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div className="text-xs font-medium text-slate-400 mb-1">Organize</div>
                  <p className="text-xs text-slate-500">"Move that section up"</p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <div className="text-xs font-medium text-slate-400 mb-1">Refine</div>
                  <p className="text-xs text-slate-500">"Rephrase the introduction"</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with word count and selection info */}
      {content && (
        <div className="px-4 py-2 border-t border-slate-700/50 text-xs text-slate-500 flex justify-between">
          <span>
            {content.split(/\s+/).filter(Boolean).length} words
            {' • '}
            {history.length} revisions
          </span>
          {selection && (
            <span className="text-blue-400">
              {selection.text.split(/\s+/).filter(Boolean).length} words selected
            </span>
          )}
        </div>
      )}
    </div>
  );
}
