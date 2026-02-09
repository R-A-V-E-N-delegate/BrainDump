import { create } from 'zustand';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface VoiceState {
  // Connection
  status: ConnectionStatus;
  error: string | null;

  // Recording
  isRecording: boolean;
  isMuted: boolean;

  // Transcript
  transcript: string;
  aiResponse: string;

  // Actions
  setStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  setRecording: (isRecording: boolean) => void;
  setMuted: (isMuted: boolean) => void;
  setTranscript: (transcript: string) => void;
  appendTranscript: (text: string) => void;
  setAiResponse: (response: string) => void;
  clearTranscript: () => void;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  status: 'disconnected',
  error: null,
  isRecording: false,
  isMuted: false,
  transcript: '',
  aiResponse: '',

  setStatus: (status) => set({ status, error: status === 'error' ? get().error : null }),
  setError: (error) => set({ error, status: error ? 'error' : get().status }),
  setRecording: (isRecording) => set({ isRecording }),
  setMuted: (isMuted) => set({ isMuted }),
  setTranscript: (transcript) => set({ transcript }),
  appendTranscript: (text) => set({ transcript: get().transcript + text }),
  setAiResponse: (aiResponse) => set({ aiResponse }),
  clearTranscript: () => set({ transcript: '', aiResponse: '' }),
}));
