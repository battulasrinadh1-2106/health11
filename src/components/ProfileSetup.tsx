/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Gender, ActivityLevel } from '../types';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Scale, 
  Ruler, 
  Calendar, 
  Smile, 
  User, 
  Heart,
  BadgeAlert
} from 'lucide-react';
import HealthMateMascot from './HealthMateMascot';

interface ProfileSetupProps {
  initialProfile?: UserProfile;
  onSubmit: (profile: UserProfile) => void;
  onBack?: () => void;
}

// 7 Conversational Steps:
// 1 = HealthMate Companion Nickname (Optional / After Login)
// 2 = User Name
// 3 = Age
// 4 = Biological Gender Profile
// 5 = Weight
// 6 = Height (Metric CM vs Feet & Inches)
// 7 = Instant BMI Result & Onboarding Complete!

export default function ProfileSetup({ initialProfile, onSubmit, onBack }: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Companion original name or custom nickname
  const [companionName, setCompanionName] = useState<string>(() => {
    return localStorage.getItem('healthmate_mascot_name') || 'HealthMate';
  });
  const [companionNicknameInput, setCompanionNicknameInput] = useState<string>('');

  // Form Field States
  const [fullName, setFullName] = useState<string>(() => {
    return initialProfile?.fullName || localStorage.getItem('healthmate_user_name') || '';
  });
  const [age, setAge] = useState<number>(initialProfile?.age || 25);
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'male');
  const [weight, setWeight] = useState<number>(initialProfile?.weight || 65);
  const [height, setHeight] = useState<number>(initialProfile?.height || 170);
  const [activityLevel] = useState<ActivityLevel>('moderate'); 
  
  const [validationError, setValidationError] = useState<string>('');

  // Height unit & Imperial components
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft-in'>('cm');
  const [feetInput, setFeetInput] = useState<number>(() => {
    const totalInches = (initialProfile?.height || 170) / 2.54;
    return Math.floor(totalInches / 12) || 5;
  });
  const [inchesInput, setInchesInput] = useState<number>(() => {
    const totalInches = (initialProfile?.height || 170) / 2.54;
    return Math.round(totalInches % 12);
  });

  // Convert heights
  const heightInFtInText = useMemo(() => {
    const totalInches = height / 2.54;
    const f = Math.floor(totalInches / 12);
    const i = Math.round(totalInches % 12);
    return `${f} ft ${i} in`;
  }, [height]);

  const heightInCmText = useMemo(() => {
    const calculatedCm = (feetInput * 12 + inchesInput) * 2.54;
    return `${Math.round(calculatedCm)} cm`;
  }, [feetInput, inchesInput]);

  const toggleHeightUnit = (unit: 'cm' | 'ft-in') => {
    if (unit === heightUnit) return;
    setHeightUnit(unit);
    if (unit === 'cm') {
      const calculatedCm = Math.round((feetInput * 12 + inchesInput) * 2.54);
      setHeight(calculatedCm);
    } else {
      const totalInches = height / 2.54;
      setFeetInput(Math.floor(totalInches / 12) || 5);
      setInchesInput(Math.round(totalInches % 12));
    }
  };

  // Sound effects synthesiser
  const playSound = (type: 'next' | 'back' | 'calc' | 'error' | 'bell') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'next') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      } else if (type === 'back') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      } else if (type === 'calc') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      } else if (type === 'bell') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      }
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  // Instant continuous BMI score
  const calculatedBmiScore = useMemo(() => {
    if (!height || !weight) return 0;
    const heightM = height / 100;
    return parseFloat((weight / (heightM * heightM)).toFixed(1));
  }, [height, weight]);

  // Determine BMI category and non-scary, companion-led advice
  const bmiDetails = useMemo(() => {
    const score = calculatedBmiScore;
    if (score < 18.5) {
      return {
        category: 'Underweight',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-400/20',
        emoji: '💙',
        msg: "You are in the underweight range. No worries at all! We'll focus on nourishing calorie-rich recipes and building clean activity limits together. 🌱"
      };
    }
    if (score >= 18.5 && score < 25) {
      return {
        category: 'Healthy Weight',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-400/25',
        emoji: '🟢',
        msg: "Great job! You're in a healthy range. Let's work to maintain your wonderful stamina and steady energy! 🎉"
      };
    }
    if (score >= 25 && score < 30) {
      return {
        category: 'Overweight',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-400/20',
        emoji: '🧡',
        msg: "You are slightly above average. No stress! We will conquer active milestones together with smooth daily walks and tasty balanced meals. ✨"
      };
    }
    return {
      category: 'Obese',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-400/20',
      emoji: '❤️',
      msg: "Your index is slightly high. Remember, simple healthy portions and small active routines yield life-changing benefits. I am right here with you! 💚"
    };
  }, [calculatedBmiScore]);

  // Handle Mascot expressions corresponding to current conversational focus page
  const currentMascotExpression = useMemo(() => {
    if (validationError) return 'concerned';
    
    switch (currentStep) {
      case 1: return 'curious';
      case 2: return 'happy';
      case 3: return 'curious';
      case 4: return 'calm';
      case 5: return 'thoughtful';
      case 6: return 'curious';
      case 7: return calculatedBmiScore >= 18.5 && calculatedBmiScore < 25 ? 'proud' : 'happy';
      default: return 'happy';
    }
  }, [currentStep, validationError, calculatedBmiScore]);

  // Conversational speech bubbles tailored for emotional guidance
  const getSpeechBubbleText = () => {
    if (validationError) {
      return `Ooops! Let me help you with that: ${validationError}`;
    }

    switch (currentStep) {
      case 1:
        return `First thing's first! Would you like to give me a nickname? Or do you prefer keeping ${companionName}? 💚`;
      case 2:
        return `Perfect! Next, what should I call you? Your name will allow me to personalize all comments inside this journal.`;
      case 3:
        return `Splendid to meet you, ${fullName || 'friend'}! 🎂 How old are you? Every single step in life behaves with a different resting metabolism.`;
      case 4:
        return `Understood! What is your biological gender? ⚧ It helps me adapt biological calculations precisely.`;
      case 5:
        return `Excellent! ⚖ Now, let's find out your weight. No stress—only positive calculations to guide your walking achievements.`;
      case 6:
        return `Almost there! 📏 What is your height today? You can easily toggle between standard CM or feet and inches.`;
      case 7:
        if (calculatedBmiScore >= 18.5 && calculatedBmiScore < 25) {
          return `Outstanding index ratio! You walk beautifully and your ratio sits inside a perfect healthy range. Let's enter your dashboard!`;
        } else {
          return `Amazing! Setup is complete. Your ratio is calculated and I'm fully equipped to support you on your daily routine. Let's do this!`;
        }
      default:
        return `Let's work together to find your health companion goals.`;
    }
  };

  // Skip Nickname option
  const skipMascotNickname = () => {
    setCompanionName('HealthMate');
    localStorage.setItem('healthmate_mascot_name', 'HealthMate');
    playSound('next');
    setCurrentStep(2);
  };

  const applyCustomMascotNickname = (presetName?: string) => {
    const finalName = (presetName || companionNicknameInput).trim();
    if (!finalName) {
      setValidationError('Please choose a nickname or skip to keep HealthMate.');
      playSound('error');
      return;
    }
    setCompanionName(finalName);
    localStorage.setItem('healthmate_mascot_name', finalName);
    playSound('bell');
    setCurrentStep(2);
  };

  // Forward validation check
  const handleNextStep = () => {
    setValidationError('');

    if (currentStep === 1) {
      applyCustomMascotNickname();
    } else if (currentStep === 2) {
      if (!fullName.trim()) {
        setValidationError('Please provide your name so I can customize our dashboard chats.');
        playSound('error');
        return;
      }
      if (fullName.trim().length < 2) {
        setValidationError('A valid name must be 2 characters or longer.');
        playSound('error');
        return;
      }
      playSound('next');
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (age < 13 || age > 110) {
        setValidationError('Please specify a realistic age between 13 and 110.');
        playSound('error');
        return;
      }
      playSound('next');
      setCurrentStep(4);
    } else if (currentStep === 4) {
      playSound('next');
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (weight < 25 || weight > 250) {
        setValidationError('Make sure weight sits within 25 kg to 250 kg.');
        playSound('error');
        return;
      }
      playSound('next');
      setCurrentStep(6);
    } else if (currentStep === 6) {
      if (height < 90 || height > 245) {
        setValidationError('Make sure height sits within 90 cm to 245 cm.');
        playSound('error');
        return;
      }
      playSound('calc');
      setCurrentStep(7);
    }
  };

  const handlePrevStep = () => {
    setValidationError('');
    if (currentStep > 1) {
      playSound('back');
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      playSound('back');
      onBack();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || age < 13 || age > 110 || height < 90 || height > 245 || weight < 25 || weight > 250) {
      setValidationError('Please review inputs to make sure all parameters are specified properly.');
      setCurrentStep(2);
      return;
    }

    localStorage.setItem('healthmate_user_name', fullName.trim());

    onSubmit({
      fullName: fullName.trim(),
      age,
      gender,
      height: Math.round(height),
      weight: Math.round(weight),
      activityLevel,
      bmiScore: calculatedBmiScore,
      bmiCategory: bmiDetails.category
    });
  };

  return (
    <div className="relative min-h-screen bg-[#03070C] text-slate-100 flex flex-col justify-start md:justify-center items-center px-4 md:px-8 py-8 overflow-y-auto selection:bg-emerald-500/35 selection:text-emerald-300">
      
      {/* Immersive ambient glows */}
      <div className="absolute top-[8%] left-[-25%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-25%] w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-[130px] pointer-events-none" />

      {/* Primary Mobile-first Scaffold */}
      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        
        {/* Dialogue Bubble & Cute Mascot Wrapper */}
        <div className="w-full flex flex-col items-center mb-6">
          <motion.div
            animate={currentStep === 7 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="mb-3 relative"
          >
            <HealthMateMascot 
              size="lg" 
              expression={currentMascotExpression} 
              className="drop-shadow-[0_15px_35px_rgba(16,185,129,0.22)]" 
            />
            
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 p-1.5 rounded-full text-xs shadow-lg animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Dialogue speech board */}
          <div className="relative bg-[#090F16] border border-slate-900 rounded-2xl p-5 w-full shadow-2xl backdrop-blur-xl">
            <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-[#090F16] border-t border-l border-slate-900 rotate-45" />
            
            <p className="text-xs md:text-sm font-semibold text-slate-100 leading-relaxed text-center">
              {getSpeechBubbleText()}
            </p>
          </div>
        </div>

        {/* Setup Pager Dots indicator */}
        <div className="flex gap-2 mb-6 items-center justify-center">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isDone = num < currentStep;
            const isCurrent = num === currentStep;
            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (num < currentStep) {
                    setCurrentStep(num);
                    setValidationError('');
                  }
                }}
                disabled={num >= currentStep}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isCurrent 
                    ? 'w-8 bg-emerald-400 shadow-md shadow-emerald-400/25' 
                    : isDone 
                      ? 'w-5 bg-teal-600/60' 
                      : 'w-3 bg-slate-900/60'
                }`}
                title={`Step ${num}`}
                id={`setup-dot-num-${num}`}
              />
            );
          })}
        </div>

        {/* Playful Conversational Box */}
        <div className="w-full bg-[#090F16]/95 border border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* STEP 1: Mascot Companion NickName */}
              {currentStep === 1 && (
                <motion.div
                  key="form-mascot-nickname"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-center"
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#10b981] uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">Bonding Step</span>
                    <h2 className="text-base font-black mt-2 text-slate-100">Name Your Companion</h2>
                  </div>

                  <div className="space-y-3 pt-2">
                    <input
                      id="companion-nickname-input"
                      type="text"
                      maxLength={15}
                      placeholder="e.g. Buddy, Leafy, Milo, Sunny..."
                      value={companionNicknameInput}
                      onChange={(e) => setCompanionNicknameInput(e.target.value)}
                      className="w-full bg-[#050B14] border border-slate-900 focus:border-emerald-500 py-3 rounded-xl text-center text-sm font-extrabold text-slate-100 focus:outline-none transition-colors"
                    />

                    {/* Presets suggestions */}
                    <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                      {['Milo', 'Leafy', 'Buddy', 'Sunny'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setCompanionNicknameInput(p);
                            applyCustomMascotNickname(p);
                          }}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-[#050B14] border-slate-900 text-slate-400 hover:text-[#10b981] hover:border-emerald-500/30 transition-all cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <p className="text-[10px] font-medium text-slate-500 italic block leading-normal">
                      Or skip this to leave my name as <span className="text-emerald-400 font-bold">HealthMate</span>.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Name */}
              {currentStep === 2 && (
                <motion.div
                  key="form-name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-center"
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#10b981] uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">Personal Profile</span>
                    <h2 className="text-base font-black mt-2 text-slate-100">What is your name?</h2>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="form-fullname-input"
                        type="text"
                        autoFocus
                        required
                        placeholder="Type your name here..."
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#050B14] border border-slate-900 focus:border-emerald-500 py-3 pl-11 pr-4 rounded-xl text-center text-sm font-extrabold text-slate-100 placeholder-slate-700 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Age */}
              {currentStep === 3 && (
                <motion.div
                  key="form-age"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-center"
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#10b981] uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">Age Metric</span>
                    <h2 className="text-base font-black mt-2 text-slate-100">How old are you?</h2>
                  </div>

                  <div className="flex items-center justify-center gap-4 py-3 bg-[#050B14] rounded-2xl border border-slate-900/60">
                    <button
                      type="button"
                      onClick={() => {
                        setAge(prev => Math.max(13, prev - 1));
                        playSound('back');
                      }}
                      className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-355 hover:text-emerald-400 font-bold"
                    >
                      -
                    </button>
                    
                    <div className="flex flex-col items-center w-20">
                      <input
                        id="form-age-number"
                        type="number"
                        min="13"
                        max="110"
                        value={age || ''}
                        onChange={(e) => setAge(Math.min(110, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="bg-transparent text-center text-3xl font-black font-mono text-[#10b981] w-full focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-black mt-0.5">Years</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAge(prev => Math.min(110, prev + 1));
                        playSound('next');
                      }}
                      className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-355 hover:text-emerald-400 font-bold"
                    >
                      +
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Gender */}
              {currentStep === 4 && (
                <motion.div
                  key="form-gender"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-center"
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#10b981] uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">Algorithm Tuning</span>
                    <h2 className="text-base font-black mt-2 text-slate-100">Biological Gender</h2>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['male', 'female', 'other'] as Gender[]).map((g) => {
                      const active = gender === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setGender(g);
                            playSound('next');
                          }}
                          className={`py-3 rounded-xl border text-center font-black text-xs uppercase tracking-wider transition-all cursor-pointer capitalize ${
                            active
                              ? 'bg-emerald-500/10 border-emerald-400 text-[#10b981] shadow-md shadow-emerald-500/5'
                              : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-200'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Weight */}
              {currentStep === 5 && (
                <motion.div
                  key="form-weight"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-center"
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#10b981] uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">Weight Metric</span>
                    <h2 className="text-base font-black mt-2 text-slate-100">How much do you weigh?</h2>
                  </div>

                  <div className="bg-[#050B14] p-5 rounded-2xl border border-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900/10 scale-[1.5] pointer-events-none">
                      <Scale className="w-16 h-16" />
                    </div>

                    <div className="flex items-baseline justify-center gap-1.5 relative z-10">
                      <input
                        id="form-weight-input"
                        type="number"
                        min="25"
                        max="250"
                        step="any"
                        value={weight || ''}
                        onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                        className="bg-transparent text-center font-mono text-4xl font-black text-emerald-400 w-32 focus:outline-none"
                      />
                      <span className="text-sm font-bold text-slate-500 font-mono">KG</span>
                    </div>

                    <div className="text-[10px] text-slate-550 font-mono mt-3 px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg z-10 font-bold">
                      Imperial Equivalent: <span className="text-emerald-300">{Math.round(weight * 2.20462)} lbs</span>
                    </div>
                  </div>

                  {/* Incremental chips helper */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[-5, -1, 1, 5].map((val) => {
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setWeight(prev => Math.min(250, Math.max(25, parseFloat((prev + val).toFixed(1)))));
                            playSound('next');
                          }}
                          className="py-2 bg-slate-950 border border-slate-900/90 text-[10px] font-mono font-bold text-slate-400 hover:text-slate-100 transition-all"
                        >
                          {val > 0 ? `+${val}` : val}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 6: Height */}
              {currentStep === 6 && (
                <motion.div
                  key="form-height"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-center"
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#10b981] uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">Stature Metric</span>
                    <h2 className="text-base font-black mt-2 text-slate-100">How tall are you?</h2>
                  </div>

                  {/* Metric Toggle */}
                  <div className="flex justify-center">
                    <div className="bg-slate-950 p-1 rounded-xl border border-slate-900 inline-flex">
                      <button
                        type="button"
                        onClick={() => toggleHeightUnit('cm')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          heightUnit === 'cm'
                            ? 'bg-emerald-505 bg-[#10b981] text-slate-950 font-black'
                            : 'text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleHeightUnit('ft-in')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          heightUnit === 'ft-in'
                            ? 'bg-[#10b981] text-slate-950 font-black'
                            : 'text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        ft + in
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#050B14] p-4 rounded-2xl border border-slate-900 min-h-[120px] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900/10 scale-[1.5] pointer-events-none">
                      <Ruler className="w-16 h-16" />
                    </div>

                    {heightUnit === 'cm' ? (
                      <div className="flex flex-col items-center relative z-10">
                        <div className="flex items-baseline gap-1 bg-transparent">
                          <input
                            id="form-height-cm"
                            type="number"
                            min="90"
                            max="245"
                            value={height || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setHeight(val);
                              const totalInches = val / 2.54;
                              setFeetInput(Math.floor(totalInches / 12) || 5);
                              setInchesInput(Math.round(totalInches % 12));
                            }}
                            className="bg-transparent text-center font-mono text-4xl font-black text-emerald-400 w-28 focus:outline-none"
                          />
                          <span className="text-base font-bold text-slate-500 font-mono">CM</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono mt-1 px-2 py-0.5 bg-slate-950/60 rounded">
                          Imperial: <span className="font-bold text-slate-400">{heightInFtInText}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <input
                              id="form-height-ft"
                              type="number"
                              min="3"
                              max="8"
                              value={feetInput}
                              onChange={(e) => {
                                const f = parseInt(e.target.value) || 3;
                                setFeetInput(f);
                                const calculatedCm = (f * 12 + inchesInput) * 2.54;
                                setHeight(Math.round(calculatedCm));
                              }}
                              className="bg-transparent text-right font-mono text-3xl font-black text-emerald-400 w-10 focus:outline-none"
                            />
                            <span className="text-[8px] font-bold text-slate-501 text-slate-500 uppercase font-mono mt-0.5">Ft</span>
                          </div>
                          
                          <span className="text-2xl text-slate-700 font-mono">:</span>

                          <div className="flex flex-col items-center">
                            <input
                              id="form-height-in"
                              type="number"
                              min="0"
                              max="11"
                              value={inchesInput}
                              onChange={(e) => {
                                const inc = parseInt(e.target.value) || 0;
                                setInchesInput(inc);
                                const calculatedCm = (feetInput * 12 + inc) * 2.54;
                                setHeight(Math.round(calculatedCm));
                              }}
                              className="bg-transparent text-left font-mono text-3xl font-black text-emerald-400 w-10 focus:outline-none"
                            />
                            <span className="text-[8px] font-bold text-slate-500 uppercase font-mono mt-0.5">In</span>
                          </div>
                        </div>

                        <p className="text-[9px] text-slate-500 font-mono mt-1.5 px-2 py-0.5 bg-slate-950/60 rounded">
                          Metric: <span className="font-bold text-slate-400">{heightInCmText}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 7: BMI Results Card */}
              {currentStep === 7 && (
                <motion.div
                  key="form-bmi-summary animate-stage-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#10b981] uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">Interactive BMI Results</span>
                    <h2 className="text-base font-black mt-2 text-slate-100">Companion Insights</h2>
                  </div>

                  {/* Stunning BMI Result Card */}
                  <div className={`p-4 rounded-2xl border text-slate-105 space-y-3 shadow-lg relative overflow-hidden backdrop-blur-xl ${bmiDetails.bg} ${bmiDetails.border}`}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/5 blur-[45px] pointer-events-none" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{bmiDetails.emoji}</span>
                        <div className="text-left">
                          <span className="text-[8px] font-bold uppercase font-mono text-slate-450 block tracking-wider leading-none">Healthy Metric</span>
                          <span className="text-xs font-bold text-slate-200">Body Mass Profile</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[8px] font-mono text-slate-501 text-slate-500 block leading-none">BMI VALUE</span>
                        <span className={`text-2xl font-black font-mono leading-none ${bmiDetails.color}`}>{calculatedBmiScore}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-500/10">
                      <div className="h-1.5 w-full bg-slate-950/70 rounded-full overflow-hidden flex relative border border-slate-900">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" 
                          style={{ width: `${Math.min(100, Math.max(10, (calculatedBmiScore / 40) * 100))}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10.5px] font-bold">
                        <span className="text-slate-400">Biological Classification:</span>
                        <span className={`font-mono text-xs ${bmiDetails.color}`}>
                          {bmiDetails.category}
                        </span>
                      </div>
                    </div>

                    {/* Compact Specs Row */}
                    <div className="grid grid-cols-3 gap-1 pt-2 text-center text-[10px] border-t border-slate-500/10 bg-slate-950/40 p-1.5 rounded-xl">
                      <div>
                        <span className="text-[7.5px] text-slate-500 font-mono uppercase tracking-wider block">Age</span>
                        <span className="font-bold text-slate-200">{age}</span>
                      </div>
                      <div className="border-x border-slate-900">
                        <span className="text-[7.5px] text-slate-500 font-mono uppercase tracking-wider block">Height</span>
                        <span className="font-bold text-slate-200">{height} cm</span>
                      </div>
                      <div>
                        <span className="text-[7.5px] text-slate-500 font-mono uppercase tracking-wider block">Weight</span>
                        <span className="font-bold text-slate-200">{weight} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Character Reaction Bubble */}
                  <div className="bg-[#050B14] p-3 border border-slate-900 rounded-xl flex items-start gap-2.5">
                    <div className="shrink-0 pt-0.5">
                      <Heart className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[8px] font-mono tracking-widest uppercase text-emerald-400 font-black block">{companionName}'s Reaction</span>
                      <p className="text-[11.5px] text-slate-350 leading-relaxed font-bold">
                        "{bmiDetails.msg}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Setup Wizard controls */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="py-2.5 px-3.5 border border-slate-900 rounded-xl bg-slate-950/50 text-slate-500 hover:text-white font-mono text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={skipMascotNickname}
                    className="flex-1 py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-300 hover:text-[#10b981] font-mono font-bold rounded-xl transition-all text-[9.5px] uppercase tracking-wider active:scale-95 text-center flex items-center justify-center gap-1"
                  >
                    <span>Keep "HealthMate"</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                ) : currentStep < 7 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-sans font-black rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider active:scale-95 border-none"
                    id="conversational-setup-next-btn"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-950 stroke-[3.5]" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-sans font-black rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider active:scale-[0.98] border-none animate-pulse hover:animate-none"
                    id="conversational-setup-submit-btn"
                  >
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950 stroke-[3.5]" />
                  </button>
                )}
              </div>

            </form>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
