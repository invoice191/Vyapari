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
    <div className="fixed bottom-8 right-8 z-[500] flex flex-col items-end gap-6">
      <AnimatePresence>
        {transcript && (
          <motion.div 
            initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
            className="glass-card !bg-ink !text-white p-6 max-w-xs text-sm font-black uppercase tracking-[0.1em] border-neon shadow-[8px_8px_0px_var(--color-neon)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-neon animate-pulse" />
              <span className="text-[10px] text-neon">VANI_LISTENING</span>
            </div>
            <span className="leading-relaxed italic">"{transcript}"</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group">
        <AnimatePresence>
          {showPulse && (
            <>
              <motion.div 
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-neon/30 border-2 border-neon"
              />
              <motion.div 
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                className="absolute inset-0 bg-white/20 border-2 border-white"
              />
            </>
          )}
        </AnimatePresence>
        
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9, rotate: -5 }}
          onClick={toggleListening}
          className={`
            w-20 h-20 border-4 border-ink flex items-center justify-center text-3xl
            shadow-[8px_8px_0px_var(--color-ink)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all z-10 relative
            ${isListening ? 'bg-neon text-white' : 'bg-white text-ink hover:bg-neon/5'}
          `}
        >
          {isListening ? (
            <div className="flex gap-1 items-center">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ height: [8, 24, 8] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                  className="w-1.5 bg-white"
                />
              ))}
            </div>
          ) : "🎤"}
        </motion.button>
      </div>
    </div>
  );
}
