import { useEffect } from 'react';

interface AutoPlayProps {
  enabled: boolean;
  duration: number;
  onNext: () => void;
  currentSlide: number;
}

export function useAutoPlay({ enabled, duration, onNext, currentSlide }: AutoPlayProps) {
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      onNext();
    }, duration * 1000);

    return () => clearInterval(timer);
  }, [enabled, duration, onNext, currentSlide]);
}
