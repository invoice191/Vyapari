import { useState, useEffect, useCallback } from 'react';
import { vaniExecutor } from '../utils/vaniExecutor';

export function useVANI(setActive: (module: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [feedback, setFeedback] = useState("");

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLastTranscript(transcript);
      const res = vaniExecutor.processCommand(transcript, setActive);
      setFeedback(res);
    };

    recognition.start();
  }, [setActive]);

  return { isListening, lastTranscript, feedback, startListening };
}
