import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import { vaniService } from "../../services/vaniService";
import { vaniExecutor } from "../../services/vaniExecutor";
import { useVANIWakeWord } from "../../hooks/useVANIWakeWord";
import { Mic, AlertTriangle, Activity, Sparkles, Volume2, Play, XCircle } from "lucide-react";
import VaniMascot from "./VaniMascot";

interface VANIProps {
  activeModule: string;
  onCommand: (command: string) => void;
}

type VANIState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'confirming';

const LANGUAGE_OPTIONS = [
  { code: 'hi-IN', label: 'हि', name: 'Hindi' },
  { code: 'en-IN', label: 'EN', name: 'English (India)' },
  { code: 'mr-IN', label: 'मर', name: 'Marathi' },
  { code: 'ta-IN', label: 'தம', name: 'Tamil' },
  { code: 'te-IN', label: 'తె', name: 'Telugu' },
  { code: 'gu-IN', label: 'ગુ', name: 'Gujarati' },
  { code: 'kn-IN', label: 'ಕನ', name: 'Kannada' },
  { code: 'bn-IN', label: 'বা', name: 'Bengali' },
];

export default function VANI({ activeModule, onCommand }: VANIProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<VANIState>('idle');
  const [sttLang, setSttLang] = useState('hi-IN');
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [permError, setPermError] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastSpokenResponse = useRef<string>("");

  // Load language preference from profile
  useEffect(() => {
    if (profile?.language_preference) {
      const pref = profile.language_preference;
      if (pref === 'hi') setSttLang('hi-IN');
      else if (pref === 'mr') setSttLang('mr-IN');
      else if (pref === 'ta') setSttLang('ta-IN');
      else if (pref === 'te') setSttLang('te-IN');
      else if (pref === 'gu') setSttLang('gu-IN');
      else if (pref === 'kn') setSttLang('kn-IN');
      else if (pref === 'bn') setSttLang('bn-IN');
      else setSttLang('en-IN');
    }
  }, [profile]);

  // Load all browser TTS voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Auto-select first voice matching current language
        const match = voices.find(v => v.lang.startsWith(sttLang.split('-')[0]));
        if (match && !selectedVoiceURI) setSelectedVoiceURI(match.voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [sttLang]);

  // Auto-select best matching voice when language changes
  useEffect(() => {
    if (availableVoices.length > 0) {
      const langCode = sttLang.split('-')[0];
      const match = availableVoices.find(v =>
        v.lang === sttLang && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Heera') || v.name.includes('Hemant'))
      ) || availableVoices.find(v => v.lang.startsWith(langCode));
      if (match) setSelectedVoiceURI(match.voiceURI);
    }
  }, [sttLang, availableVoices]);

  const speakText = async (text: string, lang = 'en-IN'): Promise<void> => {
    return new Promise(async (resolve) => {
      // 1. Check for ElevenLabs High-Quality Voice API Key
      const elevenLabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (elevenLabsKey) {
        try {
          // Default to a professional Indian/English voice id like 'EXAVITQu4vr4xnSDxMaL' (Sarah) or multilingual
          const voiceId = "EXAVITQu4vr4xnSDxMaL"; // Sarah (Professional Female)
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'xi-api-key': elevenLabsKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: text,
              model_id: "eleven_multilingual_v2", // Supports Hindi/Hinglish/English perfectly
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
              }
            })
          });

          if (!response.ok) throw new Error("ElevenLabs API Failed");

          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          
          audio.play();
          return; // Early return to prevent browser TTS from playing
        } catch (error) {
          console.warn("ElevenLabs TTS failed, falling back to Browser TTS:", error);
        }
      }

      // 2. Fallback to Browser Native TTS
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      // Map language codes
      const langMap: Record<string, string> = {
        'hi': 'hi-IN', 'mr': 'mr-IN', 'ta': 'ta-IN',
        'te': 'te-IN', 'gu': 'gu-IN', 'kn': 'kn-IN', 'bn': 'bn-IN',
        'en': 'en-IN',
      };
      const base = lang.split('-')[0];
      utterance.lang = langMap[base] || lang || sttLang;

      utterance.rate = 0.92;
      utterance.pitch = 1.02;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      const applyVoiceAndSpeak = (voices: SpeechSynthesisVoice[]) => {
        // 1. Use user-selected voice if available
        if (selectedVoiceURI) {
          const picked = voices.find(v => v.voiceURI === selectedVoiceURI);
          if (picked) { utterance.voice = picked; }
        }
        // 2. Fallback: best-matching voice for language
        if (!utterance.voice) {
          const fallback = voices.find(v =>
            v.lang === utterance.lang && (v.name.includes('Natural') || v.name.includes('Google'))
          ) || voices.find(v => v.lang.startsWith(base));
          if (fallback) utterance.voice = fallback;
        }
        window.speechSynthesis.speak(utterance);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        applyVoiceAndSpeak(voices);
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          applyVoiceAndSpeak(window.speechSynthesis.getVoices());
        }, { once: true });
        setTimeout(() => { if (!utterance.voice) window.speechSynthesis.speak(utterance); }, 300);
      }
    });
  };

  const previewVoice = () => {
    const langName = LANGUAGE_OPTIONS.find(l => l.code === sttLang)?.name || 'English';
    speakText(`Hello! I am VANI, your business assistant. Currently speaking in ${langName}.`, sttLang);
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
      
      if (response.vani_response) {
        if (response.vani_response === lastSpokenResponse.current) {
          console.warn("VANI: Duplicate response detected, suppressing.");
          setState('idle');
        } else {
          lastSpokenResponse.current = response.vani_response;
          speakText(response.vani_response, response.vani_response_language || response.language_detected).then(() => {
            setState(s => s === 'speaking' ? 'idle' : s);
          });
        }
      } else {
        setState('idle');
      }

      // Handle clarifying question
      if (response.needs_clarification && response.clarification_question) {
        if (response.clarification_question !== lastSpokenResponse.current) {
          lastSpokenResponse.current = response.clarification_question;
          speakText(response.clarification_question, response.vani_response_language || response.language_detected);
        }
        setState('idle');
        return;
      }

      // Confirmation barrier for risky actions — must check BEFORE executing
      if (response.action?.type === 'CONFIRM_REQUIRED' || response.requires_confirmation) {
        setPendingAction(response);
        setState('confirming');
        return;
      }

      // -- SAFE EXECUTION: Only fires after confirmation guard passed
      // Use a slight timeout to ensure state transitions don't clash
      setTimeout(() => {
        if (profile?.business_id) {
          vaniExecutor.execute(response, profile.business_id, onCommand);
        } else {
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: { title: 'VANI', message: 'Profile not loaded yet. Please wait.', type: 'warning' }
          }));
        }
      }, 50);

      // Proactive advisory note - restricted to greetings or briefings to prevent repetitive vocal interruptions on direct user commands
      if (response.proactive_note && (response.intent === 'GET_BRIEFING' || text.toLowerCase().includes('hi') || text.toLowerCase().includes('hello') || text.toLowerCase().includes('morning') || text.toLowerCase().includes('briefing') || text.toLowerCase().includes('system check'))) {
        setTimeout(() => {
          speakText(response.proactive_note, response.language_detected);
        }, 1500);
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
      recognition.interimResults = false;
      recognition.lang = sttLang;
      recognitionRef.current = recognition;

      setState('listening');
      setTranscript("");
      setPermError(false);

      recognition.onresult = (event: any) => {
        const current = event.results[event.results.length - 1][0].transcript;
        setTranscript(current);
        processText(current);
      };

      recognition.onend = () => {
        // Restart only if still listening (not transitioned to thinking)
        if (state === 'listening' && recognitionRef.current) {
          try { recognition.start(); } catch (e) {}
        }
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
                        {"Sir, " + lastResponse.proactive_note}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Language + Voice Controls */}
              <div className="space-y-3 pt-2">
                {/* Language Selector */}
                <div className="flex justify-center flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSttLang(lang.code)}
                      title={lang.name}
                      className={`w-9 h-9 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all border ${
                        sttLang === lang.code
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                          : 'bg-white/[0.02] border-white/[0.05] text-slate-500 hover:text-slate-300 hover:border-white/20'
                      } cursor-pointer`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>

                {/* Voice Picker Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowVoicePicker(v => !v)}
                    className="flex-1 flex items-center gap-2 text-[9px] font-bold tracking-widest uppercase text-slate-500 hover:text-slate-300 transition-all py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/10 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Voice: {availableVoices.find(v => v.voiceURI === selectedVoiceURI)?.name?.slice(0, 18) || 'Auto'}</span>
                  </button>
                  <button
                    onClick={previewVoice}
                    title="Test current voice"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </div>

                {/* Voice Dropdown */}
                {showVoicePicker && availableVoices.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-h-40 overflow-y-auto rounded-xl bg-slate-900 border border-white/10 custom-scrollbar"
                  >
                    {availableVoices
                      .filter(v => {
                        // Show voices matching language OR all if none match
                        const langBase = sttLang.split('-')[0];
                        return v.lang.startsWith(langBase) || availableVoices.filter(x => x.lang.startsWith(langBase)).length === 0;
                      })
                      .map((voice) => (
                        <button
                          key={voice.voiceURI}
                          onClick={() => { setSelectedVoiceURI(voice.voiceURI); setShowVoicePicker(false); }}
                          className={`w-full text-left px-3 py-2 text-[10px] transition-all hover:bg-white/5 ${
                            selectedVoiceURI === voice.voiceURI ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400'
                          } cursor-pointer`}
                        >
                          <span className="font-bold">{voice.name}</span>
                          <span className="text-slate-600 ml-1">({voice.lang})</span>
                          {voice.localService && <span className="text-emerald-600 ml-1">· local</span>}
                        </button>
                      ))}
                  </motion.div>
                )}
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
                {pendingAction.confirmation_message || "Sir, this action requires your explicit authorization. Shall we proceed?"}
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

