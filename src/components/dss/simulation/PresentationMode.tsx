import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Settings, Share2, 
  Maximize, Minimize, Play, Pause, Monitor, 
  Layout, MessageSquare, Info
} from 'lucide-react';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { useSwipeNav } from './hooks/useSwipeNav';
import { useFullscreen } from './hooks/useFullscreen';
import { useAutoPlay } from './hooks/useAutoPlay';

import DotIndicators from './components/DotIndicators';
import SettingsPanel from './components/SettingsPanel';
import ThumbnailStrip from './components/ThumbnailStrip';
import PresenterNotes from './components/PresenterNotes';
import ShareModal from './components/ShareModal';

import CoverSlide from './slides/CoverSlide';
import ExecutiveSummarySlide from './slides/ExecutiveSummarySlide';
import FinancialImpactSlide from './slides/FinancialImpactSlide';
import RevenueChartSlide from './slides/RevenueChartSlide';
import ProductBreakdownSlide from './slides/ProductBreakdownSlide';
import ForecastChartSlide from './slides/ForecastChartSlide';
import BreakEvenSlide from './slides/BreakEvenSlide';
import RecommendationsSlide from './slides/RecommendationsSlide';
import ClosingSlide from './slides/ClosingSlide';

interface PresentationModeProps {
  data: any;
  business: any;
  onExit: () => void;
}

