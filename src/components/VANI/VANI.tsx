import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import { vaniService } from "../../services/vaniService";
import { vaniExecutor } from "../../services/vaniExecutor";
import { useVANIWakeWord } from "../../hooks/useVANIWakeWord";
import { Mic, RefreshCw, AlertTriangle, Play, CheckCircle, XCircle, Brain, Activity, Sparkles } from "lucide-react";

interface VANIProps {
  activeModule: string;
  onCommand: (command: string) => void;
}

type VANIState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'confirming';

export default function VANI({ activeModule, onCommand }: VANIProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<VANIState>('idle');
  const [sttLang, setSttLang] = useState('hi-IN'); // 'hi-IN' | 'en-IN' | 'mr-IN'
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [permError, setPermError] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load language preference from profile
  useEffect(() => {
    if (profile?.language_preference) {
      const pref = profile.language_preference;
      if (pref === 'hi') setSttLang('hi-IN');
      else if (pref === 'mr') setSttLang('mr-IN');
      else if (pref === 'en') setSttLang('en-IN');
    }
  }, [profile]);

  const speakText = async (text: string, lang = 'en-IN'): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map detected language to voice
      if (lang === 'hi' || lang === 'hi-IN') utterance.lang = 'hi-IN';
      else if (lang === 'mr' || lang === 'mr-IN') utterance.lang = 'mr-IN';
      else utterance.lang = 'en-IN';

      utterance.rate = 0.92; // Natural slow paced cadence for Indian languages
      utterance.pitch = 1.02; // Soft warm frequency
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.lang === utterance.lang && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Heera') || v.name.includes('Hemant'))
      ) || voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
      
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  const processText = async (text: string) => {
    setState('thinking');
    
    // Immediate visual feedback that we're processing the speech
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: {
        title: "VANI: Processing",
        message: `Analyzing command: "${text.length > 30 ? text.slice(0, 30) + '...' : text}"`,
        type: 'smart'
      }
    }));

    try {
      const response = await vaniService.processCommand(text, { activeModule, profile });
      setLastResponse(response);

      // Play vocalized response (non-blocking so VANI acts instantly in under 1s!)
      setState('speaking');
      
      // -- IMMEDIATE ACTION: Trigger execution concurrently with speech
      // This makes VANI feel "instant" as the UI responds while she starts talking
      if (!response.requires_confirmation && !response.follow_up_question) {
        // Use a slight timeout to ensure state transitions don't clash
        setTimeout(() => {
          vaniExecutor.execute(response, profile?.business_id || '', onCommand);
        }, 50);
      }

      if (response.spoken_response) {
        speakText(response.spoken_response, response.language_detected).then(() => {
          setState(s => s === 'speaking' ? 'idle' : s);
        });
      } else {
        setState('idle');
      }

      // Handle clarifying question
      if (response.follow_up_question) {
        speakText(response.follow_up_question, response.language_detected);
        setState('idle');
        return;
      }

      // Proactive advisory note
      if (response.proactive_note) {
        setTimeout(() => {
          speakText(response.proactive_note, response.language_detected);
        }, 1500);
      }

      // Confirmation barrier for risky actions
      if (response.requires_confirmation) {
        setPendingAction(response);
        setState('confirming');
        return;
      }
    } catch (e) {
      console.error("[VANI_UI] Extraction Failure:", e);
      setState('idle');
    }
  };

  const activate = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakText("Speech commands are not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = sttLang;
    recognitionRef.current = recognition;

    setState('listening');
    setTranscript("");
    setPermError(false);

    const finalTranscriptRef = { current: "" };
    recognition.onresult = (event: any) => {
      const current = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setTranscript(current);
      finalTranscriptRef.current = current;
    };

    recognition.onend = async () => {
      if (!finalTranscriptRef.current) {
        setState('idle');
        return;
      }
      await processText(finalTranscriptRef.current);
    };

    recognition.onerror = (event: any) => {
      console.warn("STT Error detected:", event.error);
      if (event.error === 'not-allowed') {
        setPermError(true);
      }
      setState('idle');
    };

    try {
      // Ensure any previous recognition is settled before starting new one
      // This prevents 'aborted' errors from conflicting mic streams
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.warn("Recognition delayed start failed:", e);
        }
      }, 150);
    } catch (e) {
      console.warn("Recognition already active:", e);
    }
  }, [activeModule, profile, onCommand, sttLang]);

  const handleOrbClick = () => {
    if (state === 'idle') {
      activate();
    } else if (state === 'speaking') {
      // Barge-in: cancel speaking and start listening immediately
      window.speechSynthesis.cancel();
      activate();
    } else {
      // Cancel active recognition and return to standby
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      setState('idle');
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    await vaniExecutor.execute(pendingAction, profile?.business_id || '', onCommand);
    setPendingAction(null);
    setState('idle');
    await speakText("Action confirmed and executed successfully.");
  };

  const cancelAction = async () => {
    setPendingAction(null);
    setState('idle');
    await speakText("Action cancelled.");
  };

  // continuous wake-word setup
  const { startWakeWordDetection, stopWakeWordDetection } = useVANIWakeWord(() => {
    if (state === 'idle') {
      activate();
    }
  }, sttLang);

  useEffect(() => {
    if (state === 'idle') {
      startWakeWordDetection();
    } else {
      stopWakeWordDetection();
    }
    
    const handleTrigger = () => {
      if (state === 'idle') activate();
    };
    window.addEventListener('vani:trigger', handleTrigger);
    return () => {
      stopWakeWordDetection();
      window.removeEventListener('vani:trigger', handleTrigger);
    };
  }, [startWakeWordDetection, stopWakeWordDetection, state, activate]);

  const orbColors = {
    idle:       'bg-indigo-600 text-white hover:bg-indigo-700',
    listening:  'bg-rose-500 text-white animate-pulse',
    thinking:   'bg-amber-500 text-white',
    speaking:   'bg-emerald-500 text-white',
    confirming: 'bg-orange-500 text-white'
  };

  const orbLabels = {
    idle:       'Voice Assistant Ready',
    listening:  'Listening...',
    thinking:   'Thinking...',
    speaking:   'Speaking...',
    confirming: 'Awaiting Confirmation'
  };

  return (
    <div className="fixed bottom-10 right-10 z-[500] flex flex-col items-end gap-6">
      {/* VANI JARVIS CONSOLE */}
       <AnimatePresence>
        {(state !== 'idle' || lastResponse?.summary_card || permError) && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            className="glass-dark w-[400px] rounded-[2.5rem] overflow-hidden border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-8 relative"
          >
            {/* Top Close/Standby Control */}
            <div className="absolute top-6 right-6 z-20">
              <button 
                onClick={() => {
                  window.speechSynthesis.cancel();
                  if (recognitionRef.current) {
                    try { recognitionRef.current.abort(); } catch (e) {}
                  }
                  setState('idle');
                  setLastResponse(null);
                  setTranscript("");
                }}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Holographic Breathing Assistant Orb Container */}
            <div className="relative h-64 flex items-center justify-center">
              {/* Outer Cosmic Neural Ring 1 */}
              <div className={`absolute w-64 h-64 rounded-full border border-dashed transition-all duration-700
                ${state === 'listening' ? 'border-rose-500/20 scale-110 animate-spin-slow' : 
                  state === 'thinking' ? 'border-blue-500/40 animate-spin-fast' : 
                  state === 'speaking' ? 'border-emerald-500/30 animate-spin-slow' : 
                  'border-cyan-500/10 scale-95 animate-spin-slow'}`} 
              />
              {/* Outer Cosmic Neural Ring 2 */}
              <div className={`absolute w-56 h-56 rounded-full border border-dotted transition-all duration-700
                ${state === 'listening' ? 'border-rose-400/20 scale-105 animate-reverse-spin-slow' : 
                  state === 'thinking' ? 'border-blue-400/40 animate-reverse-spin-fast' : 
                  state === 'speaking' ? 'border-emerald-400/30 animate-reverse-spin-slow' : 
                  'border-cyan-400/10 scale-100 animate-reverse-spin-slow'}`} 
              />

              {/* Glowing Aura Ring */}
              <div className={`absolute w-44 h-44 rounded-full filter blur-xl transition-all duration-1000 opacity-30
                ${state === 'listening' ? 'bg-rose-500 animate-pulse' : 
                  state === 'thinking' ? 'bg-blue-600 animate-pulse' : 
                  state === 'speaking' ? 'bg-emerald-500 animate-pulse' : 
                  'bg-cyan-500/50 animate-pulse-slow'}`} 
              />
              
              {/* Central Consciousness Core */}
              <motion.div 
                onClick={handleOrbClick}
                className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden border
                  ${state === 'listening' ? 'scale-110 bg-gradient-to-tr from-rose-950/40 to-rose-900/60 border-rose-500/50 shadow-[0_0_60px_rgba(244,63,94,0.6)]' : 
                    state === 'thinking' ? 'bg-gradient-to-tr from-blue-950/40 to-blue-900/60 border-blue-500/50 shadow-[0_0_60px_rgba(59,130,246,0.6)]' : 
                    state === 'speaking' ? 'bg-gradient-to-tr from-emerald-950/40 to-emerald-900/60 border-emerald-500/50 shadow-[0_0_60px_rgba(16,185,129,0.6)]' :
                    'bg-gradient-to-tr from-cyan-950/20 to-slate-900/50 border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)] hover:border-cyan-400/50'}`}
              >
                {/* Micro Scanline Bar */}
                <div className={`absolute w-full h-1 opacity-10 animate-neural-scan
                  ${state === 'listening' ? 'bg-rose-400' : 
                    state === 'thinking' ? 'bg-blue-400' : 
                    state === 'speaking' ? 'bg-emerald-400' : 
                    'bg-cyan-400'}`} 
                />
                
                <AnimatePresence mode="wait">
                  {state === 'listening' ? (
                    <motion.div key="list" className="flex items-center space-x-1.5 h-10">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [12, 36, 12] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1.5 bg-gradient-to-t from-rose-600 to-rose-400 rounded-full"
                        />
                      ))}
                    </motion.div>
                  ) : state === 'thinking' ? (
                    <motion.div 
                      key="think" 
                      initial={{ scale: 0.5, rotate: 0 }} 
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="relative w-16 h-16 flex items-center justify-center"
                    >
                      <Brain className="w-12 h-12 text-blue-400" />
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 border-t-blue-400" />
                    </motion.div>
                  ) : state === 'speaking' ? (
                    <motion.div 
                      key="speak" 
                      animate={{ scale: [0.95, 1.05, 0.95] }} 
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="flex flex-col items-center justify-center space-y-1"
                    >
                      <Activity className="w-12 h-12 text-emerald-400" />
                      <span className="text-[7px] text-emerald-400/80 font-black tracking-widest uppercase animate-pulse">Vocalizing</span>
                    </motion.div>
                  ) : (
                    // Futuristic Eye (Breathing Cyan Core)
                    <motion.div 
                      key="idle"
                      animate={{ scale: [0.98, 1.02, 0.98] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="flex flex-col items-center justify-center space-y-1.5"
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-cyan-400/40 flex items-center justify-center animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-cyan-400/60 shadow-[0_0_15px_#06b6d4]" />
                      </div>
                      <span className="text-[7px] text-cyan-400 font-black tracking-[0.2em] uppercase">VANI Companion</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Transcript & Command Status */}
            <div className="mt-4 space-y-4 text-center">
              <AnimatePresence mode="wait">
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-lg font-medium text-slate-100 line-clamp-2 italic px-4 font-serif"
                  >
                    "{transcript}"
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full animate-ping ${
                  state === 'listening' ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 
                  state === 'thinking' ? 'bg-blue-500 shadow-[0_0_12px_#3b82f6]' : 
                  state === 'speaking' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' :
                  'bg-cyan-500 shadow-[0_0_10px_#06b6d4]'
                }`} />
                <span className="text-[10px] font-black tracking-[0.25em] uppercase transition-colors duration-300
                  ${state === 'listening' ? 'text-rose-400' : 
                    state === 'thinking' ? 'text-blue-400' : 
                    state === 'speaking' ? 'text-emerald-400' : 
                    'text-cyan-400'}"
                >
                  {state === 'listening' ? 'Listening closely to you, sir...' : 
                   state === 'thinking' ? 'Accessing neural ledger registers...' : 
                   state === 'speaking' ? 'Answering you now, sir...' : 
                   'VANI Active · Awaiting Your Voice'}
                </span>
              </div>
            </div>

            {/* Strategic Summary Card (The Jarvis Briefing) */}
            {lastResponse?.summary_card && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-3xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {lastResponse.summary_card.title}
                    </h3>
                    <p className="text-slate-400 text-xs italic">
                      {lastResponse.summary_card.subtitle}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    lastResponse.summary_card.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    lastResponse.summary_card.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {lastResponse.summary_card.items.map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                        {item.label}
                      </div>
                      <div className="text-sm font-mono text-slate-200">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {lastResponse.proactive_note && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-start space-x-3">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-300/80 italic leading-relaxed">
                      "Sir, {lastResponse.proactive_note}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Language Controls */}
            <div className="mt-6 flex justify-center gap-4">
              {['hi-IN', 'en-IN', 'mr-IN'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSttLang(lang)}
                  className={`text-[9px] font-black tracking-widest uppercase transition-all ${
                    sttLang === lang ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {lang.split('-')[0]}
                </button>
              ))}
            </div>

            {/* Keyboard Command Input (Jarvis Viva life-saver!) */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const input = target.elements.namedItem('textCommand') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    processText(input.value.trim());
                    input.value = '';
                  }
                }}
                className="relative"
              >
                <input
                  name="textCommand"
                  type="text"
                  placeholder="Type Jarvis command (e.g. 'create bill for Rohan')..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Orb for Trigger (Hidden when console is open) */}
      {state === 'idle' && !lastResponse?.summary_card && (
        <motion.button
          onClick={activate}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-rose-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Mic className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
        </motion.button>
      )}

      {/* Confirmation Barrier */}
      <AnimatePresence>
        {state === 'confirming' && pendingAction && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[2000] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-dark p-10 rounded-[3rem] max-w-md w-full border border-white/10 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 text-amber-500">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Protocol Authorization</h3>
              <p className="text-slate-400 italic mb-8 leading-relaxed">
                "{pendingAction.confirmation_message || "Sir, this action requires your explicit authorization. Shall we proceed?"}"
              </p>
              <div className="flex gap-4">
                <button onClick={confirmAction} className="flex-1 bg-white text-slate-950 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-400 transition-all">
                  Proceed
                </button>
                <button onClick={cancelAction} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  Abort
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

