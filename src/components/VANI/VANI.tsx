import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import { vaniService } from "../../services/vaniService";
import { vaniExecutor } from "../../services/vaniExecutor";
import { useVANIWakeWord } from "../../hooks/useVANIWakeWord";
import { Mic, RefreshCw, AlertTriangle, Play, CheckCircle, XCircle, Brain, Activity, Sparkles } from "lucide-react";
import VaniMascot from "./VaniMascot";

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

      // Proactive advisory note - restricted to greetings or briefings to prevent repetitive vocal interruptions on direct user commands
      if (response.proactive_note && (response.intent === 'GET_BRIEFING' || text.toLowerCase().includes('hi') || text.toLowerCase().includes('hello') || text.toLowerCase().includes('morning') || text.toLowerCase().includes('briefing') || text.toLowerCase().includes('system check'))) {
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

  const stopWakeWordRef = useRef<(() => void) | null>(null);

  const activate = useCallback(() => {
    // 1. Force-stop any active wake word detection microphone stream synchronously
    if (stopWakeWordRef.current) {
      try {
        stopWakeWordRef.current();
      } catch (e) {
        console.warn("Error stopping wake word detection synchronously:", e);
      }
    }

    // 2. Cooldown delay to let the browser cleanly release the mic stream before starting the new session
    setTimeout(() => {
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
        recognition.start();
      } catch (e) {
        console.warn("Recognition start failed:", e);
      }
    }, 300);
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

  stopWakeWordRef.current = stopWakeWordDetection;

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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[500] flex flex-col items-end gap-4 w-[calc(100vw-2rem)] sm:w-[380px] max-w-full pointer-events-none">
      {/* VANI JARVIS CONSOLE */}
       <AnimatePresence>
        {(state !== 'idle' || lastResponse?.summary_card || permError) && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="bg-slate-950/95 backdrop-blur-3xl w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7),0_0_80px_rgba(99,102,241,0.1)] flex flex-col max-h-[70vh] sm:max-h-[80vh] pointer-events-auto relative transition-all"
          >
            {/* Top Close/Standby Control */}
            <div className="absolute top-5 right-5 z-20">
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
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/15 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Core Workspace Panel */}
            <div className="flex-1 overflow-y-auto p-6 pr-5 space-y-5 custom-scrollbar">
              {/* Holographic Breathing Assistant Orb Container - Dynamically scaled to prevent overflow */}
              <div className={`relative flex items-center justify-center transition-all duration-500 ${lastResponse?.summary_card ? 'h-36 mt-4' : 'h-48 mt-6'}`}>
                {/* Gyroscopic Counter-Rotating Hologram Rings */}
                <div className={`absolute rounded-full border border-dashed transition-all duration-700
                  ${lastResponse?.summary_card ? 'w-36 h-36' : 'w-48 h-48'}
                  ${state === 'listening' ? 'border-rose-500/30 scale-105 animate-spin-slow' : 
                    state === 'thinking' ? 'border-blue-500/50 scale-110 animate-spin-slow' : 
                    state === 'speaking' ? 'border-emerald-500/40 scale-105 animate-spin-slow' : 
                    'border-cyan-500/20 scale-95 animate-spin-slow'}`} 
                />
                <div className={`absolute rounded-full border border-dotted transition-all duration-700
                  ${lastResponse?.summary_card ? 'w-32 h-32' : 'w-40 h-40'}
                  ${state === 'listening' ? 'border-rose-400/20 scale-100 animate-[spin_10s_linear_infinite_reverse]' : 
                    state === 'thinking' ? 'border-blue-400/40 scale-105 animate-[spin_6s_linear_infinite_reverse]' : 
                    state === 'speaking' ? 'border-emerald-400/30 scale-100 animate-[spin_12s_linear_infinite_reverse]' : 
                    'border-cyan-400/10 scale-95 animate-[spin_15s_linear_infinite_reverse]'}`} 
                />

                {/* Glowing Aura Ring */}
                <div className={`absolute rounded-full filter blur-xl transition-all duration-1000 opacity-20
                  ${lastResponse?.summary_card ? 'w-24 h-24' : 'w-32 h-32'}
                  ${state === 'listening' ? 'bg-rose-500 animate-pulse' : 
                    state === 'thinking' ? 'bg-blue-600 animate-pulse' : 
                    state === 'speaking' ? 'bg-emerald-500 animate-pulse' : 
                    'bg-cyan-500/50 animate-pulse-slow'}`} 
                />
                
                {/* Reactive Cute Chibi Assistant Mascot */}
                <div onClick={handleOrbClick} className="w-full h-full flex items-center justify-center cursor-pointer">
                  <VaniMascot state={state} transcript={transcript} responseBrief={lastResponse?.spoken_response} />
                </div>
              </div>

              {/* Transcript & Command Status */}
              <div className="space-y-3 text-center px-2">
                <AnimatePresence mode="wait">
                  {transcript && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium text-slate-100 line-clamp-3 italic px-4 py-2 bg-white/5 border border-white/5 rounded-2xl font-sans relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-transparent animate-pulse" />
                      <span className="relative z-10 text-slate-200">"{transcript}"</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-ping ${
                    state === 'listening' ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 
                    state === 'thinking' ? 'bg-blue-500 shadow-[0_0_12px_#3b82f6]' : 
                    state === 'speaking' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' :
                    'bg-cyan-500 shadow-[0_0_10px_#06b6d4]'
                  }`} />
                  <span className={`text-[9px] font-black tracking-[0.2em] uppercase transition-colors duration-300
                    ${state === 'listening' ? 'text-rose-400' : 
                      state === 'thinking' ? 'text-blue-400' : 
                      state === 'speaking' ? 'text-emerald-400' : 
                      'text-cyan-400'}`}
                  >
                    {state === 'listening' ? 'Listening to you, sir...' : 
                     state === 'thinking' ? 'Accessing neural ledgers...' : 
                     state === 'speaking' ? 'Answering you now, sir...' : 
                     'VANI Active · Awaiting Voice'}
                  </span>
                </div>
              </div>

              {/* Strategic Summary Card (The Jarvis Briefing) */}
              {lastResponse?.summary_card && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-3xl relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight font-display">
                        {lastResponse.summary_card.title}
                      </h3>
                      <p className="text-slate-400 text-[10px] italic">
                        {lastResponse.summary_card.subtitle}
                      </p>
                    </div>
                    <div className={`p-2 rounded-xl ${
                      lastResponse.summary_card.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      lastResponse.summary_card.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 relative z-10">
                    {lastResponse.summary_card.items.map((item: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 shadow-sm">
                        <div className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5 font-bold">
                          {item.label}
                        </div>
                        <div className="text-xs font-mono text-slate-200 truncate">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {lastResponse.proactive_note && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-start space-x-2 relative z-10">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                      <p className="text-[10px] text-blue-300/80 italic leading-relaxed font-sans">
                        "Sir, {lastResponse.proactive_note}"
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Language Controls */}
              <div className="flex justify-center gap-3.5 pt-2">
                {['hi-IN', 'en-IN', 'mr-IN'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSttLang(lang)}
                    className={`text-[8px] font-black tracking-widest uppercase transition-all ${
                      sttLang === lang ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'
                    } cursor-pointer`}
                  >
                    {lang.split('-')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed Bottom Keyboard Command Input Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950/80 backdrop-blur-md">
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
                  placeholder="Type Jarvis command..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
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
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(0,0,0,0.5),0_0_20px_rgba(99,102,241,0.15)] relative group overflow-hidden pointer-events-auto cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-rose-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-mesh opacity-20" />
          <Mic className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors duration-300 relative z-10 animate-[pulse_2s_infinite]" />
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

