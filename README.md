# BrainDump 🧠

Voice-first document editor. Talk to an AI, watch it write in real-time.

No keyboard needed. Just speak your thoughts, and they appear as a structured document. Refine with verbal commands like "make this more concise" or "move that up."

## Features

- **Voice-to-Document**: Speak freely, AI organizes your thoughts into markdown
- **Selection Context**: Highlight text, then speak to edit just that part
- **Real-time Updates**: Watch the document change as you talk
- **Verbal Commands**: "Rephrase this", "delete the last point", "add a header"
- **Undo/Redo**: Full history with Cmd+Z / Cmd+Shift+Z
- **Export**: Download your document as markdown

## Tech Stack

- React + Vite + TypeScript + Tailwind
- Gemini 2.5 Flash Live API (real-time voice)
- Zustand for state management

## Getting Started

1. Clone and install:
```bash
git clone https://github.com/R-A-V-E-N-delegate/BrainDump.git
cd BrainDump
npm install
```

2. Start the dev server:
```bash
npm run dev
```

3. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

4. Enter your API key when prompted

5. Click the mic and start talking!

## How It Works

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
├──────────────────┬──────────────────────────────┤
│   Voice Panel    │      Document Panel          │
│                  │                              │
│  [Mic Button]    │  # Your Document             │
│  [Visualizer]    │  - Point 1                   │
│  [Context]       │  - Point 2                   │
│                  │                              │
└──────────────────┴──────────────────────────────┘
         │                      ▲
         │ Audio Stream         │ Document Updates
         ▼                      │
┌─────────────────────────────────────────────────┐
│           Gemini 2.5 Flash Live API             │
│  (WebSocket - bidirectional audio + text)       │
└─────────────────────────────────────────────────┘
```

The Gemini Live API maintains a persistent WebSocket connection for low-latency voice conversation. When you speak, audio streams to Gemini, which:
1. Transcribes your speech
2. Understands the intent (add content, edit selection, restructure)
3. Calls the `update_document` tool with new markdown
4. Responds with voice confirmation

## Selection Context

The killer feature: **highlight text to give Gemini context**.

When you select text in the document:
- A context indicator appears in the voice panel
- Gemini receives the selection as context
- Commands like "make this shorter" apply only to the selection
- The rest of the document stays unchanged

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘Z | Undo |
| ⌘⇧Z | Redo |
| ⌘Y | Redo (alt) |

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## License

MIT
