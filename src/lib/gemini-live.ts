/**
 * Gemini Live API WebSocket Client
 *
 * Handles bidirectional audio streaming with Gemini 2.5 Flash.
 * Audio format: 16kHz PCM input, 24kHz output
 */

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAudioResponse?: (audioData: ArrayBuffer) => void;
  onDocumentUpdate?: (content: string) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface BidiMessage {
  setup?: {
    model: string;
    generationConfig?: {
      responseModalities?: string[];
      speechConfig?: {
        voiceConfig?: {
          prebuiltVoiceConfig?: {
            voiceName?: string;
          };
        };
      };
    };
    systemInstruction?: {
      parts: { text: string }[];
    };
    tools?: Array<{
      functionDeclarations: Array<{
        name: string;
        description: string;
        parameters?: object;
      }>;
    }>;
  };
  realtimeInput?: {
    audio?: {
      mimeType: string;
      data: string; // base64
    };
  };
  clientContent?: {
    turns: Array<{
      role: string;
      parts: { text: string }[];
    }>;
    turnComplete: boolean;
  };
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private config: GeminiLiveConfig;
  private isSetupComplete = false;
  private pendingAudio: string[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const model = this.config.model || 'gemini-2.0-flash-live-001';
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[GeminiLive] WebSocket connected');
          this.sendSetup(model);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
          if (this.isSetupComplete && !this.ws) {
            resolve();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[GeminiLive] WebSocket error:', error);
          this.config.onError?.(new Error('WebSocket connection failed'));
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[GeminiLive] WebSocket closed:', event.code, event.reason);
          this.isSetupComplete = false;
          this.config.onConnectionChange?.(false);

          // Auto-reconnect on unexpected close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[GeminiLive] Reconnecting (attempt ${this.reconnectAttempts})...`);
            setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
          }
        };

        // Setup complete will resolve the promise
        const checkSetup = setInterval(() => {
          if (this.isSetupComplete) {
            clearInterval(checkSetup);
            this.reconnectAttempts = 0;
            resolve();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkSetup);
          if (!this.isSetupComplete) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private sendSetup(model: string): void {
    const systemPrompt = this.config.systemInstruction || this.getDefaultSystemPrompt();

    const setupMessage: BidiMessage = {
      setup: {
        model: `models/${model}`,
        generationConfig: {
          responseModalities: ['AUDIO', 'TEXT'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede', // Natural-sounding voice
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        tools: [{
          functionDeclarations: [{
            name: 'update_document',
            description: 'Update the document content. Call this whenever the user wants to add, modify, or reorganize content in their document.',
            parameters: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The full updated document content in markdown format',
                },
                action: {
                  type: 'string',
                  enum: ['replace', 'append', 'prepend'],
                  description: 'How to apply the update',
                },
              },
              required: ['content'],
            },
          }],
        }],
      },
    };

    this.ws?.send(JSON.stringify(setupMessage));
  }

  private getDefaultSystemPrompt(): string {
    return `You are a voice-activated document assistant for brain dumping ideas.

Your role:
1. Listen to the user speak their thoughts
2. Organize their ideas into a clear, structured document
3. Use the update_document function to modify the document in real-time

Guidelines:
- Keep responses brief and conversational (1-2 sentences)
- Focus on DOING the work, not explaining what you'll do
- When the user shares ideas, immediately add them to the document
- Structure content with headers, bullet points, and clear organization
- Understand commands like "move that up", "rephrase that", "delete the last point"
- The document should be in markdown format

Start by greeting the user briefly and asking what they'd like to work on.`;
  }

  private handleMessage(data: string | ArrayBuffer): void {
    try {
      // Handle binary audio data
      if (data instanceof ArrayBuffer) {
        this.config.onAudioResponse?.(data);
        return;
      }

      const message = JSON.parse(data);

      // Setup complete
      if (message.setupComplete) {
        console.log('[GeminiLive] Setup complete');
        this.isSetupComplete = true;
        this.config.onConnectionChange?.(true);

        // Send any pending audio
        this.pendingAudio.forEach(audio => this.sendAudio(audio));
        this.pendingAudio = [];
        return;
      }

      // Handle server content (transcripts, responses)
      if (message.serverContent) {
        const content = message.serverContent;

        // Model turn (AI response)
        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            // Text response
            if (part.text) {
              this.config.onTranscript?.(part.text, content.turnComplete || false);
            }
            // Inline audio data (base64)
            if (part.inlineData?.mimeType?.startsWith('audio/')) {
              const audioData = this.base64ToArrayBuffer(part.inlineData.data);
              this.config.onAudioResponse?.(audioData);
            }
          }
        }

        // Input transcript (what user said)
        if (content.inputTranscript) {
          console.log('[GeminiLive] User said:', content.inputTranscript);
        }
      }

      // Handle tool calls
      if (message.toolCall) {
        this.handleToolCall(message.toolCall);
      }

      // Handle disconnection notice
      if (message.goAway) {
        console.log('[GeminiLive] Server requested disconnect:', message.goAway.timeLeft);
        this.disconnect();
      }

    } catch (error) {
      console.error('[GeminiLive] Error parsing message:', error);
    }
  }

  private handleToolCall(toolCall: { functionCalls?: Array<{ name: string; args: any; id: string }> }): void {
    if (!toolCall.functionCalls) return;

    for (const call of toolCall.functionCalls) {
      if (call.name === 'update_document') {
        const content = call.args?.content || '';
        console.log('[GeminiLive] Document update:', content.substring(0, 100) + '...');
        this.config.onDocumentUpdate?.(content);

        // Send tool response
        this.sendToolResponse(call.id, { success: true });
      }
    }
  }

  private sendToolResponse(callId: string, result: object): void {
    const response = {
      toolResponse: {
        functionResponses: [{
          id: callId,
          response: result,
        }],
      },
    };
    this.ws?.send(JSON.stringify(response));
  }

  sendAudio(base64Audio: string): void {
    if (!this.isSetupComplete) {
      this.pendingAudio.push(base64Audio);
      return;
    }

    const message: BidiMessage = {
      realtimeInput: {
        audio: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64Audio,
        },
      },
    };
    this.ws?.send(JSON.stringify(message));
  }

  sendText(text: string): void {
    if (!this.isSetupComplete) return;

    const message: BidiMessage = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }],
        }],
        turnComplete: true,
      },
    };
    this.ws?.send(JSON.stringify(message));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isSetupComplete = false;
    this.config.onConnectionChange?.(false);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isSetupComplete;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Convert Float32Array audio samples to base64 PCM
 */
export function audioToBase64(samples: Float32Array, _targetSampleRate = 16000): string {
  // Convert float samples to 16-bit PCM
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  // Convert to base64
  const bytes = new Uint8Array(pcm.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
