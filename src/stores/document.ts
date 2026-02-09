import { create } from 'zustand';

interface DocumentState {
  content: string;
  history: string[];
  historyIndex: number;

  // Actions
  setContent: (content: string) => void;
  appendContent: (text: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const MAX_HISTORY = 50;

export const useDocumentStore = create<DocumentState>((set, get) => ({
  content: '',
  history: [''],
  historyIndex: 0,

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
    });
  },

  appendContent: (text: string) => {
    const { content, setContent } = get();
    const newContent = content ? `${content}\n\n${text}` : text;
    setContent(newContent);
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        content: history[newIndex],
        historyIndex: newIndex,
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
      });
    }
  },

  clear: () => {
    set({
      content: '',
      history: [''],
      historyIndex: 0,
    });
  },
}));
