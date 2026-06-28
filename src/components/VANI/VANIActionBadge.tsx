import React from "react";
import { Zap } from "lucide-react";
import type { VANIAction } from "./vani.types";

export const VANIActionBadge: React.FC<{ action: VANIAction }> = ({ action }) => {
  if (!action) return null;
  
  return (
    <div className="flex justify-center my-4">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 rounded-full text-indigo-700 text-xs font-medium shadow-sm backdrop-blur-sm">
        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
          <Zap size={12} className="text-indigo-600 fill-indigo-600" />
        </div>
        Executed: {action.intent.replace(/_/g, " ")}
      </div>
    </div>
  );
};
