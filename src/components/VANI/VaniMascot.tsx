import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, HelpCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface VaniMascotProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'confirming';
  transcript?: string;
  responseBrief?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  decay: number;
  type: 'star' | 'circle' | 'note';
}

export default function VaniMascot({ state, transcript, responseBrief }: VaniMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [blushActive, setBlushActive] = useState(false);
  const [wiggle, setWiggle] = useState(false);

  // Trigger wiggles and blushes on state transitions
  useEffect(() => {
    setBlushActive(true);
    setWiggle(true);
    const timer1 = setTimeout(() => setWiggle(false), 600);
    const timer2 = setTimeout(() => setBlushActive(false), 2000);
    
    // Spawn transition particles
    spawnBurst(100, 100, 15, state === 'listening' ? 'rose' : state === 'speaking' ? 'emerald' : 'cyan');

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [state]);

  // Particle generation
  const spawnBurst = (x: number, y: number, count: number, theme: 'rose' | 'cyan' | 'emerald' | 'gold') => {
    const colors = {
      rose: ['#ec4899', '#f43f5e', '#fda4af', '#f472b6'],
      cyan: ['#06b6d4', '#3b82f6', '#67e8f9', '#93c5fd'],
      emerald: ['#10b981', '#34d399', '#a7f3d0', '#059669'],
      gold: ['#f59e0b', '#fbbf24', '#fef08a', '#fb7185']
    }[theme];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // explode upwards
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        type: Math.random() > 0.6 ? 'star' : 'circle'
      });
    }
  };

  // Click interaction handler
  const handleMascotClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    setClickCount(prev => prev + 1);
    setWiggle(true);
    setBlushActive(true);
    setTimeout(() => setWiggle(false), 500);

    // Gravity burst explosion!
    spawnBurst(clickX, clickY, 25, 'gold');
  };

  // Continuous speech bubble & speaking animation tick
  useEffect(() => {
    if (state === 'speaking') {
      const interval = setInterval(() => {
        // Spawn musical note or sweet bubbles from her mouth
        particlesRef.current.push({
          x: 100,
          y: 125,
          vx: -1 + Math.random() * 2,
          vy: -2 - Math.random() * 2,
          size: 4 + Math.random() * 5,
          color: ['#10b981', '#a7f3d0', '#6ee7b7', '#f472b6'][Math.floor(Math.random() * 4)],
          alpha: 1,
          life: 1,
          decay: 0.02,
          type: 'note'
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [state]);

  // Main 60FPS Physics Gravity loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const gravity = 0.15;
    const friction = 0.98;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Physics update with simulated gravity
        p.vy += gravity;
        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;
        
        // Boundary collision (bounce off canvas walls)
        if (p.y > canvas.height - p.size) {
          p.y = canvas.height - p.size;
          p.vy = -p.vy * 0.6; // bounce elasticity
        }
        if (p.x < p.size || p.x > canvas.width - p.size) {
          p.vx = -p.vx * 0.8;
        }

        p.life -= p.decay;
        p.alpha = p.life;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        if (p.type === 'star') {
          // Draw standard custom star
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            ctx.lineTo(
              p.x + p.size * Math.cos((18 + j * 72) * Math.PI / 180),
              p.y - p.size * Math.sin((18 + j * 72) * Math.PI / 180)
            );
            ctx.lineTo(
              p.x + (p.size / 2) * Math.cos((54 + j * 72) * Math.PI / 180),
              p.y - (p.size / 2) * Math.sin((54 + j * 72) * Math.PI / 180)
            );
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'note') {
          // Draw a tiny musical note symbol
          ctx.font = `${p.size * 2}px sans-serif`;
          ctx.fillText('♫', p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Determine Anime character styling attributes
  const eyeScaleY = state === 'listening' ? 'scale-y-[0.4]' : 'scale-y-100';
  const mouthPath = {
    idle: 'M 93 125 Q 100 128 107 125',
    listening: 'M 95 125 Q 100 126 105 125',
    thinking: 'M 97 126 A 3 3 0 1 1 103 126',
    speaking: 'M 94 125 Q 100 132 106 125', // morphing loop via CSS below
    confirming: 'M 92 125 Q 100 121 108 125'
  }[state];

  // Headset glow coloring
  const headsetGlow = {
    idle: 'shadow-[0_0_15px_#06b6d4]',
    listening: 'shadow-[0_0_20px_#f43f5e] animate-pulse',
    thinking: 'shadow-[0_0_15px_#f59e0b]',
    speaking: 'shadow-[0_0_20px_#10b981] animate-bounce-slow',
    confirming: 'shadow-[0_0_15px_#f97316]'
  }[state];

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col items-center justify-center select-none pointer-events-auto">
      {/* 2D Physics Canvas */}
      <canvas 
        ref={canvasRef} 
        width={220} 
        height={180} 
        className="absolute inset-0 pointer-events-none z-10" 
      />

      {/* Reactive Cute Speech Bubbles above character */}
      <AnimatePresence mode="wait">
        {state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className="absolute top-[-55px] z-30 max-w-[200px] bg-slate-900/90 border border-indigo-500/30 text-white rounded-2xl px-4 py-2 text-[10px] font-bold text-center shadow-lg backdrop-blur-md"
          >
            <div className="absolute bottom-[-6px] left-[50%] translate-x-[-50%] w-3 h-3 bg-slate-900 border-r border-b border-indigo-500/30 rotate-45" />
            <div className="flex items-center justify-center gap-1">
              {state === 'listening' && <span className="text-rose-400 animate-pulse flex items-center">Listening <Volume2 size={10} className="ml-1" /></span>}
              {state === 'thinking' && <span className="text-amber-400 animate-bounce flex items-center">Analyzing... <HelpCircle size={10} className="ml-1" /></span>}
              {state === 'speaking' && <span className="text-emerald-400 flex items-center">Speaking... <Volume2 size={10} className="ml-1" /></span>}
              {state === 'confirming' && <span className="text-orange-400 flex items-center">Confirm? <AlertCircle size={10} className="ml-1" /></span>}
            </div>
            {transcript && <p className="text-slate-300 font-normal line-clamp-1 italic mt-0.5">"{transcript}"</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main High-Fidelity Anime character SVG */}
      <motion.div
        animate={wiggle ? { 
          rotate: [0, -6, 6, -3, 3, 0],
          y: [0, -10, 0, -4, 0]
        } : {
          y: state === 'speaking' ? [0, -4, 0] : [0, -2, 0],
          rotate: state === 'speaking' ? [-1, 1, -1] : 0
        }}
        transition={wiggle ? { duration: 0.5 } : {
          repeat: Infinity,
          duration: state === 'speaking' ? 0.6 : 3.5,
          ease: "easeInOut"
        }}
        onClick={handleMascotClick}
        className="w-36 h-36 relative cursor-pointer group z-20"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(99,102,241,0.25)]">
          {/* Cyber Hair Back */}
          <path 
            d="M 60 140 C 40 100 45 40 100 35 C 155 40 160 100 140 140 C 120 180 80 180 60 140 Z" 
            fill="url(#hairBackGrad)" 
            className="transition-all duration-1000"
          />

          {/* Ears */}
          <ellipse cx="50" cy="105" rx="8" ry="12" fill="#FFDFC4" transform="rotate(-15 50 105)" />
          <ellipse cx="150" cy="105" rx="8" ry="12" fill="#FFDFC4" transform="rotate(15 150 105)" />

          {/* Cute Chibi Skin Face */}
          <ellipse cx="100" cy="105" rx="46" ry="42" fill="#FFEFE0" />

          {/* Cute Pink Blushes */}
          <g className={`transition-opacity duration-500 ${blushActive || state === 'listening' ? 'opacity-90' : 'opacity-40'}`}>
            <ellipse cx="70" cy="118" rx="10" ry="6" fill="#FF8D9E" />
            <ellipse cx="130" cy="118" rx="10" ry="6" fill="#FF8D9E" />
            {/* Blushing lines */}
            <path d="M 66 116 L 68 122 M 70 116 L 72 122 M 74 116 L 76 122" stroke="#FF5376" strokeWidth="1" />
            <path d="M 126 116 L 128 122 M 130 116 L 132 122 M 132 116 L 134 122" stroke="#FF5376" strokeWidth="1" />
          </g>

          {/* Cyber Headset - High-tech neon ear cups */}
          <circle cx="48" cy="105" r="14" fill="#1e1b4b" stroke="url(#neonCyan)" strokeWidth="2.5" />
          <circle cx="152" cy="105" r="14" fill="#1e1b4b" stroke="url(#neonCyan)" strokeWidth="2.5" />
          {/* Headset Arc Band */}
          <path d="M 48 95 C 48 50 152 50 152 95" fill="none" stroke="#1e1b4b" strokeWidth="6" />
          <path d="M 48 95 C 48 50 152 50 152 95" fill="none" stroke="url(#neonCyan)" strokeWidth="1.5" className="animate-pulse" />

          {/* Big Sparkling Anime Eyes */}
          <g className="transition-transform duration-500">
            {/* Left Eye */}
            <g className={`origin-[73px_100px] transition-all duration-300 ${eyeScaleY}`}>
              {/* Eye Shadow & Base */}
              <ellipse cx="73" cy="100" rx="13" ry="15" fill="#111827" />
              {/* Eye iris color gradient */}
              <ellipse cx="73" cy="101" rx="11" ry="13" fill="url(#eyeGrad)" />
              {/* Star Pupil or Sparkle */}
              {state === 'listening' ? (
                <path d="M 73 97 L 75 101 L 79 101 L 76 104 L 77 108 L 73 105 L 69 108 L 70 104 L 67 101 L 71 101 Z" fill="#FFFFFF" />
              ) : (
                <>
                  <circle cx="70" cy="95" r="4.5" fill="#FFFFFF" />
                  <circle cx="76" cy="105" r="2" fill="#FFFFFF" />
                </>
              )}
            </g>

            {/* Right Eye */}
            <g className={`origin-[127px_100px] transition-all duration-300 ${eyeScaleY}`}>
              {/* Eye Shadow & Base */}
              <ellipse cx="127" cy="100" rx="13" ry="15" fill="#111827" />
              {/* Eye iris color gradient */}
              <ellipse cx="127" cy="101" rx="11" ry="13" fill="url(#eyeGrad)" />
              {/* Star Pupil or Sparkle */}
              {state === 'listening' ? (
                <path d="M 127 97 L 129 101 L 133 101 L 130 104 L 131 108 L 127 105 L 123 108 L 124 104 L 121 101 L 125 101 Z" fill="#FFFFFF" />
              ) : (
                <>
                  <circle cx="124" cy="95" r="4.5" fill="#FFFFFF" />
                  <circle cx="130" cy="105" r="2" fill="#FFFFFF" />
                </>
              )}
            </g>
          </g>

          {/* Cute animated speaking/thinking eyebrows */}
          <g className="transition-transform duration-300">
            {state === 'thinking' ? (
              <>
                <path d="M 60 84 Q 72 75 80 82" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 120 82 Q 128 75 140 84" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : state === 'confirming' ? (
              <>
                <path d="M 60 82 Q 72 85 80 81" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 120 81 Q 128 85 140 82" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M 60 80 Q 72 76 80 81" fill="none" stroke="#312E81" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 120 81 Q 128 76 140 80" fill="none" stroke="#312E81" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}
          </g>

          {/* Cute Cyber Hair Front Bangs */}
          <path 
            d="M 52 82 C 60 70 80 72 90 85 C 93 88 95 88 97 80 C 105 70 125 72 135 83 C 145 70 152 85 152 95 C 135 82 120 98 108 92 C 105 90 95 90 92 92 C 80 98 65 82 48 95 C 48 85 50 82 52 82 Z" 
            fill="url(#hairFrontGrad)" 
          />

          {/* Cyber Hair Highlight shines */}
          <path d="M 62 76 Q 78 68 86 78" fill="none" stroke="#E0E7FF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M 114 78 Q 122 68 138 76" fill="none" stroke="#E0E7FF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          {/* Reactive Cute Mouth */}
          <g>
            {state === 'speaking' ? (
              /* Talking animation loop mouth with simple CSS */
              <path 
                d="M 94 125 Q 100 133 106 125 Q 100 121 94 125 Z" 
                fill="#FF6B6B" 
                stroke="#47000B" 
                strokeWidth="1.5"
                className="animate-mouth-talk"
              />
            ) : (
              <path 
                d={mouthPath} 
                fill={state === 'thinking' ? '#FF8D9E' : 'none'} 
                stroke="#47000B" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />
            )}
          </g>

          {/* High-tech collar & cute futuristic tie costume */}
          <path d="M 75 145 L 125 145 L 120 165 L 80 165 Z" fill="#1E293B" />
          <path d="M 75 145 L 100 156 L 125 145 L 115 178 L 85 178 Z" fill="#F8FAFC" />
          {/* Neon tie */}
          <path d="M 97 154 L 103 154 L 105 178 L 100 185 L 95 178 Z" fill="url(#neonCyan)" />

          {/* Defining gradients and neon custom elements */}
          <defs>
            <linearGradient id="hairBackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="hairFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="40%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
            <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating holographic state indicator sparks */}
        <div className="absolute top-[20px] right-[-5px]">
          {state === 'speaking' && <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />}
          {state === 'listening' && <Sparkles className="w-5 h-5 text-rose-400 animate-bounce" />}
          {state === 'thinking' && <div className="w-4 h-4 rounded-full border border-t-amber-400 animate-spin" />}
        </div>
      </motion.div>

      {/* Styled inline animations for custom anime mouth speaking */}
      <style>{`
        @keyframes mouthTalk {
          0%, 100% { d: path('M 94 125 Q 100 128 106 125 Q 100 123 94 125 Z'); }
          50% { d: path('M 92 125 Q 100 136 108 125 Q 100 119 92 125 Z'); }
        }
        .animate-mouth-talk {
          animation: mouthTalk 0.16s infinite ease-in-out;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-bounce-slow {
          animation: bounce 1.8s infinite;
        }
      `}</style>
    </div>
  );
}