export type Theme = 'dark' | 'light';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export default function PresentationMode({ data, business, onExit }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  // Settings State
  const [autoPlay, setAutoPlay] = useState(false);
  const [slideDuration, setSlideDuration] = useState(5);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>('normal');
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [showSlideNumbers, setShowSlideNumbers] = useState(true);

  const slides = [
    { id: 'cover', component: CoverSlide },
    { id: 'executive', component: ExecutiveSummarySlide },
    { id: 'financial', component: FinancialImpactSlide },
    { id: 'revenue', component: RevenueChartSlide },
    { id: 'product', component: ProductBreakdownSlide },
    { id: 'forecast', component: ForecastChartSlide },
    { id: 'breakeven', component: BreakEvenSlide },
    { id: 'recommendations', component: RecommendationsSlide },
    { id: 'closing', component: ClosingSlide },
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    } else if (autoPlay) {
      setDirection(1);
      setCurrentSlide(0); // Loop back
    }
  }, [currentSlide, totalSlides, autoPlay]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  // Hooks
  useKeyboardNav({ 
    nextSlide, 
    prevSlide, 
    onExit, 
    toggleFullscreen: () => toggleFullscreen(),
    goToSlide,
    toggleThumbnails: () => setShowThumbnails(prev => !prev),
    toggleNotes: () => setShowNotes(prev => !prev)
  });

  const { handleTouchStart, handleTouchEnd } = useSwipeNav({ nextSlide, prevSlide });
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();
  
  useAutoPlay({ 
    enabled: autoPlay, 
    duration: slideDuration, 
    onNext: nextSlide, 
    currentSlide 
  });

  // Entry Animation
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.05
    })
  };

  const transitionDuration = animationSpeed === 'slow' ? 0.8 : animationSpeed === 'fast' ? 0.2 : 0.4;

  const CurrentSlideComponent = slides[currentSlide].component;

  const themeColors = {
    dark: {
      bg: 'bg-[#0F172A]',
      card: 'bg-white/10',
      text: 'text-white',
      border: 'border-white/20',
      glass: 'backdrop-blur-xl bg-slate-900/40'
    },
    light: {
      bg: 'bg-[#FFFFFF]',
      card: 'bg-[#F8FAFC]',
      text: 'text-[#0F172A]',
      border: 'border-[#E2E8F0]',
      glass: 'backdrop-blur-xl bg-white/60'
    }
  };

  const colors = themeColors[theme];

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col transition-colors duration-700 ${colors.bg} ${fontSize === 'large' ? 'text-lg' : 'text-base'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[10000] bg-black flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="text-4xl font-black text-white tracking-[0.5em] mb-4 italic">VYAPARI INTELLIGENCE</h1>
              <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="h-full bg-indigo-500 shadow-[0_0_20px_#6366f1]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className={`h-20 px-8 flex items-center justify-between z-50 ${colors.glass} border-b ${colors.border}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black italic">V</div>
          <div>
            <h2 className={`text-sm font-black tracking-tighter uppercase ${colors.text}`}>Vyapari Intelligence</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{business?.name || 'Retail Intelligence'}</p>
          </div>
        </div>

        {showSlideNumbers && (
          <div className={`text-xs font-black uppercase tracking-[0.3em] ${colors.text} opacity-50`}>
            Slide {currentSlide + 1} / {totalSlides}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowShare(true)}
            className={`p-3 rounded-xl border ${colors.border} ${colors.text} hover:bg-white/10 transition-all`}
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className={`p-3 rounded-xl border ${colors.border} ${colors.text} hover:bg-white/10 transition-all`}
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={onExit}
            className="p-3 px-6 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center gap-2"
          >
            <X size={14} /> Exit
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center px-6 lg:px-12 py-6 z-10 min-h-0 overflow-y-auto custom-scrollbar">
        
        {/* Cinematic Graphic Background layer injected globally */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
           <motion.div 
             animate={{ 
               scale: [1, 1.2, 1],
               x: [0, 50, 0],
               y: [0, 30, 0],
               opacity: [0.15, 0.25, 0.15]
             }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]"
           />
           <motion.div 
             animate={{ 
               scale: [1, 1.1, 1],
               x: [0, -50, 0],
               y: [0, 40, 0],
               opacity: [0.1, 0.2, 0.1]
             }}
             transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
             className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px]"
           />
           
           {/* Scanline Effect */}
           <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none opacity-20" />
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: transitionDuration },
              scale: { duration: transitionDuration }
            }}
            className="w-full h-full max-w-7xl mx-auto flex items-center justify-center relative z-10 min-h-0"
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
               <CurrentSlideComponent data={data} business={business} theme={theme} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Presenter Notes Overlay */}
        <AnimatePresence>
          {showNotes && (
            <PresenterNotes 
              slideIndex={currentSlide} 
              onClose={() => setShowNotes(false)} 
              theme={theme}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar */}
      <div className={`h-24 px-8 flex items-center justify-between z-50 ${colors.glass} border-t ${colors.border}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`p-4 rounded-2xl border ${colors.border} ${colors.text} disabled:opacity-20 hover:bg-white/10 transition-all`}
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={() => setAutoPlay(!autoPlay)}
            className={`p-4 rounded-2xl border ${colors.border} ${autoPlay ? 'bg-indigo-600 text-white border-indigo-500' : colors.text + ' hover:bg-white/10'} transition-all`}
          >
            {autoPlay ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>

        <DotIndicators 
          count={totalSlides} 
          current={currentSlide} 
          onSelect={goToSlide} 
          theme={theme}
        />

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNotes(!showNotes)}
            className={`p-4 rounded-2xl border ${colors.border} ${showNotes ? 'bg-indigo-600 text-white border-indigo-500' : colors.text + ' hover:bg-white/10'} transition-all`}
          >
            <MessageSquare size={24} />
          </button>
          <button 
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-4 rounded-2xl border ${colors.border} ${showThumbnails ? 'bg-indigo-600 text-white border-indigo-500' : colors.text + ' hover:bg-white/10'} transition-all`}
          >
            <Layout size={24} />
          </button>
          <button 
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1 && !autoPlay}
            className={`p-4 rounded-2xl border ${colors.border} ${colors.text} disabled:opacity-20 hover:bg-white/10 transition-all`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel 
            onClose={() => setShowSettings(false)}
            settings={{ autoPlay, slideDuration, animationSpeed, theme, fontSize, showSlideNumbers }}
            onUpdate={(key, val) => {
              if (key === 'autoPlay') setAutoPlay(val as boolean);
              if (key === 'slideDuration') setSlideDuration(val as number);
              if (key === 'animationSpeed') setAnimationSpeed(val as AnimationSpeed);
              if (key === 'theme') setTheme(val as Theme);
              if (key === 'fontSize') setFontSize(val as 'normal' | 'large');
              if (key === 'showSlideNumbers') setShowSlideNumbers(val as boolean);
            }}
            theme={theme}
          />
        )}
        {showThumbnails && (
          <ThumbnailStrip 
            slides={slides} 
            current={currentSlide} 
            onSelect={goToSlide} 
            onClose={() => setShowThumbnails(false)}
            theme={theme}
          />
        )}
        {showShare && (
          <ShareModal 
            data={data}
            onClose={() => setShowShare(false)}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
