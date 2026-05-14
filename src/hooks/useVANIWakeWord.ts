import { useRef, useCallback } from 'react';

export function useVANIWakeWord(onWake: () => void) {
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const retryCountRef = useRef(0);

  const WAKE_WORDS = [
    'hey vani', 'hey vyapari', 'ok vani',
    'aye vani', 'vani', 'hey bani' // common mishears
  ];

  const startWakeWordDetection = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || listeningRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';
    recognitionRef.current = recognition;
    listeningRef.current = true;
    recognition.onstart = () => {
      retryCountRef.current = 0;
    };

    recognition.onresult = (event: any) => {
      const latest = event.results[event.results.length - 1][0].transcript
        .toLowerCase().trim();

      const detected = WAKE_WORDS.some(w => latest.includes(w));
      if (detected) {
        recognition.stop();
        listeningRef.current = false;
        onWake(); // Trigger full VANI activation
      }
    };

    recognition.onend = () => {
      // Restart automatically to keep listening, up to 3 times
      if (listeningRef.current) {
        if (retryCountRef.current >= 3) {
          console.warn("[WakeWord] Maximum consecutive mic restart retries reached. Stopping listener.");
          listeningRef.current = false;
          return;
        }
        retryCountRef.current += 1;
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.warn("[WakeWord] Automatic restart skipped:", e);
          }
        }, 1000);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("[WakeWord] Start failed:", e);
    }
  }, [onWake]);

  const stopWakeWordDetection = useCallback(() => {
    listeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("[WakeWord] Stop skipped:", e);
      }
    }
  }, []);

  return { startWakeWordDetection, stopWakeWordDetection };
}
