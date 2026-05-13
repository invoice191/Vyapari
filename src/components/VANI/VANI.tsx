import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import { vaniService } from "../../services/vaniService";
import { vaniExecutor } from "../../services/vaniExecutor";
import { useVANIWakeWord } from "../../hooks/useVANIWakeWord";
import { Mic, RefreshCw, AlertTriangle, Play, CheckCircle, XCircle } from "lucide-react";

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
  });

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
    idle:       'VANI Core Standby',
    listening:  'VANI Listening...',
    thinking:   'Analyzing Command...',
    speaking:   'VANI Speaking...',
    confirming: 'Awaiting Confirmation'
  };

  return (
    <div className="fixed bottom-10 right-10 z-[500] flex flex-col items-end gap-6">
      {/* Summary Card / Status Dashboard */}
      <AnimatePresence>
        {(state !== 'idle' || permError || (lastResponse?.summary_card && state === 'idle')) && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            className="glass-card !p-0 w-[320px] overflow-hidden border-white/20 shadow-2xl bg-white/90 backdrop-blur-2xl"
          >
            {/* Status Header */}
            <div className={`px-4 py-2 flex items-center justify-between ${state !== 'idle' ? orbColors[state] : 'bg-slate-100'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-white ${state === 'listening' ? 'animate-ping' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {permError ? 'Hardware Shield Blocked' : state !== 'idle' ? orbLabels[state] : 'Execution Summary'}
                </span>
              </div>
              <button onClick={() => { setLastResponse(null); setPermError(false); }} className="opacity-50 hover:opacity-100 text-slate-500">
                <XCircle size={14} />
              </button>
            </div>

            <div className="p-5">
              {/* Premium Language Picker */}
              <div className="flex gap-1.5 mb-4 p-1 bg-slate-100/80 rounded-xl border border-slate-200/55">
                {[
                  { code: 'hi-IN', label: '------' },
                  { code: 'en-IN', label: 'English' },
                  { code: 'mr-IN', label: '-----' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSttLang(lang.code)}
                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${
                      sttLang === lang.code
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              {/* Hardware / Permission Guidance */}
              {permError && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-800 space-y-3 mb-4">
                  <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-wider">
                    <AlertTriangle size={14} /> Mic Permission Required
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wide leading-relaxed text-red-600/90">
                    Vyapari cannot access your audio inputs. Click the camera or microphone icon in your browser address bar to grant permission, then retry.
                  </p>
                </div>
              )}

              {/* Transcript */}
              {transcript && (
                <div className="mb-4 text-sm font-medium text-slate-600 italic leading-snug">
                  "{transcript}"
                </div>
              )}

              {/* Wave Visualizer */}
              {(state === 'listening' || state === 'speaking') && (
                <div className="flex items-center gap-1 h-6 mb-4">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: state === 'listening' ? [4, 16, 4] : [2, 10, 2],
                        opacity: [0.4, 1, 0.4]
                      }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05 }}
                      className="w-1 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Summary Card Content */}
              {lastResponse?.summary_card && state === 'idle' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {lastResponse.summary_card.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                      {lastResponse.summary_card.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {lastResponse.summary_card.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</span>
                        <span className="text-xs font-black text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {lastResponse.spoken_response && (
                    <div className="text-[11px] font-medium text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100 leading-tight">
                      {lastResponse.spoken_response}
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* Spoken Response while speaking */}
              {lastResponse?.spoken_response && state === 'speaking' && (
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {lastResponse.spoken_response}
                </div>
              )}
            </div>

            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[8px] font-black text-slate-400 tracking-[0.2em]">VANI_INTELLIGENCE_v4</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The VANI Orb (Trigger) */}
      <motion.button
        layoutId="vani-orb"
        onClick={handleOrbClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative overflow-hidden ${orbColors[state]}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {state === 'idle' && <Mic size={32} />}
            {state === 'listening' && <div className="w-8 h-8 bg-white/30 rounded-full animate-ping" />}
            {state === 'thinking' && <RefreshCw size={32} className="animate-spin" />}
            {state === 'speaking' && <Play size={32} className="animate-pulse" />}
            {state === 'confirming' && <AlertTriangle size={32} />}
          </motion.div>
        </AnimatePresence>
        
        {/* Decorative Ring */}
        <div className="absolute inset-0 border-4 border-white/20 rounded-full pointer-events-none" />
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {state === 'confirming' && pendingAction && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center z-[2000] p-6 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-[2rem] max-w-md w-full shadow-2xl border border-slate-200 my-auto"
            >
              <div className="flex items-center gap-3 text-orange-500 mb-6 font-black uppercase text-xl">
                <AlertTriangle size={28} /> Confirm Action
              </div>
              <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                {pendingAction.confirmation_message || "Are you sure you want to proceed with this operation?"}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={confirmAction}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Execute
                </button>
                <button 
                  onClick={cancelAction}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

