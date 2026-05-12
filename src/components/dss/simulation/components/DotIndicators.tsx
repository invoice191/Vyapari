import React from 'react';
import { motion } from 'motion/react';

interface DotIndicatorsProps {
  count: number;
  current: number;
  onSelect: (index: number) => void;
  theme: 'dark' | 'light';
}

export default function DotIndicators({ count, current, onSelect, theme }: DotIndicatorsProps) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.button
          key={i}
          onClick={() => onSelect(i)}
          className="relative h-2 rounded-full focus:outline-none"
          animate={{
            width: current === i ? 32 : 8,
            backgroundColor: current === i 
              ? (theme === 'dark' ? '#6366F1' : '#4F46E5') 
              : (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.1)')
          }}
          whileHover={{ scale: 1.2 }}
        >
          {current === i && (
            <motion.div 
              layoutId="activeDotGlow"
              className="absolute inset-0 rounded-full blur-[4px] bg-indigo-500/50"
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
