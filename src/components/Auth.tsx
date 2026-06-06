import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import HealthMateMascot from './HealthMateMascot';

interface AuthProps {
  onSuccess: (user: any) => void;
  onBack: () => void;
  initialIsSignup?: boolean;
}

export default function Auth({ onSuccess, onBack, initialIsSignup = false }: AuthProps) {
  const [isSignup, setIsSignup] = useState<boolean>(initialIsSignup);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    setIsSignup(initialIsSignup);
  }, [initialIsSignup]);

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger sound effect on toggle
  const playToggleSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {}
  };

  const handleToggle = () => {
    playToggleSound();
    setIsSignup(!isSignup);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSignup && !name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Email/Phone and password are required.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isSignup ? '/api/signup' : '/api/login';
      const bodyPayload = isSignup 
        ? { name, email, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Authentication failed. Check your credentials.");
      }

      onSuccess(resJson.data);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred. Check backend context.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03070C] text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans select-none">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[90px] pointer-events-none" />

      {/* Symmetrical Screen Card (Looks identically proportioned to the prompt design specs) */}
      <motion.div 
        key={isSignup ? 'register-screen' : 'login-screen'}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm bg-[#090F16]/95 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-5 shadow-2.5xl relative"
      >
        {/* Absolute Back Button */}
        <button 
          onClick={onBack}
          type="button"
          className="absolute top-5 left-5 text-[9px] text-slate-500 hover:text-white flex items-center gap-1 bg-transparent border-none cursor-pointer font-mono uppercase tracking-wider font-bold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {/* Absolute Ribbon */}
        <div className="absolute top-5 right-5 text-[9px] font-mono select-none px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider">
          Secure Form
        </div>

        {/* Mascot Center Area */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-900/60 w-full text-left">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full bg-emerald-500/10 blur-md animate-pulse" />
              <HealthMateMascot size="sm" expression={isSignup ? 'excited' : 'happy'} />
            </div>
            
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#10b981] uppercase">
                {localStorage.getItem('healthmate_mascot_name') || 'HealthMate'} Companion
              </span>
              <p className="text-[11.5px] text-slate-350 leading-snug">
                {isSignup 
                  ? "Let's register your secure profile so we can track physical metrics! 💚" 
                  : "Welcome back! Enter your login information to open your dashboard. 💚"
                }
              </p>
            </div>
          </div>

          <h2 className="font-sans font-black text-lg text-white tracking-tight pt-1">
            {isSignup ? "Create Account" : "Sign In"}
          </h2>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="flex gap-2 items-start p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Interactive Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {isSignup && (
            <div className="space-y-1">
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name" 
                className="w-full bg-[#050B14] border border-slate-900 focus:border-[#34D399]/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="space-y-1">
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or Phone" 
              className="w-full bg-[#050B14] border border-slate-900 focus:border-[#34D399]/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1 relative">
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full bg-[#050B14] border border-slate-900 focus:border-[#34D399]/40 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 bg-transparent border-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isSignup && (
            <div className="space-y-1">
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password" 
                className="w-full bg-[#050B14] border border-slate-900 focus:border-[#34D399]/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Forgot Password for login only */}
          {!isSignup && (
            <div className="text-right">
              <button 
                type="button" 
                onClick={() => setErrorMsg("Forgot password flow is handled via standard sandbox recovery.")}
                className="text-[10px] text-slate-500 hover:text-emerald-400 font-sans tracking-wide transition-colors bg-transparent border-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Action Trigger in Vivid green */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-slate-950 rounded-xl text-xs font-sans font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 cursor-pointer border-none"
          >
            {isLoading ? "Synchronizing..." : isSignup ? "Register" : "Login"}
          </button>
        </form>

        {/* Core Auth switch link */}
        <div className="text-center pt-2 border-t border-slate-900/60">
          <p className="text-[11px] text-slate-450">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button 
              type="button"
              onClick={handleToggle}
              className="text-[#10b981] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer ml-0.5"
            >
              {isSignup ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
