import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Smile, 
  Check, 
  UserPlus, 
  LogIn 
} from 'lucide-react';
import HealthMateMascot from './HealthMateMascot';

interface SplashProps {
  onGetStarted: (mode: 'login' | 'register') => void;
}

// Internal states of the Splash setup wizard
type SplashWizardStep = 'walk-in' | 'introduction';

export default function Splash({ onGetStarted }: SplashProps) {
  const [wizardStep, setWizardStep] = useState<SplashWizardStep>('walk-in');
  
  // Custom Mascot Name Support - default to HealthMate on Welcome view
  const companionName = 'HealthMate';

  // Sound effects synthesiser
  const playSoundChime = (frequency: number, duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Step 1: Mascot walk-in patrol state
  const [patrolX, setPatrolX] = useState<number>(-40);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isWaving, setIsWaving] = useState<boolean>(false);
  const [mascotExpression, setMascotExpression] = useState<'walking' | 'happy' | 'excited' | 'calm' | 'thoughtful'>('walking');

  // Trigger smooth patrol movement of HealthMate on start
  useEffect(() => {
    if (wizardStep === 'walk-in') {
      playSoundChime(520, 0.45);
      
      // Step A: Walk from the left to near middle
      const walkToMiddle = setTimeout(() => {
        setPatrolX(5);
        setMascotExpression('walking');
      }, 100);

      // Step B: Turn around and walk slightly right
      const walkToRight = setTimeout(() => {
        setFacing('right');
        setPatrolX(40);
        setMascotExpression('walking');
      }, 900);

      // Step C: Move to the center, stop, wave and smile
      const arriveAtCenter = setTimeout(() => {
        setFacing('right');
        setPatrolX(0); // perfect center
        setMascotExpression('excited');
        setIsWaving(true);
        playSoundChime(880, 0.6);
      }, 2000);

      // Step D: Transition to introduction content automatically
      const autoProceed = setTimeout(() => {
        setWizardStep('introduction');
        setIsWaving(false);
        setMascotExpression('happy');
      }, 3400);

      return () => {
        clearTimeout(walkToMiddle);
        clearTimeout(walkToRight);
        clearTimeout(arriveAtCenter);
        clearTimeout(autoProceed);
      };
    }
  }, [wizardStep]);

  // Periodic wave and blink timers to keep HealthMate feeling alive
  useEffect(() => {
    if (wizardStep !== 'walk-in') {
      const interval = setInterval(() => {
        setMascotExpression('excited');
        playSoundChime(760, 0.3);
        setTimeout(() => {
          setMascotExpression('happy');
        }, 1200);
      }, 9000);

      return () => clearInterval(interval);
    }
  }, [wizardStep]);

  return (
    <div className="min-h-screen bg-[#03070C] text-slate-100 p-4 md:p-8 relative select-none overflow-x-hidden font-sans flex flex-col justify-between">
      
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1520_1.5px,transparent_1.5px),linear-gradient(to_bottom,#0e1520_1.5px,transparent_1.5px)] bg-[size:3.5rem_3.5rem] opacity-20 pointer-events-none" />
      
      {/* Intangible glowing gradient spot lights */}
      <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-500/15 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[160px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-15%] w-[500px] h-[500px] rounded-full bg-emerald-600/5 blur-[140px] pointer-events-none" />

      {/* Magical floating particle drops */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {[...Array(12)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full bg-[#10b981]/15"
            style={{
              width: Math.random() * 8 + 3,
              height: Math.random() * 8 + 3,
              top: `${Math.random() * 90 + 5}%`,
              left: `${Math.random() * 90 + 5}%`,
            }}
            animate={{
              y: [0, -45, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: Math.random() * 8 + 9,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main responsive container */}
      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6">
        
        {/* Play Store Premium Minimal App Bar */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/50 px-4 py-1.5 rounded-full mb-3 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[9.5px] font-mono font-bold text-emerald-300 uppercase tracking-widest leading-none">
              My Personal Companion
            </span>
          </motion.div>
          <h1 className="text-3xl font-sans font-black tracking-tighter text-white">
            HEALTHMATE <span className="text-emerald-400 font-normal">🌱</span>
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-widest">
            Interactive Companion Edition
          </p>
        </div>

        {/* Dynamic Interactive Stage Card */}
        <div className="bg-gradient-to-b from-[#090F16] via-[#050A10] to-[#020509] border border-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl relative min-h-[500px] flex flex-col justify-between">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-emerald-950/15 to-transparent pointer-events-none" />

          {/* Stage Top Header Indicators */}
          <div className="flex justify-between items-center pb-3.5 border-b border-slate-900/60 text-[10px] font-mono text-slate-500/80 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {wizardStep === 'walk-in' ? 'Walk Entrance' : wizardStep === 'introduction' ? 'Meet HealthMate' : wizardStep === 'nickname' ? 'Companion Custom' : 'Ready' }
            </span>
            <span>ENG_v2.5</span>
          </div>

          {/* Character Stage representation */}
          <div className="relative h-56 w-full bg-slate-950/40 border border-slate-900/40 rounded-2xl flex flex-col items-center justify-end pb-4 overflow-visible shadow-inner my-3">
            <div className="absolute inset-x-0 bottom-0 h-2 bg-emerald-950/15 border-t border-emerald-900/5 rounded-b-2xl" />
            
            {/* Animating Mascot character with patrol slider behavior */}
            <motion.div
              className="absolute bottom-2 origin-bottom"
              style={{ x: `${patrolX}%` }}
              animate={wizardStep === 'walk-in' ? {} : { x: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 15 }}
            >
              <div 
                style={{ transform: facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }} 
                className="transition-transform duration-300"
              >
                <HealthMateMascot 
                  size="xl" 
                  expression={mascotExpression} 
                  animate={true} 
                  className="drop-shadow-[0_12px_24px_rgba(16,185,129,0.25)]"
                />
              </div>
            </motion.div>

            {/* Radiant light spot beneath mascot keys */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-16 bg-emerald-500/8 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Content Progression with Framer AnimatePresence */}
          <div className="flex-1 flex flex-col justify-center relative mt-3 mb-4 min-h-[220px]">
            <AnimatePresence mode="wait">
              
              {/* STAGE 1: Walk In Text / Greeting */}
              {wizardStep === 'walk-in' && (
                <motion.div
                  key="walk-in-box"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-2 py-4"
                >
                  <p className="text-emerald-400 font-mono text-xs uppercase tracking-widest font-black animate-pulse">
                    HealthMate arriving...
                  </p>
                  <p className="text-sm font-semibold text-slate-300">
                    HealthMate is stepping onto the scene!
                  </p>
                </motion.div>
              )}

              {/* STAGE 2: Core Introduction Presentation */}
              {wizardStep === 'introduction' && (
                <motion.div
                  key="intro-box"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 py-2"
                >
                  {/* Clean speech bubble */}
                  <div className="bg-[#0b131f]/95 border border-emerald-500/20 p-5 rounded-3xl shadow-lg relative leading-relaxed">
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0b131f] border-r border-b border-emerald-500/20 rotate-45" />
                    
                    <h3 className="text-emerald-400 font-bold text-sm mb-1.5 text-center">Hi 👋</h3>
                    <p className="text-center text-sm text-slate-100 font-bold mb-4 leading-snug">
                      I'm <span className="text-emerald-300 font-mono">HealthMate</span> 💚 <br />
                      Your personal health companion.
                    </p>
                    <p className="text-center text-xs text-slate-300 font-medium mb-3">
                      I'll help you walk more, eat smarter and stay healthy every day.
                    </p>
                    
                    <p className="text-slate-400 text-[10px] font-mono mb-3 uppercase tracking-wider text-center">
                      Feature Highlights:
                    </p>
                    
                    <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-200 border-t border-slate-900/60 pt-3">
                      <li className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                        <span className="shrink-0 text-base">🏃</span>
                        <span>Walking Tracker</span>
                      </li>
                      <li className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                        <span className="shrink-0 text-base">🍎</span>
                        <span>Food Search</span>
                      </li>
                      <li className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                        <span className="shrink-0 text-base">📊</span>
                        <span>BMI Analysis</span>
                      </li>
                      <li className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                        <span className="shrink-0 text-base">💡</span>
                        <span>Smart Recommendations</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    {/* Big glowing Let's Begin Button */}
                    <button
                      onClick={() => {
                        playSoundChime(950, 0.4);
                        onGetStarted('register');
                      }}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-sans text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      id="lets-begin-main-btn"
                    >
                      <span>✨ LET'S BEGIN</span>
                      <ArrowRight className="w-4 h-4 text-slate-950 stroke-[3]" />
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Symmetrical responsive footer and specifications bar */}
      <div className="text-center font-mono text-[9px] text-slate-600 uppercase tracking-widest pb-1 self-center w-full">
        {companionName} Companion • Premium Ambiance • Interactive Android Framework
      </div>

    </div>
  );
}
