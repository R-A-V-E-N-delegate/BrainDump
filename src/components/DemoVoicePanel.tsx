import { useCallback, useState, useRef } from 'react';
import { useDocumentStore } from '../stores/document';
import { AudioVisualizer } from './AudioVisualizer';

/**
 * Demo version of VoicePanel that simulates AI interactions.
 * Allows users to test the UI without a real API key.
 */

interface DemoScenario {
  userPrompt: string;
  aiResponse: string;
  documentContent: string;
}

const demoScenarios: DemoScenario[] = [
  {
    userPrompt: "Let's brainstorm some app ideas",
    aiResponse: "Great! Let me start capturing your app ideas. What's the first one on your mind?",
    documentContent: `# App Ideas Brainstorm

*Brain dump session started...*`
  },
  {
    userPrompt: "A habit tracker with gamification",
    aiResponse: "Love it! A gamified habit tracker. I've added that to your document.",
    documentContent: `# App Ideas Brainstorm

## 1. Gamified Habit Tracker

A mobile app that turns daily habits into a game:
- XP points for completing habits
- Level up system with unlockable features
- Streak bonuses and achievements
- Social challenges with friends`
  },
  {
    userPrompt: "Also maybe a recipe app that learns what you like",
    aiResponse: "Nice! An AI-powered recipe recommender. Added to the list.",
    documentContent: `# App Ideas Brainstorm

## 1. Gamified Habit Tracker

A mobile app that turns daily habits into a game:
- XP points for completing habits
- Level up system with unlockable features
- Streak bonuses and achievements
- Social challenges with friends

## 2. Smart Recipe App

An app that learns your taste preferences:
- Swipe-based rating system
- AI-generated meal plans
- Ingredient substitution suggestions
- Automatic grocery list generation`
  },
  {
    userPrompt: "Make that second section more concise",
    aiResponse: "Done! I've tightened up the recipe app section.",
    documentContent: `# App Ideas Brainstorm

## 1. Gamified Habit Tracker

A mobile app that turns daily habits into a game:
- XP points for completing habits
- Level up system with unlockable features
- Streak bonuses and achievements
- Social challenges with friends

## 2. Smart Recipe App

Learn-your-taste recipe app with:
- Swipe ratings & AI meal plans
- Smart ingredient substitutions
- Auto grocery lists`
  },
  {
    userPrompt: "Add a conclusion with next steps",
    aiResponse: "Perfect, I've added next steps at the end.",
    documentContent: `# App Ideas Brainstorm

## 1. Gamified Habit Tracker

A mobile app that turns daily habits into a game:
- XP points for completing habits
- Level up system with unlockable features
- Streak bonuses and achievements
- Social challenges with friends

## 2. Smart Recipe App

Learn-your-taste recipe app with:
- Swipe ratings & AI meal plans
- Smart ingredient substitutions
- Auto grocery lists

---

## Next Steps

1. **Validate ideas** - Survey 10 potential users
2. **Pick one** - Choose based on feasibility and interest
3. **Build MVP** - 2-week sprint for core features
4. **Test & iterate** - Get feedback, improve, repeat`
  }
];

export function DemoVoicePanel() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { setContent, selection, clearSelection } = useDocumentStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runNextStep = useCallback(async () => {
    if (currentStep >= demoScenarios.length) {
      setIsActive(false);
      setAiResponse("Demo complete! Try selecting text and clicking again to see context-aware editing.");
      return;
    }

    setIsProcessing(true);
    const scenario = demoScenarios[currentStep];

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Show AI response
    setAiResponse(scenario.aiResponse);

    // Update document
    setContent(scenario.documentContent);

    setIsProcessing(false);
    setCurrentStep(prev => prev + 1);
  }, [currentStep, setContent]);

  const handleMicClick = useCallback(() => {
    if (isActive) {
      // Stop the demo
      setIsActive(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Start the demo
    setIsActive(true);
    setAiResponse(null);

    // If there's a selection, show a context-aware demo response
    if (selection) {
      setIsProcessing(true);
      setTimeout(() => {
        setAiResponse(`Got it! I'll modify the selected text: "${selection.text.substring(0, 30)}${selection.text.length > 30 ? '...' : ''}"`);
        setIsProcessing(false);
        clearSelection();
        setTimeout(() => setIsActive(false), 2000);
      }, 1000);
      return;
    }

    // Run the scripted demo
    runNextStep();
  }, [isActive, selection, runNextStep, clearSelection]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setAiResponse(null);
    setIsActive(false);
    setContent('');
  }, [setContent]);

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-purple-500'}`} />
          <span className="text-sm font-medium text-slate-300">
            {isActive ? 'Active' : 'Demo Mode'}
          </span>
        </div>
        {currentStep > 0 && (
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Reset Demo
          </button>
        )}
      </div>

      {/* Main control area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Mic button */}
        <button
          onClick={handleMicClick}
          disabled={isProcessing}
          className={`
            w-32 h-32 rounded-full flex items-center justify-center
            transition-all duration-300 ease-out
            ${isActive
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'
              : isProcessing
              ? 'bg-gradient-to-br from-purple-500 to-pink-600 cursor-wait'
              : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/30'
            }
          `}
        >
          <svg
            className={`w-12 h-12 text-white ${isProcessing ? 'animate-pulse' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>

        {/* Audio visualizer */}
        {isActive && !isProcessing && (
          <AudioVisualizer isActive={true} />
        )}

        {/* Selection context indicator */}
        {selection && (
          <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg animate-pulse">
            <span className="text-xs text-blue-300">
              Context: "{selection.text.substring(0, 30)}{selection.text.length > 30 ? '...' : ''}"
            </span>
          </div>
        )}

        {/* Demo progress */}
        <div className="flex gap-1">
          {demoScenarios.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i < currentStep
                  ? 'bg-purple-500'
                  : i === currentStep && isProcessing
                  ? 'bg-purple-500 animate-pulse'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Instructions */}
        <p className="text-slate-400 text-sm text-center max-w-[200px]">
          {isProcessing
            ? 'Processing...'
            : isActive
            ? 'Click to stop'
            : currentStep === 0
            ? 'Click to start demo'
            : currentStep >= demoScenarios.length
            ? 'Demo complete!'
            : 'Click to continue'
          }
        </p>
      </div>

      {/* AI Response area */}
      {aiResponse && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="text-xs font-medium text-purple-400 mb-2">AI Response (Demo)</div>
          <p className="text-slate-300 text-sm">{aiResponse}</p>
        </div>
      )}

      {/* Demo info */}
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-purple-300 text-xs text-center">
          This is a simulated demo. Enter a Gemini API key for real voice interaction.
        </p>
      </div>
    </div>
  );
}
