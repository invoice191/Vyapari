import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, X, Maximize2, Minimize2 } from "lucide-react";
import { useVANI } from "./useVANI";
import { VANIMessage } from "./VANIMessage";
import { VANIInput } from "./VANIInput";
import { VANIQuickActions } from "./VANIQuickActions";
import { VANIActionBadge } from "./VANIActionBadge";

export const VANIPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, isLoading, process, clearMessages } = useVANI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all z-[999] group"
          >
            <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20" />
            <Bot size={28} className="text-white group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed z-[1000] bg-slate-50/95 backdrop-blur-xl border border-slate-200/60 shadow-2xl flex flex-col overflow-hidden ${
              isExpanded 
                ? "inset-4 sm:inset-10 rounded-3xl" 
                : "bottom-4 sm:bottom-6 right-4 sm:right-6 w-[380px] h-[600px] rounded-2xl"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
                  <Bot size={22} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-none mb-1">VANI 3.0</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] text-slate-500 font-medium">SYSTEM ONLINE</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors hidden sm:block"
                >
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <React.Fragment key={msg.id}>
                  <VANIMessage message={msg} />
                  {msg.action && msg.action.intent !== "CLARIFY" && (
                    <VANIActionBadge action={msg.action} />
                  )}
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions & Input */}
            <div className="shrink-0 bg-white/80 backdrop-blur-md flex flex-col gap-2 pt-2 pb-safe">
              {messages.length <= 2 && <VANIQuickActions onSelect={process} />}
              <VANIInput onSend={process} isLoading={isLoading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
