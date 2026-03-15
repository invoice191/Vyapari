import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, PerspectiveCamera, MeshWobbleMaterial, ContactShadows, Environment, Float as FloatDrei } from '@react-three/drei';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView, useMotionValue } from 'motion/react';
import { C, REGISTERED_SHOPS } from '../constants';
import * as THREE from 'three';

// --- Helper Components ---

const BackgroundGrid = () => (
  <div style={{
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
    pointerEvents: 'none',
    zIndex: -1
  }} />
);

const Marquee = ({ items }: { items: string[] }) => (
  <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', padding: '48px 0' }}>
    <motion.div
      animate={{ x: [0, -1000] }}
      transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
      style={{ display: 'inline-block' }}
    >
      {[...items, ...items, ...items].map((item, i) => (
        <span key={i} style={{ 
          fontSize: 24, fontWeight: 900, color: C.light, 
          letterSpacing: 8, margin: '0 80px', opacity: 0.3 
        }}>
          {item}
        </span>
      ))}
    </motion.div>
  </div>
);

const FloatingIcon = ({ icon, initialX, initialY, delay = 0, size = 40 }: any) => {
  return (
    <motion.div
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 0.6, 
        scale: 1,
        y: [initialY, initialY - 40, initialY],
        rotateZ: [0, 10, -10, 0],
        rotateY: [0, 180, 360]
      }}
      transition={{ 
        opacity: { duration: 1, delay },
        scale: { duration: 1, delay },
        y: { repeat: Infinity, duration: 4 + Math.random() * 2, ease: "easeInOut" },
        rotateZ: { repeat: Infinity, duration: 5 + Math.random() * 2, ease: "easeInOut" },
        rotateY: { repeat: Infinity, duration: 10 + Math.random() * 5, ease: "linear" }
      }}
      style={{
        position: 'absolute',
        fontSize: size,
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))',
        zIndex: 5,
        pointerEvents: 'none',
        transformStyle: 'preserve-3d'
      }}
    >
      <div style={{ transform: 'translateZ(20px)' }}>{icon}</div>
    </motion.div>
  );
};

