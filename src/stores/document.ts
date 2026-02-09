import { create } from 'zustand';

export interface TextSelection {
  text: string;           // The selected text
  startOffset: number;    // Character offset from start of document
  endOffset: number;      // Character offset for end of selection
}

interface DocumentState {
  content: string;
  history: string[];
  historyIndex: number;

  // Selection tracking
  selection: TextSelection | null;

  // Actions
  setContent: (content: string) => void;
  appendContent: (text: string) => void;
  setSelection: (selection: TextSelection | null) => void;
  clearSelection: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const MAX_HISTORY = 50;

export const useDocumentStore = create<DocumentState>((set, get) => ({
  content: '',
  history: [''],
  historyIndex: 0,
  selection: null,

  setContent: (content: string) => {
    const { history, historyIndex } = get();

    // Don't add duplicate entries
    if (content === history[historyIndex]) return;

    // Truncate future history and add new entry
    const newHistory = [...history.slice(0, historyIndex + 1), content].slice(-MAX_HISTORY);

    set({
      content,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selection: null, // Clear selection when content changes
    });
  },

  appendContent: (text: string) => {
    const { content, setContent } = get();
    const newContent = content ? `${content}\n\n${text}` : text;
    setContent(newContent);
  },

  setSelection: (selection: TextSelection | null) => {
    set({ selection });
  },

  clearSelection: () => {
    set({ selection: null });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        content: history[newIndex],
        historyIndex: newIndex,
        selection: null,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        content: history[newIndex],
        historyIndex: newIndex,
        selection: null,
      });
    }
  },

  clear: () => {
    set({
      content: '',
      history: [''],
      historyIndex: 0,
      selection: null,
    });
  },
}));
