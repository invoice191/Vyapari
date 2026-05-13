import React, { useState, useEffect } from 'react';

interface CountUpProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export default function CountUp({ 
  target, 
  duration = 1500,
  prefix = "Rs.",
  suffix = ""
}: CountUpProps) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      setCurrent(Math.floor(progress * (target - startValue) + startValue));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [target, duration]);
  
  return (
    <span>
      {prefix}
      {current.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