const TiltCard = ({ children, style = {}, glare = true }: any) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareOpacity = useTransform(mouseXSpring, [-0.5, 0, 0.5], [0.6, 0, 0.6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
    >
      <div style={{ 
        transform: "translateZ(50px)", 
        transformStyle: "preserve-3d",
        height: '100%',
        width: '100%',
        position: 'relative'
      }}>
        {children}
        {glare && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.3) 0%, transparent 80%)`,
              opacity: glareOpacity,
              pointerEvents: 'none',
              zIndex: 20,
              borderRadius: 'inherit'
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

// --- 3D Components ---

function AnimatedBackground() {
  const { scrollYProgress } = useScroll();
  
  // Parallax and movement based on scroll - more dramatic "fly-past"
  const yPos = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const xPos = useTransform(scrollYProgress, [0, 0.5, 1], [0, 15, -15]);
  const zPos = useTransform(scrollYProgress, [0, 1], [0, 25]); // Move towards camera
  const rotation = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 3]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.8, 0.4]);
  
  const springY = useSpring(yPos, { stiffness: 30, damping: 20 });
  const springX = useSpring(xPos, { stiffness: 30, damping: 20 });
  const springZ = useSpring(zPos, { stiffness: 30, damping: 20 });
  const springRot = useSpring(rotation, { stiffness: 30, damping: 20 });
  const springScale = useSpring(scale, { stiffness: 30, damping: 20 });

  const group = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.position.y = springY.get();
    group.current.position.x = springX.get();
    group.current.position.z = springZ.get();
    group.current.rotation.y = springRot.get() * 0.2 + Math.sin(t * 0.1) * 0.1;
    group.current.rotation.x = Math.cos(t * 0.1) * 0.05;
    group.current.scale.setScalar(springScale.get());
  });

  return (
    <group ref={group}>
      {/* Primary Distorted Sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[2.5, 128, 128]} position={[-8, 4, -5]}>
          <MeshDistortMaterial color={C.orange} speed={4} distort={0.4} radius={1} metalness={0.6} roughness={0.1} />
        </Sphere>
      </Float>
      
      {/* Secondary Wobble Sphere */}
      <Float speed={3} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[1.5, 64, 64]} position={[10, -6, -2]}>
          <MeshWobbleMaterial color={C.blue} speed={3} factor={0.5} metalness={0.9} roughness={0.05} />
        </Sphere>
      </Float>

      {/* Floating Torus */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
        <mesh position={[6, 8, -8]}>
          <torusKnotGeometry args={[1.8, 0.5, 256, 32]} />
          <meshStandardMaterial color={C.purple} roughness={0} metalness={1} />
        </mesh>
      </Float>

      {/* Subtle background particles or smaller shapes */}
      {Array.from({ length: 100 }).map((_, i) => (
        <Float key={i} speed={Math.random() * 3} position={[Math.random() * 100 - 50, Math.random() * 100 - 50, -30]}>
          <mesh>
            <sphereGeometry args={[Math.random() * 0.2 + 0.05, 16, 16]} />
            <meshStandardMaterial color={i % 2 === 0 ? C.orange : C.blue} transparent opacity={0.2} />
          </mesh>
        </Float>
      ))}

      <ContactShadows position={[0, -12, 0]} opacity={0.25} scale={50} blur={3} far={25} />
    </group>
  );
}

// --- UI Components ---

const InfoSection = ({ title, subtitle, content, reverse = false, icon, imageSeed }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section ref={ref} style={{ 
      padding: 'clamp(120px, 15vh, 200px) clamp(24px, 5vw, 80px)', 
      display: 'flex', 
      flexDirection: reverse ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 'clamp(48px, 8vw, 120px)',
      position: 'relative',
      zIndex: 10,
      background: isInView ? 'rgba(255,255,255,0.03)' : 'transparent',
      transition: 'background 1.5s ease',
      perspective: 2000,
      maxWidth: 1600,
      margin: '0 auto'
    }}>
      <div style={{ flex: 1 }}>
        <motion.div
          initial={{ opacity: 0, x: reverse ? 100 : -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotateY: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            style={{ 
              fontSize: 80, 
              marginBottom: 32, 
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))',
              display: 'inline-block',
              transformStyle: 'preserve-3d'
            }}
          >
            <div style={{ transform: 'translateZ(40px)' }}>{icon}</div>
          </motion.div>
          <h2 style={{ 
            fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 900, color: C.dark, 
            marginBottom: 32, letterSpacing: -3, lineHeight: 0.9,
            textShadow: '0 10px 30px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)'
          }}>
            {title}
          </h2>
          <p style={{ fontSize: 22, color: C.mid, lineHeight: 1.6, fontWeight: 500, maxWidth: 580, marginBottom: 48 }}>
            {subtitle}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {content.map((item: string, i: number) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.6 + i * 0.15 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ 
                  width: 10, height: 10, borderRadius: '50%', 
                  background: `linear-gradient(135deg, ${C.orange}, #FF8C5A)`,
                  boxShadow: `0 0 15px ${C.orange}60`
                }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <TiltCard style={{ width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: reverse ? -30 : 30 }}
            animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
              width: '100%', 
              aspectRatio: '16/10', 
              background: 'white',
              borderRadius: 32,
              padding: 16,
              boxShadow: '0 80px 150px rgba(0,0,0,0.15), 0 20px 50px rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'hidden',
              transformStyle: 'preserve-3d',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
          >
            <div style={{ 
              width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden',
              position: 'relative', transform: 'translateZ(30px)'
            }}>
              <motion.img 
                src={`https://picsum.photos/seed/${imageSeed}/1200/800`} 
                alt={title}
                referrerPolicy="no-referrer"
                style={{ width: '110%', height: '110%', objectFit: 'cover', margin: '-5%' }}
                animate={{
                  x: [0, 10, -10, 0],
                  y: [0, -10, 10, 0]
                }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              />
              <div style={{ 
                position: 'absolute', inset: 0, 
                background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                display: 'flex', alignItems: 'flex-end', padding: 40
              }}>
                <div style={{ 
                  color: 'white', fontSize: 64, 
                  filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.4))',
                  transform: 'translateZ(50px)'
                }}>
                  {icon}
                </div>
              </div>
            </div>
            {/* Glass Reflection */}
            <div style={{ 
              position: 'absolute', inset: 0, 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 40%, rgba(255,255,255,0.1) 100%)',
              pointerEvents: 'none',
              zIndex: 10
            }} />
          </motion.div>
        </TiltCard>
      </div>
    </section>
  );
};

