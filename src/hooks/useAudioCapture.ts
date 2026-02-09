import { useCallback, useRef, useState } from 'react';
import { audioToBase64 } from '../lib/gemini-live';

interface UseAudioCaptureOptions {
  onAudioData?: (base64Audio: string) => void;
  sampleRate?: number;
  bufferSize?: number;
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}) {
  const { onAudioData, sampleRate = 16000, bufferSize = 4096 } = options;

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: sampleRate },
          channelCount: { exact: 1 },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      // Create source from stream
      const source = audioContext.createMediaStreamSource(stream);

      // Create processor for capturing audio data
      // Note: ScriptProcessorNode is deprecated but AudioWorklet requires more setup
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      // Resampling buffer for converting to target sample rate
      let resampleBuffer: Float32Array[] = [];

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // If sample rates match, send directly
        if (audioContext.sampleRate === sampleRate) {
          const base64 = audioToBase64(inputData);
          onAudioData?.(base64);
        } else {
          // Resample to target rate
          resampleBuffer.push(new Float32Array(inputData));

          // Process when we have enough data
          const totalSamples = resampleBuffer.reduce((sum, buf) => sum + buf.length, 0);
          const targetSamples = Math.floor(totalSamples * (sampleRate / audioContext.sampleRate));

          if (targetSamples >= bufferSize) {
            // Combine buffers
            const combined = new Float32Array(totalSamples);
            let offset = 0;
            for (const buf of resampleBuffer) {
              combined.set(buf, offset);
              offset += buf.length;
            }

            // Simple linear interpolation resampling
            const resampled = new Float32Array(targetSamples);
            const ratio = (combined.length - 1) / (targetSamples - 1);

            for (let i = 0; i < targetSamples; i++) {
              const srcIndex = i * ratio;
              const srcIndexFloor = Math.floor(srcIndex);
              const srcIndexCeil = Math.min(srcIndexFloor + 1, combined.length - 1);
              const t = srcIndex - srcIndexFloor;

              resampled[i] = combined[srcIndexFloor] * (1 - t) + combined[srcIndexCeil] * t;
            }

            const base64 = audioToBase64(resampled);
            onAudioData?.(base64);

            resampleBuffer = [];
          }
        }
      };

      // Connect the nodes
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsCapturing(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      console.error('[AudioCapture] Error:', err);
    }
  }, [onAudioData, sampleRate, bufferSize]);

  const stopCapture = useCallback(() => {
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Disconnect and close audio context
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsCapturing(false);
  }, []);

  return {
    isCapturing,
    error,
    startCapture,
    stopCapture,
  };
}
