import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  className?: string;
}

export function AudioVisualizer({ isActive, className = '' }: AudioVisualizerProps) {
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !barsRef.current) return;

    const bars = barsRef.current.children;
    const intervals: ReturnType<typeof setInterval>[] = [];

    // Animate each bar with random heights
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i] as HTMLDivElement;
      const updateHeight = () => {
        const height = isActive ? 20 + Math.random() * 80 : 20;
        bar.style.height = `${height}%`;
      };

      // Stagger the updates
      intervals.push(setInterval(updateHeight, 100 + i * 20));
      updateHeight();
    }

    return () => {
      intervals.forEach(clearInterval);
      // Reset heights
      for (let i = 0; i < bars.length; i++) {
        (bars[i] as HTMLDivElement).style.height = '20%';
      }
    };
  }, [isActive]);

  return (
    <div
      ref={barsRef}
      className={`flex items-end justify-center gap-1 h-8 ${className}`}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-100 ${
            isActive ? 'bg-green-400' : 'bg-slate-600'
          }`}
          style={{ height: '20%' }}
        />
      ))}
    </div>
  );
}
