import React from "react";
import { Sparkles } from "lucide-react";

interface VANIQuickActionsProps {
  onSelect: (text: string) => void;
}

const ACTIONS = [
  "Create an invoice",
  "Check stock",
  "Who owes me money?",
  "Business this month",
];

export const VANIQuickActions: React.FC<VANIQuickActionsProps> = ({ onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
      {ACTIONS.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[13px] whitespace-nowrap hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <Sparkles size={14} className="text-indigo-500" />
          {action}
        </button>
      ))}
    </div>
  );
};
