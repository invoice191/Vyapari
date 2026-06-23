import { useState, useCallback } from 'react';
import { vaniService } from '../services/vaniService';
import { vaniExecutor } from '../services/vaniExecutor';

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
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLastTranscript(transcript);
      try {
        const response = await vaniService.processCommand(transcript, { activeModule: '' });
        setFeedback(response?.spoken_response || 'Command received.');
        if (response && response.intent !== 'error') {
          vaniExecutor.execute(response, '', setActive);
        }
      } catch (e) {
        setFeedback('Error processing voice command.');
      }
    };

    recognition.start();
  }, [setActive]);

  return { isListening, lastTranscript, feedback, startListening };
}
