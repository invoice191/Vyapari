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

      // Play vocalized response
      setState('speaking');
      
      // -- IMMEDIATE ACTION: Trigger execution concurrently with speech
      // This makes VANI feel "instant" as the UI responds while she starts talking
      if (!response.requires_confirmation && !response.follow_up_question) {
        // Use a slight timeout to ensure state transitions don't clash
        setTimeout(() => {
          vaniExecutor.execute(response, profile?.business_id || '', onCommand);
        }, 100);
      }

      if (response.spoken_response) {
        await speakText(response.spoken_response, response.language_detected);
      }

      // Handle clarifying question
      if (response.follow_up_question) {
        await speakText(response.follow_up_question, response.language_detected);
        setState('idle');
        return;
      }

      // Proactive advisory note
      if (response.proactive_note) {
        await new Promise(r => setTimeout(r, 600));
        await speakText(response.proactive_note, response.language_detected);
      }

      // Confirmation barrier for risky actions
      if (response.requires_confirmation) {
        setPendingAction(response);
        setState('confirming');
        return;
      }

      // Final state reset (execution already triggered or not needed)
      setState('idle');
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
            className="glass-dark w-[400px] rounded-[2.5rem] overflow-hidden border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] p-8"
          >
            {/* Holographic Orb Container */}
            <div className="relative h-64 flex items-center justify-center">
              {/* Outer Neural Rings */}
              <div className={`absolute inset-0 rounded-full border border-rose-500/10 animate-spin-slow ${state === 'thinking' ? 'opacity-100' : 'opacity-20'}`} />
              <div className={`absolute w-[90%] h-[90%] rounded-full border border-blue-500/10 animate-reverse-spin-slow ${state === 'thinking' ? 'opacity-100' : 'opacity-20'}`} />
              
              {/* Central Neural Core */}
              <motion.div 
                onClick={handleOrbClick}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden
                  ${state === 'listening' ? 'scale-125 bg-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.4)]' : 
                    state === 'thinking' ? 'bg-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.4)]' : 
                    state === 'speaking' ? 'bg-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.4)]' :
                    'bg-slate-800/50'}`}
              >
                {/* JARVIS Energy Waves */}
                {state !== 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full animate-ping-slow bg-current opacity-20 rounded-full" />
                    <div className="absolute w-full h-1 bg-current opacity-10 animate-neural-scan" />
                  </div>
                )}
                
                <AnimatePresence mode="wait">
                  {state === 'listening' ? (
                    <motion.div key="list" className="flex space-x-1 items-end h-8">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [8, 24, 8] }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                          className="w-1.5 bg-rose-500 rounded-full"
                        />
                      ))}
                    </motion.div>
                  ) : state === 'thinking' ? (
                    <motion.div key="think" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                      <Brain className="w-12 h-12 text-blue-400 animate-pulse" />
                    </motion.div>
                  ) : state === 'speaking' ? (
                    <motion.div key="speak" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }}>
                      <Activity className="w-12 h-12 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <motion.div key="idle">
                      <Mic className="w-12 h-12 text-slate-400" />
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
                    className="text-lg font-medium text-slate-200 line-clamp-2 italic"
                  >
                    "{transcript}"
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  state === 'listening' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 
                  state === 'thinking' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 
                  state === 'speaking' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' :
                  'bg-slate-600'
                }`} />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500">
                  {state === 'listening' ? 'VANI Protocol Active' : 
                   state === 'thinking' ? 'Neural Processing...' : 
                   state === 'speaking' ? 'Synthesizing Response' : 'Standby Mode'}
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

