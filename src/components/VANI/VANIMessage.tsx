import React from "react";
import { Bot, User } from "lucide-react";
import type { VANIMessage as VANIMessageType } from "./vani.types";

export const VANIMessage: React.FC<{ message: VANIMessageType }> = ({ message }) => {
  const isVani = message.role === "vani";

  return (
    <div className={`flex gap-3 mb-4 ${isVani ? "justify-start" : "justify-end"}`}>
      {isVani && (
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <Bot size={18} className="text-indigo-600" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isVani
            ? "bg-white border border-slate-100 text-slate-700 shadow-sm"
            : "bg-indigo-600 text-white shadow-md rounded-tr-sm"
        } ${isVani ? "rounded-tl-sm" : ""}`}
      >
        {message.isTyping ? (
          <div className="flex gap-1 items-center h-6">
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-75" />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-150" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {message.content}
          </div>
        )}
      </div>
      {!isVani && (
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <User size={18} className="text-slate-500" />
        </div>
      )}
    </div>
  );
};