const CapabilityItem = ({ title, desc, icon, delay = 0 }: any) => (
  <TiltCard style={{ height: '100%' }}>
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ 
        scale: 1.05, 
        boxShadow: '0 40px 80px rgba(0,0,0,0.1)',
        translateY: -10
      }}
      style={{
        padding: 40,
        borderRadius: 32,
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        height: '100%',
        boxShadow: '0 15px 40px rgba(0,0,0,0.03)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d'
      }}
    >
      <motion.div 
        animate={{ 
          rotateZ: [0, 10, -10, 0],
          y: [0, -5, 0]
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        style={{ 
          fontSize: 56, 
          marginBottom: 24, 
          filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))',
          transform: 'translateZ(30px)',
          display: 'inline-block'
        }}
      >
        {icon}
      </motion.div>
      <h4 style={{ 
        fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 12, letterSpacing: -1,
        transform: 'translateZ(20px)'
      }}>{title}</h4>
      <p style={{ 
        fontSize: 16, color: C.mid, lineHeight: 1.6, fontWeight: 500,
        transform: 'translateZ(10px)'
      }}>{desc}</p>
    </motion.div>
  </TiltCard>
);

const Testimonial = ({ quote, author, role }: any) => (
  <TiltCard style={{ flex: 1, minWidth: 300 }}>
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      style={{
        padding: 48,
        borderRadius: 32,
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.03)',
        textAlign: 'left',
        height: '100%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.04)',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ fontSize: 40, color: C.orange, marginBottom: 24, filter: 'drop-shadow(0 5px 10px rgba(255,100,0,0.2))' }}>"</div>
      <p style={{ fontSize: 22, fontWeight: 600, color: C.dark, lineHeight: 1.4, marginBottom: 32, letterSpacing: -0.5 }}>
        {quote}
      </p>
      <div>
        <div style={{ fontWeight: 900, color: C.dark, fontSize: 16 }}>{author}</div>
        <div style={{ fontWeight: 600, color: C.mid, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{role}</div>
      </div>
    </motion.div>
  </TiltCard>
);

export default function LandingPage({ onStart }: { onStart: () => void }) {
  const { scrollYProgress } = useScroll();
  
  // Hero specific transforms
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.1], [0, -150]);
  
  // Nav background logic
  const navBg = useTransform(scrollYProgress, [0, 0.05], ["rgba(255,255,255,0)", "rgba(255,255,255,0.98)"]);
  const navBorder = useTransform(scrollYProgress, [0, 0.05], ["rgba(0,0,0,0)", "rgba(0,0,0,0.08)"]);

  return (
    <div className="w-screen bg-white overflow-x-hidden relative scroll-smooth selection:bg-neon selection:text-ink">
      {/* 3D Scene - Fixed Background */}
      <motion.div 
        className="fixed inset-0 z-1 pointer-events-none"
        style={{ opacity: useTransform(scrollYProgress, [0, 0.5], [0.8, 0.3]) }}
      >
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 12]} />
            <ambientLight intensity={0.7} />
            <pointLight position={[15, 15, 15]} intensity={2} />
            <Environment preset="studio" />
            <AnimatedBackground />
          </Suspense>
        </Canvas>
      </motion.div>

      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-[1000] px-6 md:px-12 py-6 flex justify-between items-center transition-all duration-500"
        style={{ 
          background: navBg,
          borderBottom: '4px solid',
          borderColor: navBorder,
          backdropFilter: 'blur(40px)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ink flex items-center justify-center text-white font-black text-xl shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">V</div>
          <span className="font-black text-2xl tracking-tighter uppercase italic">VYAPARI</span>
        </div>
        
        <div className="hidden md:flex gap-12 items-center">
          {['Platform', 'Solutions', 'Insights', 'Company'].map(item => (
            <motion.a 
              key={item} 
              href="#" 
              whileHover={{ y: -2 }} 
              className="text-[10px] font-black uppercase tracking-widest text-ink/60 hover:text-ink transition-colors"
            >
              {item}
            </motion.a>
          ))}
          <button
            onClick={onStart}
            className="brutal-btn bg-ink text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest"
          >
            INITIALIZE_SYSTEM
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="h-screen relative z-10 flex flex-col justify-center items-center text-center px-6 md:px-12 overflow-hidden">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="max-w-7xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-block px-6 py-2 border-4 border-ink bg-neon text-ink font-black text-[10px] uppercase tracking-[0.3em] mb-12 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              INTELLIGENCE_LAYER_V2.5
            </div>
            
            <h1 className="text-[clamp(60px,15vw,180px)] font-black text-ink leading-[0.85] tracking-[-0.05em] mb-12 uppercase italic">
              VYAPARI <br />
              <span className="text-neon drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">EVOLVED.</span>
            </h1>
            
            <p className="text-[clamp(18px,2.5vw,32px)] text-ink/80 leading-tight max-w-4xl mx-auto mb-16 font-bold tracking-tight uppercase">
              Transform your retail operations with AI-driven insights, <br className="hidden md:block" />
              real-time simulations, and automated excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={onStart}
                className="brutal-btn bg-neon text-ink px-16 py-6 text-xl font-black uppercase tracking-widest"
              >
                LAUNCH_PLATFORM
              </button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 15, 0] }} 
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute bottom-12 text-4xl font-thin opacity-20"
        >
          ↓
        </motion.div>
      </section>

      {/* Content Wrapper */}
      <div className="relative z-10 bg-white/90 backdrop-blur-3xl border-t-8 border-ink">
        <BackgroundGrid />
        
        {/* Trusted By Marquee */}
        <section className="border-b-4 border-ink bg-white py-12 overflow-hidden">
          <div className="text-[10px] font-black text-ink/40 uppercase tracking-[0.5em] text-center mb-8">REGISTERED_NETWORK_NODES</div>
          <Marquee items={REGISTERED_SHOPS} />
        </section>

        {/* Pillar 1: AI Analytics */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 grid md:grid-cols-2 gap-24 items-center">
          <div className="space-y-8">
            <div className="text-6xl mb-8 drop-shadow-[8px_8px_0px_rgba(0,0,0,0.1)]">📊</div>
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none italic">Real-time_Vision</h2>
            <p className="text-xl font-bold text-ink/60 leading-relaxed uppercase tracking-tight">
              Stop looking at yesterday's data. Our platform provides a live pulse of your entire retail network, from individual SKUs to global trends.
            </p>
            <div className="space-y-4">
              {[
                "Live transaction monitoring across all channels",
                "Instant inventory reconciliation and stock alerts",
                "Customer behavior heatmaps and journey tracking",
                "Automated anomaly detection for loss prevention"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-3 h-3 bg-neon border-2 border-ink group-hover:scale-150 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-widest text-ink">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="brutal-card bg-white p-4 rotate-2 hover:rotate-0 transition-transform duration-500">
            <img 
              src="https://picsum.photos/seed/analytics/1200/800" 
              alt="Analytics" 
              className="w-full grayscale hover:grayscale-0 transition-all duration-700 border-4 border-ink"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Pillar 2: Simulations */}
        <InfoSection 
          reverse
          icon="🧠"
          imageSeed="brain"
          title="Predict the Future"
          subtitle="Run complex 'what-if' scenarios with our Gemini-powered simulation engine. Understand the impact of price changes before you make them."
          content={[
            "Market share impact analysis for new products",
            "Dynamic price elasticity modeling for optimization",
            "Promotion effectiveness scoring and ROI prediction",
            "Competitor response forecasting and strategy"
          ]}
        />

        {/* Process Section - Adding more content density */}
        <section style={{ padding: 'clamp(120px, 15vh, 200px) clamp(24px, 5vw, 80px)', position: 'relative', overflow: 'hidden' }}>
          <motion.div 
            style={{ 
              position: 'absolute', top: '20%', left: '-10%', fontSize: 300, 
              fontWeight: 900, color: 'rgba(0,0,0,0.02)', pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
            animate={{ x: [0, -200, 0] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          >
            PROCESS WORKFLOW SYSTEM
          </motion.div>

          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 96 }}>
              <h2 style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 900, color: C.dark, letterSpacing: -4, marginBottom: 24 }}>
                HOW WE <span style={{ color: C.orange }}>EVOLVE.</span>
              </h2>
              <p style={{ fontSize: 20, color: C.mid, fontWeight: 500 }}>A systematic approach to retail transformation.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 48 }}>
              {[
                { step: '01', title: 'Ingest', desc: 'Connect your data sources and legacy systems seamlessly.' },
                { step: '02', title: 'Analyze', desc: 'Our AI identifies patterns and anomalies in real-time.' },
                { step: '03', title: 'Simulate', desc: 'Test strategies in a risk-free virtual environment.' },
                { step: '04', title: 'Execute', desc: 'Deploy optimized workflows with automated precision.' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  style={{ 
                    padding: 40, borderRadius: 32, background: 'white', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ fontSize: 48, fontWeight: 900, color: `${C.orange}20`, marginBottom: 16 }}>{item.step}</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: C.dark, marginBottom: 12 }}>{item.title}</h3>
                  <p style={{ fontSize: 16, color: C.mid, lineHeight: 1.6 }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Capabilities Grid */}
        <section style={{ padding: 'clamp(120px, 15vh, 200px) clamp(24px, 5vw, 80px)', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ marginBottom: 128, textAlign: 'center' }}>
            <h2 style={{ 
              fontSize: 'clamp(50px, 8vw, 100px)', fontWeight: 900, color: C.dark, 
              letterSpacing: -5, lineHeight: 0.9, marginBottom: 32,
              textShadow: '0 10px 30px rgba(0,0,0,0.05)'
            }}>
              CORE <br /><span style={{ opacity: 0.2 }}>CAPABILITIES.</span>
            </h2>
            <p style={{ fontSize: 22, color: C.mid, maxWidth: 650, margin: '0 auto', fontWeight: 500 }}>
              Everything you need to run a modern, data-driven retail operation at scale.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: 48 
          }}>
            <CapabilityItem 
              icon="⚡"
              title="Global Sync"
              desc="Synchronize inventory and sales across multiple regions and currencies in real-time."
              delay={0.1}
            />
            <CapabilityItem 
              icon="🛡️"
              title="Enterprise Security"
              desc="Bank-grade encryption and granular access control for your most sensitive data."
              delay={0.2}
            />
            <CapabilityItem 
              icon="📱"
              title="Mobile First"
              desc="Manage your entire operation from any device with our responsive, native-feeling UI."
              delay={0.3}
            />
            <CapabilityItem 
              icon="🔌"
              title="API Integration"
              desc="Seamlessly connect with your existing ERP, POS, and e-commerce platforms."
              delay={0.4}
            />
            <CapabilityItem 
              icon="📈"
              title="Advanced Reporting"
              desc="Customizable dashboards and automated reports delivered straight to your inbox."
              delay={0.5}
            />
            <CapabilityItem 
              icon="🤝"
              title="Collaboration"
              desc="Shared workspaces and audit logs for teams to work together effectively."
              delay={0.6}
            />
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: 'clamp(120px, 15vh, 200px) clamp(24px, 5vw, 80px)', background: '#fcfcfc' }}>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', maxWidth: 1400, margin: '0 auto' }}>
            <Testimonial 
              quote="Vyapari has completely transformed how we handle our supply chain. The predictive insights are uncanny."
              author="Sarah Chen"
              role="Director of Ops, Global Fashion"
            />
            <Testimonial 
              quote="The most intuitive retail platform I've ever used. It's like having a senior data scientist in your pocket."
              author="Marcus Thorne"
              role="CEO, Thorne Retail Group"
            />
          </div>
        </section>

        {/* Pillar 3: Operations */}
        <InfoSection 
          icon="📄"
          imageSeed="office"
          title="Seamless Ops"
          subtitle="Eliminate manual data entry with intelligent OCR and automated workflows. Focus on strategy while we handle the paperwork."
          content={[
            "99.9% accurate invoice extraction and validation",
            "Automated vendor management and payment tracking",
            "Smart stock alerts and automated reordering",
            "Audit-ready financial logging and compliance"
          ]}
        />

        {/* Bento Grid: Platform Highlights */}
        <section style={{ padding: 'clamp(120px, 15vh, 200px) clamp(24px, 5vw, 80px)', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gridTemplateRows: 'repeat(2, 300px)',
            gap: 32 
          }}>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              style={{ gridColumn: 'span 2', background: C.dark, borderRadius: 32, padding: 64, color: 'white', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>Omnichannel Mastery</h3>
                <p style={{ opacity: 0.6, fontSize: 18 }}>Bridge the gap between physical stores and digital storefronts with unified inventory and customer data.</p>
              </div>
              <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 120, opacity: 0.1 }}>🌐</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              style={{ gridColumn: 'span 1', background: `${C.orange}10`, borderRadius: 32, padding: 40, border: `1px solid ${C.orange}20` }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 8 }}>Edge Computing</h3>
              <p style={{ fontSize: 14, color: C.mid }}>Process data at the source for zero-latency insights.</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              style={{ gridColumn: 'span 1', background: '#f5f5f5', borderRadius: 32, padding: 40 }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 8 }}>Zero Trust</h3>
              <p style={{ fontSize: 14, color: C.mid }}>Security built into every layer of the architecture.</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              style={{ gridColumn: 'span 1', background: '#f5f5f5', borderRadius: 32, padding: 40 }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.dark, marginBottom: 8 }}>Auto-Pilot</h3>
              <p style={{ fontSize: 14, color: C.mid }}>Let AI handle the routine while you focus on growth.</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              style={{ gridColumn: 'span 3', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: 32, padding: 64, color: 'white' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>Global Infrastructure</h3>
                  <p style={{ opacity: 0.8, fontSize: 18 }}>Deploy across 40+ regions with automated compliance and localized data residency.</p>
                </div>
                <div style={{ fontSize: 100 }}>☁️</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section style={{ padding: 'clamp(120px, 15vh, 200px) clamp(24px, 5vw, 80px)', background: C.dark, color: 'white', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(48px, 10vw, 160px)', flexWrap: 'wrap' }}>
            {[
              { label: 'Transactions Processed', val: '4.2B+' },
              { label: 'Retailers Worldwide', val: '1,200+' },
              { label: 'Uptime Guarantee', val: '99.99%' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
              >
                <div style={{ fontSize: 'clamp(60px, 10vw, 120px)', fontWeight: 900, letterSpacing: -8, color: C.orange, marginBottom: 16 }}>{s.val}</div>
                <div style={{ fontSize: 18, fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 4 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: 'clamp(120px, 15vh, 200px) clamp(24px, 5vw, 80px)', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 style={{ fontSize: 'clamp(60px, 10vw, 140px)', fontWeight: 900, color: C.dark, letterSpacing: -8, marginBottom: 80, lineHeight: 0.85 }}>
              READY TO <br /><span style={{ 
                background: `linear-gradient(to right, ${C.orange}, #FF8C5A, ${C.orange})`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                animation: 'gradient 5s linear infinite'
              }}>EVOLVE?</span>
            </h2>
            <motion.button
              whileHover={{ scale: 1.05, background: C.orange, boxShadow: `0 40px 80px ${C.orange}40` }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              style={{
                padding: '40px 120px', borderRadius: 100, background: C.dark,
                color: 'white', border: 'none', fontWeight: 900, fontSize: 24,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 8
              }}
            >
              Start Your Journey
            </motion.button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer style={{ 
          padding: 'clamp(64px, 10vh, 100px) clamp(24px, 5vw, 80px)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          flexWrap: 'wrap',
          gap: 48
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>V</div>
            <span style={{ fontWeight: 900, fontSize: 20, color: C.dark, letterSpacing: -1 }}>VYAPARI</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.light, letterSpacing: 0.5 }}>
            © 2026 VYAPARI TECHNOLOGIES. BUILT FOR THE FUTURE.
          </div>
          <div style={{ display: 'flex', gap: 48 }}>
            {['TWITTER', 'LINKEDIN', 'GITHUB'].map(s => (
              <motion.a key={s} href="#" whileHover={{ color: C.orange }} style={{ fontSize: 13, fontWeight: 900, color: C.dark, textDecoration: 'none', letterSpacing: 2, transition: 'color 0.2s' }}>{s}</motion.a>
            ))}
          </div>
        </footer>
      </div>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="noise-overlay" />
    </div>
  );
}
