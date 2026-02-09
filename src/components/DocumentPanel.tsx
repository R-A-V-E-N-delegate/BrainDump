import { useCallback, useEffect, useRef, useState } from 'react';
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
    setContent,
    setSelection,
    clearSelection
  } = useDocumentStore();

  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  // Track the previous content to detect external changes
  const [prevContent, setPrevContent] = useState(content);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Sync editValue when content changes externally (e.g., from voice)
  // Using state comparison pattern instead of useEffect with setState
  if (!isEditing && content !== prevContent) {
    setPrevContent(content);
    setEditValue(content);
  }

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  // Handle text selection in preview mode
  const handleSelectionChange = useCallback(() => {
    if (isEditing) return; // Don't track selection in edit mode

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !contentRef.current) {
      return;
    }

    const range = sel.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText) {
      clearSelection();
      return;
    }

    const startOffset = content.indexOf(selectedText);
    const endOffset = startOffset >= 0 ? startOffset + selectedText.length : -1;

    setSelection({
      text: selectedText,
      startOffset,
      endOffset,
    });
  }, [content, setSelection, clearSelection, isEditing]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Toggle edit mode
  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      // Save changes when exiting edit mode
      if (editValue !== content) {
        setContent(editValue);
      }
      setIsEditing(false);
    } else {
      setEditValue(content);
      setIsEditing(true);
      clearSelection();
    }
  }, [isEditing, editValue, content, setContent, clearSelection]);

  // Handle textarea changes
  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
  }, []);

  // Handle keyboard shortcuts in edit mode
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape to exit edit mode
    if (e.key === 'Escape') {
      e.preventDefault();
      // Discard changes
      setEditValue(content);
      setIsEditing(false);
    }
    // Cmd/Ctrl + Enter to save and exit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (editValue !== content) {
        setContent(editValue);
      }
      setIsEditing(false);
    }
  }, [content, editValue, setContent]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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

          {/* Edit mode indicator */}
          {isEditing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-300">Editing</span>
            </div>
          )}

          {/* Selection indicator */}
          {!isEditing && selection && (
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
          {/* Edit toggle */}
          <button
            onClick={handleToggleEdit}
            className={`p-2 rounded-lg transition-colors ${
              isEditing
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'hover:bg-slate-700 text-slate-300'
            }`}
            title={isEditing ? 'Exit edit mode (Esc)' : 'Edit document'}
          >
            {isEditing ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-slate-700" />

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

      {/* Document content / Editor */}
      {isEditing ? (
        /* Edit mode - textarea */
        <div className="flex-1 overflow-hidden p-4">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={handleEditChange}
            onKeyDown={handleEditKeyDown}
            className="w-full h-full bg-slate-800/50 text-slate-200 font-mono text-sm p-4 rounded-lg border border-slate-700 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none resize-none"
            placeholder="Type or paste your content here...

Use Markdown formatting:
# Heading 1
## Heading 2
- Bullet points
1. Numbered lists
**bold** and *italic*

Press Cmd+Enter to save, Esc to cancel"
          />
          <div className="mt-2 text-xs text-slate-500 flex justify-between">
            <span>Markdown supported</span>
            <span>⌘↵ Save • Esc Cancel</span>
          </div>
        </div>
      ) : (
        /* Preview mode - rendered markdown */
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
                  Click the mic to speak, or click the edit button to type directly.
                </p>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="text-xs font-medium text-slate-400 mb-1">🎤 Voice</div>
                    <p className="text-xs text-slate-500">"Add a section about marketing"</p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="text-xs font-medium text-slate-400 mb-1">✏️ Type</div>
                    <p className="text-xs text-slate-500">Click edit to type or paste</p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="text-xs font-medium text-slate-400 mb-1">Select + speak</div>
                    <p className="text-xs text-slate-500">Highlight, then "make shorter"</p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                    <div className="text-xs font-medium text-slate-400 mb-1">Organize</div>
                    <p className="text-xs text-slate-500">"Move that section up"</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer with word count and selection info */}
      {(content || isEditing) && (
        <div className="px-4 py-2 border-t border-slate-700/50 text-xs text-slate-500 flex justify-between">
          <span>
            {(isEditing ? editValue : content).split(/\s+/).filter(Boolean).length} words
            {!isEditing && (
              <>
                {' • '}
                {history.length} revisions
              </>
            )}
          </span>
          {!isEditing && selection && (
            <span className="text-blue-400">
              {selection.text.split(/\s+/).filter(Boolean).length} words selected
            </span>
          )}
          {isEditing && (
            <span className="text-amber-400">
              Editing • ⌘↵ to save
            </span>
          )}
        </div>
      )}
    </div>
  );
}
