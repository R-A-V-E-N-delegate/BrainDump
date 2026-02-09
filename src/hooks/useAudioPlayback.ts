import { useCallback, useRef } from 'react';

interface UseAudioPlaybackOptions {
  sampleRate?: number;
}

export function useAudioPlayback(options: UseAudioPlaybackOptions = {}) {
  const { sampleRate = 24000 } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext({ sampleRate });
    }
    return audioContextRef.current;
  }, [sampleRate]);

  const playAudio = useCallback((audioData: ArrayBuffer) => {
    const audioContext = getAudioContext();

    // Convert PCM data to AudioBuffer
    // Assuming 16-bit PCM at 24kHz
    const pcm16 = new Int16Array(audioData);
    const floatData = new Float32Array(pcm16.length);

    for (let i = 0; i < pcm16.length; i++) {
      floatData[i] = pcm16[i] / 32768;
    }

    const audioBuffer = audioContext.createBuffer(1, floatData.length, sampleRate);
    audioBuffer.getChannelData(0).set(floatData);

    // Queue the buffer
    audioQueueRef.current.push(audioBuffer);

    // Start playback if not already playing
    if (!isPlayingRef.current) {
      playNextBuffer(audioContext);
    }
  }, [getAudioContext, sampleRate]);

  const playNextBuffer = useCallback((audioContext: AudioContext) => {
    const buffer = audioQueueRef.current.shift();
    if (!buffer) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    // Schedule playback
    const startTime = Math.max(audioContext.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    // Play next buffer when this one ends
    source.onended = () => {
      playNextBuffer(audioContext);
    };
  }, []);

  const stopPlayback = useCallback(() => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextStartTimeRef.current = 0;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    playAudio,
    stopPlayback,
  };
}
