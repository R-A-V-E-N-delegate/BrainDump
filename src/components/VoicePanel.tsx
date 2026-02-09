import { useCallback, useEffect, useRef } from 'react';
import { GeminiLiveClient } from '../lib/gemini-live';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useVoiceStore } from '../stores/voice';
import { useDocumentStore } from '../stores/document';

interface VoicePanelProps {
  apiKey: string;
}

export function VoicePanel({ apiKey }: VoicePanelProps) {
  const clientRef = useRef<GeminiLiveClient | null>(null);

  const {
    status,
    isRecording,
    isMuted,
    aiResponse,
    setStatus,
    setError,
    setRecording,
    setMuted,
    setAiResponse,
  } = useVoiceStore();

  const { setContent } = useDocumentStore();
  const { playAudio, stopPlayback } = useAudioPlayback();

  // Audio capture with streaming to Gemini
  const { startCapture, stopCapture } = useAudioCapture({
    onAudioData: (base64Audio) => {
      if (!isMuted && clientRef.current?.isConnected()) {
        clientRef.current.sendAudio(base64Audio);
      }
    },
  });

  // Initialize Gemini client
  useEffect(() => {
    if (!apiKey) return;

    const client = new GeminiLiveClient({
      apiKey,
      onTranscript: (text, _isFinal) => {
        setAiResponse(text);
      },
      onAudioResponse: (audioData) => {
        playAudio(audioData);
      },
      onDocumentUpdate: (content) => {
        setContent(content);
      },
      onError: (error) => {
        setError(error.message);
      },
      onConnectionChange: (connected) => {
        setStatus(connected ? 'connected' : 'disconnected');
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [apiKey, setStatus, setError, setAiResponse, setContent, playAudio]);

  // Connect to Gemini
  const handleConnect = useCallback(async () => {
    if (!clientRef.current) return;

    setStatus('connecting');
    try {
      await clientRef.current.connect();
      // Start audio capture once connected
      await startCapture();
      setRecording(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [setStatus, setError, setRecording, startCapture]);

  // Disconnect from Gemini
  const handleDisconnect = useCallback(() => {
    stopCapture();
    stopPlayback();
    clientRef.current?.disconnect();
    setRecording(false);
  }, [stopCapture, stopPlayback, setRecording]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  // Status indicator color
  const statusColor = {
    disconnected: 'bg-gray-500',
    connecting: 'bg-yellow-500 animate-pulse',
    connected: 'bg-green-500',
    error: 'bg-red-500',
  }[status];

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColor}`} />
          <span className="text-sm font-medium text-slate-300 capitalize">{status}</span>
        </div>
      </div>

      {/* Main control area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Mic button */}
        <button
          onClick={status === 'connected' ? handleDisconnect : handleConnect}
          disabled={status === 'connecting'}
          className={`
            w-32 h-32 rounded-full flex items-center justify-center
            transition-all duration-300 ease-out
            ${status === 'connected'
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-green-500/50'
              : status === 'connecting'
              ? 'bg-gradient-to-br from-yellow-500 to-amber-600 cursor-wait'
              : 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-blue-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30'
            }
          `}
        >
          <svg
            className={`w-12 h-12 text-white ${status === 'connected' && isRecording ? 'animate-pulse' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>

        {/* Mute button (only when connected) */}
        {status === 'connected' && (
          <button
            onClick={handleToggleMute}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isMuted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }
            `}
          >
            {isMuted ? '🔇 Muted' : '🔊 Mute'}
          </button>
        )}

        {/* Instructions */}
        <p className="text-slate-400 text-sm text-center max-w-[200px]">
          {status === 'disconnected' && 'Click the mic to start'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Speak your thoughts'}
          {status === 'error' && 'Connection error'}
        </p>
      </div>

      {/* AI Response area */}
      {aiResponse && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-xs font-medium text-slate-500 mb-2">AI Response</div>
          <p className="text-slate-300 text-sm">{aiResponse}</p>
        </div>
      )}

      {/* Error display */}
      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{useVoiceStore.getState().error}</p>
        </div>
      )}
    </div>
  );
}
