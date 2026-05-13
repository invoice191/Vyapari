import { useEffect } from 'react';

interface KeyboardNavProps {
  nextSlide: () => void;
  prevSlide: () => void;
  onExit: () => void;
  toggleFullscreen: () => void;
  goToSlide: (index: number) => void;
  toggleThumbnails: () => void;
  toggleNotes: () => void;
}

export function useKeyboardNav({ 
  nextSlide, 
  prevSlide, 
  onExit, 
  toggleFullscreen,
  goToSlide,
  toggleThumbnails,
  toggleNotes
}: KeyboardNavProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          prevSlide();
          break;
        case 'Escape':
          onExit();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Home':
          goToSlide(0);
          break;
        case 'End':
          goToSlide(8); // Last slide index
          break;
        case 't':
        case 'T':
          toggleThumbnails();
          break;
        case 'n':
        case 'N':
          toggleNotes();
          break;
        default:
          // Check for numbers 1-9
          if (e.key >= '1' && e.key <= '9') {
            goToSlide(parseInt(e.key) - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, onExit, toggleFullscreen, goToSlide, toggleThumbnails, toggleNotes]);
}
