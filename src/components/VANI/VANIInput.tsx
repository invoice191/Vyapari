import React, { useState } from "react";
import { Mic, Send, Square } from "lucide-react";
import { useVANIVoice } from "./useVANIVoice";

interface VANIInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export const VANIInput: React.FC<VANIInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState("");
  const { isListening, start, stop } = useVANIVoice((transcript) => {
    setText(transcript);
    onSend(transcript);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2 p-3 bg-white border-t border-slate-100">
      <button
        type="button"
        onClick={isListening ? stop : start}
        className={`p-3 rounded-full transition-colors flex-shrink-0 ${
          isListening 
            ? "bg-red-100 text-red-600 animate-pulse" 
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {isListening ? <Square size={20} className="fill-current" /> : <Mic size={20} />}
      </button>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isListening ? "Listening..." : "Ask VANI..."}
        disabled={isLoading || isListening}
        className="flex-1 bg-slate-50 border-none rounded-full px-5 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="p-3 rounded-full bg-indigo-600 text-white disabled:opacity-50 disabled:bg-slate-300 hover:bg-indigo-700 transition-colors flex-shrink-0"
      >
        <Send size={18} className="ml-0.5" />
      </button>
    </form>
  );
};
