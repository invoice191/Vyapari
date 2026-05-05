import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

interface VANIProps {
  onCommand: (command: string) => void;
  activeModule: string;
}

export default function VANI({ onCommand, activeModule }: VANIProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showPulse, setShowPulse] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        setTranscript(currentTranscript);
        if (event.results[0].isFinal) {
          handleCommand(currentTranscript.toLowerCase());
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setShowPulse(false);
      };
    }
  }, []);

  const handleCommand = (cmd: string) => {
    onCommand(cmd);
    setTimeout(() => setTranscript(""), 2000);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setIsListening(true);
      setShowPulse(true);
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[500] flex flex-col items-end gap-4">
      <AnimatePresence>
        {transcript && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="brutal-card bg-ink text-white p-4 max-w-xs text-xs font-black uppercase tracking-widest border-neon"
          >
            <span className="text-neon mr-2">»</span> {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <AnimatePresence>
          {showPulse && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-neon rounded-full"
            />
          )}
        </AnimatePresence>
        
        <button 
          onClick={toggleListening}
          className={`
            w-16 h-16 rounded-full border-4 border-ink flex items-center justify-center text-2xl
            shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all
            ${isListening ? 'bg-neon text-white' : 'bg-white text-ink hover:bg-neon/10'}
          `}
        >
          {isListening ? "🛑" : "🎤"}
        </button>
      </div>
    </div>
  );
}
