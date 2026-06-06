/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile, BMIClassification } from '../types';
import { 
  calculateBMI, 
  classifyBMI, 
  getMotivationalMessage, 
  getPersonalizedMealSuggestions 
} from '../data/foods';
import { 
  Apple, 
  RefreshCw, 
  Footprints,
  Home,
  User,
  Sparkles
} from 'lucide-react';
import FoodSearch from './FoodSearch';
import HomeTab from './HomeTab';
import StepsTab from './StepsTab';
import ProfileTab from './ProfileTab';

export function getFoodEquivalent(cal: number) {
  if (cal <= 0) {
    return {
      name: "Fresh Red Apple Slices",
      equivalentText: "0 slices",
      calories: 10,
      image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80",
      motivation: "Take your first walking steps to start offsetting a crisp fresh apple!"
    };
  }

  if (cal < 85) {
    const count = Math.max(1, Math.round(cal / 10));
    return {
      name: "Crisp Fresh Apple Slices",
      equivalentText: `${count} crisp slices`,
      calories: 10,
      image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80",
      motivation: "You've worked off a light refreshing apple snack! Outstanding pacing."
    };
  }

  if (cal < 180) {
    const count = (cal / 85).toFixed(1);
    return {
      name: "Plain Baked Chapati / Roti",
      equivalentText: `${count} home-baked rotis`,
      calories: 85,
      image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=80",
      motivation: "You've neutralized the core carbohydrate staple of a home-cooked healthy dinner!"
    };
  }

  if (cal < 250) {
    const count = (cal / 105).toFixed(1);
    return {
      name: "Fresh Yellow Banana",
      equivalentText: `${count} ripe bananas`,
      calories: 105,
      image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80",
      motivation: "Potassium power! You've completely burned off the energy store of an entire banana."
    };
  }

  if (cal < 300) {
    const count = (cal / 260).toFixed(1);
    return {
      name: "Fried Potato Samosa",
      equivalentText: `${count} crispy samosas`,
      calories: 260,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80",
      motivation: "Elite progress! You have completely countered the heavy fats of a fried samosa street snack."
    };
  }

  if (cal < 450) {
    const count = (cal / 300).toFixed(1);
    return {
      name: "South Indian Masala Dosa",
      equivalentText: `${count} crispy stuffed dosas`,
      calories: 300,
      image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80",
      motivation: "Sensational! A complete hot restaurant-style masala dosa offset by purely your steps."
    };
  }

  const count = (cal / 490).toFixed(1);
  return {
    name: "Basmati Chicken Biryani",
    equivalentText: `${count} regular plates`,
    calories: 490,
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80",
    motivation: "Unbelievable endurance! You've neutralized a full royal plate of chicken biryani!"
  };
}

interface MainPageProps {
  profile: UserProfile;
  authUser: any;
  onEditProfile: () => void;
  onReset: () => void;
}

type TabType = 'home' | 'food' | 'steps' | 'profile';

export default function MainPage({ profile, authUser, onEditProfile, onReset }: MainPageProps) {
  const [profileState, setProfileState] = useState<UserProfile>(profile);

  useEffect(() => {
    setProfileState(profile);
  }, [profile]);

  const [activeTab, setActiveTab ] = useState<TabType>('home');
  const [microTipIndex, setMicroTipIndex] = useState<number>(0);

  // BMI History database states integrated with MongoDB Express Backend
  const [bmiHistory, setBmiHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [newLogWeight, setNewLogWeight] = useState<string>('');
  const [newLogHeight, setNewLogHeight] = useState<string>(profile.height.toString());
  const [logSubmitStatus, setLogSubmitStatus] = useState<string>('');
  const [dbMode, setDbMode] = useState<string>('fallback-memory');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Step tracker states
  const [steps, setSteps] = useState<number>(() => {
    try {
      const userId = authUser?._id || 'guest';
      return Number(localStorage.getItem(`healthmate_today_steps_${userId}`) || '0');
    } catch {
      return 0;
    }
  });
  const [caloriesBurned, setCaloriesBurned] = useState<number>(() => {
    try {
      const userId = authUser?._id || 'guest';
      return Number(localStorage.getItem(`healthmate_today_calories_${userId}`) || '0');
    } catch {
      return 0;
    }
  });
  const [stepGoal, setStepGoal] = useState<number>(10000);
  const [stepHistory, setStepHistory] = useState<any[]>([]);
  const [stepHistoryLoading, setStepHistoryLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [sensorActive, setSensorActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('healthmate_sensor_enabled') === 'true' && 
             localStorage.getItem('healthmate_real_tracking_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // Get local date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }, []);

  // Compute BMI and categorization early
  const bmiScore = useMemo(() => {
    return calculateBMI(profileState.height, profileState.weight);
  }, [profileState.height, profileState.weight]);

  const bmiClassification = useMemo(() => {
    return classifyBMI(bmiScore);
  }, [bmiScore]);

  // Compute Meal Recommendations early
  const mealSuggestions = useMemo(() => {
    return getPersonalizedMealSuggestions(bmiClassification, profileState.age, profileState.activityLevel, profileState.gender);
  }, [bmiClassification, profileState.age, profileState.activityLevel, profileState.gender]);

  // Derived historic aggregates for Weekly and Monthly simple indicators
  const statsAverages = useMemo(() => {
    const totalDays = Math.max(1, stepHistory.length);
    const sumSteps = stepHistory.reduce((acc, current) => acc + (current.steps || current.stepsCount || 0), 0);
    const avgSteps = Math.round(sumSteps / totalDays);
    const totalKm = parseFloat(((sumSteps * 0.76) / 1000).toFixed(2));
    const totalCal = stepHistory.reduce((acc, current) => acc + (current.caloriesBurned || 0), 0);

    // Mon is 0, Sun is 6
    const now = new Date();
    const curDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    
    // Fallback historical values
    const fallbackDays = [
      { day: 'Mon', steps: 8400, goal: 10000 },
      { day: 'Tue', steps: 11200, goal: 10000 },
      { day: 'Wed', steps: 9500, goal: 10000 },
      { day: 'Thu', steps: 6100, goal: 10000 },
      { day: 'Fri', steps: 10400, goal: 10000 },
      { day: 'Sat', steps: 12100, goal: 10000 },
      { day: 'Sun', steps: 0, goal: 10000 }
    ];

    // Overlay current day's real steps
    if (fallbackDays[curDayIndex]) {
      fallbackDays[curDayIndex].steps = steps;
    }

    const weeklySum = sumSteps > 0 ? sumSteps : fallbackDays.reduce((acc, d) => acc + d.steps, 0);
    const weeklyAvg = Math.round(weeklySum / 7);

    return {
      weeklySum,
      weeklyAvg,
      avgSteps: sumSteps > 0 ? avgSteps : 9670,
      totalKm: totalKm > 0 ? totalKm : 41.5,
      totalCal: totalCal > 0 ? totalCal : 1580,
      weeklyDays: fallbackDays
    };
  }, [stepHistory, steps]);

  const fetchBmiHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch("/api/bmi-history", {
        headers: {
          "x-user-id": authUser?._id || "",
        },
      });
      const json = await res.json();
      if (json.success) {
        setBmiHistory(json.data);
        if (json.databaseMode) {
          setDbMode(json.databaseMode);
        }
        if (json.connectionError) {
          setConnectionError(json.connectionError);
        } else {
          setConnectionError(null);
        }
      }
    } catch (err) {
      console.warn("Could not retrieve weight & BMI history from Express backend:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStepHistory = async () => {
    try {
      setStepHistoryLoading(true);
      const res = await fetch("/api/step-history", {
        headers: {
          "x-user-id": authUser?._id || "",
        },
      });
      const json = await res.json();
      if (json.success) {
        setStepHistory(json.data);
        const todayRecord = json.data.find((r: any) => r.date === todayStr);
        const serverSteps = todayRecord ? todayRecord.steps : 0;
        const serverCalories = todayRecord ? (todayRecord.caloriesBurned || todayRecord.calories || 0) : 0;

        // Retrieve local steps to check if offline walk occurred
        let localSteps = 0;
        let localCalories = 0;
        const userId = authUser?._id || 'guest';
        try {
          const storedDate = localStorage.getItem(`healthmate_today_date_${userId}`);
          if (storedDate === todayStr) {
            localSteps = parseInt(localStorage.getItem(`healthmate_today_steps_${userId}`) || '0');
            localCalories = parseFloat(localStorage.getItem(`healthmate_today_calories_${userId}`) || '0');
          }
        } catch {}

        const finalSteps = Math.max(serverSteps, localSteps);
        const finalCalories = finalSteps === localSteps && localSteps > serverSteps ? localCalories : serverCalories;

        setSteps(finalSteps);
        setCaloriesBurned(finalCalories);

        // If local had more steps, trigger background save immediately to keep DB fresh
        if (localSteps > serverSteps) {
          saveStepsToDB(localSteps, finalCalories);
        }
      }
    } catch (err) {
      console.warn("Could not retrieve step history from Express backend:", err);
    } finally {
      setStepHistoryLoading(false);
    }
  };

  const saveStepsToDB = async (currentSteps: number, currentCal: number) => {
    try {
      setSyncStatus("Syncing...");
      const res = await fetch("/api/save-steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": authUser?._id || "",
        },
        body: JSON.stringify({
          date: todayStr,
          steps: currentSteps,
          caloriesBurned: currentCal,
          calories: currentCal
        })
      });
      const json = await res.json();
      if (json.success) {
        setSyncStatus("Synced");
        setStepHistory(prev => {
          const updated = [...prev];
          const existIdx = updated.findIndex(r => r.date === todayStr);
          if (existIdx !== -1) {
            updated[existIdx] = { 
              ...updated[existIdx], 
              steps: currentSteps, 
              caloriesBurned: currentCal,
              calories: currentCal,
              recordedAt: new Date().toISOString()
            };
          } else {
            updated.unshift({
              userId: authUser?._id,
              date: todayStr,
              steps: currentSteps,
              caloriesBurned: currentCal,
              calories: currentCal,
              recordedAt: new Date().toISOString()
            });
          }
          return updated;
        });
      } else {
        setSyncStatus("Failed");
      }
    } catch (err) {
      setSyncStatus("Offline");
    }
  };

  // Safe local storage save and background sync debounce
  useEffect(() => {
    if (!authUser?._id) return;
    const userId = authUser?._id || 'guest';
    try {
      localStorage.setItem(`healthmate_today_steps_${userId}`, String(steps));
      localStorage.setItem(`healthmate_today_calories_${userId}`, String(caloriesBurned));
      localStorage.setItem(`healthmate_today_date_${userId}`, todayStr);
    } catch {}

    if (steps === 0) return;
    const s = steps;
    const c = caloriesBurned;
    const handler = setTimeout(() => {
      saveStepsToDB(s, c);
    }, 2500);

    return () => clearTimeout(handler);
  }, [steps, caloriesBurned, authUser?._id, todayStr]);

  // Daily reset check effect for midnight rollover
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const currentTodayStr = `${year}-${month}-${date}`;
      
      const userId = authUser?._id || 'guest';
      const storedDate = localStorage.getItem(`healthmate_today_date_${userId}`);
      
      if (storedDate && storedDate !== currentTodayStr) {
        console.log(`Detected day change from ${storedDate} to ${currentTodayStr}. Resetting stepping counters.`);
        
        // Save today's (now yesterday's) data to the DB if we had steps
        const prevSteps = parseInt(localStorage.getItem(`healthmate_today_steps_${userId}`) || '0');
        const prevCalories = parseFloat(localStorage.getItem(`healthmate_today_calories_${userId}`) || '0');
        
        if (prevSteps > 0) {
          saveStepsToDB(prevSteps, prevCalories);
        }
        
        // Reset local storage for new day
        localStorage.setItem(`healthmate_today_date_${userId}`, currentTodayStr);
        localStorage.setItem(`healthmate_today_steps_${userId}`, '0');
        localStorage.setItem(`healthmate_today_calories_${userId}`, '0');
        
        setSteps(0);
        setCaloriesBurned(0);
        
        // Refresh full history list
        fetchStepHistory();
      }
    };
    
    // Check immediately on mount
    checkDateChange();
    
    // Check periodically every 45 seconds
    const interval = setInterval(checkDateChange, 45000);
    return () => clearInterval(interval);
  }, [authUser?._id, todayStr]);

  // Synchronize Aura persistent companion emotions and contextual text based on tab and step states
  useEffect(() => {
    if (activeTab === 'home') {
      window.dispatchEvent(new CustomEvent('aura-buddy', {
        detail: {
          tab: 'home',
          mood: 'happy',
          text: "Here's your progress."
        }
      }));
    } else if (activeTab === 'food') {
      window.dispatchEvent(new CustomEvent('aura-buddy', {
        detail: {
          tab: 'food',
          mood: 'thinking',
          text: "Search any food and I'll help."
        }
      }));
    } else if (activeTab === 'steps') {
      window.dispatchEvent(new CustomEvent('aura-buddy', {
        detail: {
          tab: 'steps',
          mood: 'keep_going',
          text: "Every step counts."
        }
      }));
    } else if (activeTab === 'profile') {
      window.dispatchEvent(new CustomEvent('aura-buddy', {
        detail: {
          tab: 'profile',
          mood: 'calm',
          text: "You can manage your preferences here."
        }
      }));
    }
  }, [activeTab, steps, sensorActive, stepGoal, caloriesBurned, bmiClassification]);

  // Registers the global native Android step-sensor bridge callbacks and persistent state checks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Direct interface hook: Native Android service reports step counts (TYPE_STEP_COUNTER state tracker)
    (window as any).onAndroidStepCountChanged = (nativeSteps: number) => {
      console.log("HEALTHMATE Native Sensor Bridge: Received step count update: " + nativeSteps);
      setSteps(nativeSteps);
      setCaloriesBurned(parseFloat((nativeSteps * 0.04).toFixed(2)));
    };

    (window as any).onAndroidSensorStatusChanged = (status: string) => {
      console.log("HEALTHMATE Native Sensor Bridge: Status changed to: " + status);
    };

    // Auto-detect and sync on initial start if Bridge is present
    const bridge = (window as any).AndroidBridge;
    if (bridge && typeof bridge.getTodaySteps === 'function') {
      try {
        const initialSteps = bridge.getTodaySteps();
        if (typeof initialSteps === 'number' && initialSteps > 0) {
          setSteps(initialSteps);
          setCaloriesBurned(parseFloat((initialSteps * 0.04).toFixed(2)));
        }
      } catch (err) {
        console.warn("Initial steps native sync failed:", err);
      }
    }
  }, []);

  // Dynamic walking session motion sensor (accelerometer browser-level fallback)
  useEffect(() => {
    if (!sensorActive) return;

    // Active walking session timer
    const durationTimer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    let lastAcceleration = { x: 0, y: 0, z: 0 };
let lastUpdate = 0;
const threshold = 4.5;
let lastStepTime = 0;

const handleMotionEvent = (event: DeviceMotionEvent) => {
  const acc = event.accelerationIncludingGravity || event.acceleration;
  if (!acc) return;

  const currentTime = Date.now();
  if ((currentTime - lastUpdate) > 100) {
    lastUpdate = currentTime;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const delta = Math.abs(magnitude - 9.8);

    if (delta > threshold && (currentTime - lastStepTime) > 900) {
      lastStepTime = currentTime;

      setSteps(prev => {
        const nextSteps = prev + 1;
        setCaloriesBurned(parseFloat((nextSteps * 0.04).toFixed(2)));
        return nextSteps;
      });
    }

    lastAcceleration = { x, y, z };
  }
};

    if (typeof window !== 'undefined') {
      window.addEventListener('devicemotion', handleMotionEvent, true);
    }

    return () => {
      clearInterval(durationTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotionEvent, true);
      }
    };
  }, [sensorActive]);

  useEffect(() => {
    if (authUser?._id) {
      fetchBmiHistory();
      fetchStepHistory();
    }
  }, [authUser?._id]);

  // Background focus recovery to fetch any offline or passive background sensor updates
  useEffect(() => {
    const handleReturn = () => {
      if (document.visibilityState === 'visible' && authUser?._id) {
        console.log("HealthMate Core: App focuses/re-opens, catching up step metrics.");
        fetchStepHistory();
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleReturn);
      window.addEventListener('focus', handleReturn);
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleReturn);
        window.removeEventListener('focus', handleReturn);
      }
    };
  }, [authUser?._id]);

  const handleAddBmiLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newLogWeight);
    const h = parseFloat(newLogHeight);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      setLogSubmitStatus("Please specify valid weight & height numbers.");
      return;
    }
    try {
      setLogSubmitStatus("Writing log entry...");
      const response = await fetch("/api/save-bmi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": authUser?._id || "",
        },
        body: JSON.stringify({
          weight: w,
          height: h,
        }),
      });

      const json = await response.json();
      if (json.success) {
        setLogSubmitStatus("Log registered successfully!");
        setNewLogWeight('');
        fetchBmiHistory();
        
        // Update user state if possible to refresh active calculations
        profile.weight = w;
        profile.height = h;

        setTimeout(() => {
          setLogSubmitStatus("");
        }, 3000);
      } else {
        setLogSubmitStatus(`Error: ${json.error}`);
      }
    } catch (err: any) {
      setLogSubmitStatus(`Network failure: ${err.message}`);
    }
  };

  const handleStartWalk = async () => {
    try {
      localStorage.setItem('healthmate_real_tracking_enabled', 'true');
      localStorage.setItem('healthmate_sensor_enabled', 'true');
      
      // Wire directly to native Android TYPE_STEP_COUNTER service
      const bridge = (window as any).AndroidBridge;
      if (bridge && typeof bridge.startStepCounter === 'function') {
        console.log("HEALTHMATE Native Sensor Bridge: Starting native TYPE_STEP_COUNTER sensor service...");
        bridge.startStepCounter();
        // Trigger native permission request
        if (typeof bridge.requestPermission === 'function') {
          bridge.requestPermission();
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      const devMot = (DeviceMotionEvent as any);
      if (devMot && typeof devMot.requestPermission === 'function') {
        try {
          const state = await devMot.requestPermission();
          setSensorActive(state === 'granted');
          if (state !== 'granted') {
            try {
              localStorage.setItem('healthmate_real_tracking_enabled', 'false');
              localStorage.setItem('healthmate_sensor_enabled', 'false');
            } catch {}
          }
        } catch (err) {
          setSensorActive(true);
        }
      } else {
        setSensorActive(true);
      }
    } else {
      setSensorActive(true);
    }
  };

  const handleStopWalk = async () => {
    setSensorActive(false);
    try {
      localStorage.setItem('healthmate_real_tracking_enabled', 'false');
      localStorage.setItem('healthmate_sensor_enabled', 'false');

      // Wire directly to native Android background service disable switch
      const bridge = (window as any).AndroidBridge;
      if (bridge && typeof bridge.stopStepCounter === 'function') {
        console.log("HEALTHMATE Native Sensor Bridge: Stopping native step service activity...");
        bridge.stopStepCounter();
      }
    } catch {}
  };

  const getBmiColorClasses = (classification: BMIClassification) => {
    switch (classification) {
      case 'Severe Underweight':
        return {
          glow: 'from-blue-500/20 to-sky-500/20 border-blue-500/30',
          text: 'text-sky-400',
          bg: 'bg-blue-500/10 text-sky-450 border-blue-500/20',
          progressColor: 'bg-blue-500',
          dialBg: 'border-blue-450'
        };
      case 'Moderate Underweight':
        return {
          glow: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
          text: 'text-blue-400',
          bg: 'bg-indigo-500/10 text-blue-400 border-indigo-500/20',
          progressColor: 'bg-indigo-500',
          dialBg: 'border-indigo-450'
        };
      case 'Mild Underweight':
        return {
          glow: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
          text: 'text-yellow-400',
          bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          progressColor: 'bg-yellow-400',
          dialBg: 'border-yellow-450'
        };
      case 'Healthy':
        return {
          glow: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          progressColor: 'bg-emerald-400',
          dialBg: 'border-emerald-450'
        };
      case 'Overweight':
        return {
          glow: 'from-orange-500/20 to-amber-500/20 border-amber-550/30',
          text: 'text-amber-450',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          progressColor: 'bg-amber-400',
          dialBg: 'border-amber-450'
        };
      case 'Obesity I':
      case 'Obesity II':
      case 'Obesity III':
      default:
        return {
          glow: 'from-rose-500/20 to-red-500/20 border-red-550/30',
          text: 'text-red-400',
          bg: 'bg-red-500/10 text-red-500 border-red-500/20',
          progressColor: 'bg-red-400',
          dialBg: 'border-red-450'
        };
    }
  };

  const bmiTheme = getBmiColorClasses(bmiClassification);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
      {/* Absolute background effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-teal-500/[0.02] blur-[120px] pointer-events-none" />

      {/* Top Professional Header Bar */}
      <header className="sticky top-0 z-40 w-full h-18 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/80 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
            <Apple className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-wider bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              HEALTHMATE
            </span>
            <span className="text-[9px] font-mono font-medium text-slate-500 tracking-wider">EAT SMART • LIVE BETTER</span>
          </div>
        </div>

        {/* Dynamic biological quick status pill */}
        <div className="hidden border border-slate-850 bg-slate-950/40 rounded-full py-1.5 px-3 md:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-mono text-[9px] font-bold uppercase">BMI:</span>
            <span className={`font-mono font-bold ${bmiTheme.text}`}>{bmiScore}</span>
          </div>
          <span className="w-[1px] h-3.5 bg-slate-850" />
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-mono text-[9px] font-bold uppercase">ZONE:</span>
            <span className={`font-display font-bold ${bmiTheme.text}`}>{bmiClassification}</span>
          </div>
          <span className="w-[1px] h-3.5 bg-slate-850" />
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-mono text-[9px] font-bold uppercase">ACTIVITY:</span>
            <span className="font-display font-semibold text-slate-300 capitalize">{profileState.activityLevel}</span>
          </div>
        </div>

        {/* Right side Profile controls */}
        <button
          onClick={onEditProfile}
          className="p-2 border border-slate-850 rounded-xl bg-slate-900 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium font-display"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Update Metrics
        </button>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Tab switcher segmented buttons */}
        <div className="bg-slate-900/60 p-1 rounded-2xl border border-slate-900/80 flex flex-nowrap overflow-x-auto max-w-2xl mx-auto gap-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 min-w-[65px] py-2.5 px-2.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'home'
                ? 'bg-slate-950 border border-slate-800 text-emerald-400 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-[10px] sm:text-xs">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex-1 min-w-[65px] py-2.5 px-2.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'steps'
                ? 'bg-slate-950 border border-slate-800 text-emerald-400 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-4.5 h-4.5 shrink-0" />
            <span className="text-[10px] sm:text-xs">Tracker</span>
          </button>
          <button
            onClick={() => setActiveTab('food')}
            className={`flex-1 min-w-[65px] py-2.5 px-2.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'food'
                ? 'bg-slate-950 border border-slate-800 text-emerald-400 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-4.5 h-4.5 shrink-0" />
            <span className="text-[10px] sm:text-xs">Food</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-[65px] py-2.5 px-2.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-slate-950 border border-slate-800 text-emerald-400 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4.5 h-4.5 shrink-0" />
            <span className="text-[10px] sm:text-xs">Profile</span>
          </button>
        </div>

        {/* Tab panels implementations */}
        <div className="space-y-6">
          {activeTab === 'home' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <HomeTab
                steps={steps}
                stepGoal={stepGoal}
                sensorActive={sensorActive}
                bmiClassification={bmiClassification}
                setActiveTab={setActiveTab}
                authUser={authUser}
                profile={profileState}
              />
            </motion.div>
          )}

          {activeTab === 'food' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <FoodSearch
                bmiClassification={bmiClassification}
                userAge={profileState.age}
                activityLevel={profileState.activityLevel}
                userGender={profileState.gender}
              />

              {/* Personalized recommended meal strategy */}
              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl space-y-6 mt-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-100">
                    Recommended Diet Strategy Grid ({bmiClassification})
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Daily macro-focused recommendations parsed to your active weight conditions.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  {/* Breakfast */}
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-2">
                    <h4 className="font-display font-bold text-sm text-slate-200">🥗 Breakfast</h4>
                    <ul className="space-y-1.5 text-xs text-slate-400 pl-1 list-disc">
                      {mealSuggestions.Breakfast.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                  {/* Lunch */}
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-2">
                    <h4 className="font-display font-bold text-sm text-slate-200">🍛 Lunch</h4>
                    <ul className="space-y-1.5 text-xs text-slate-400 pl-1 list-disc">
                      {mealSuggestions.Lunch.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                  {/* Snacks */}
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-2">
                    <h4 className="font-display font-bold text-sm text-slate-200">🍎 Snacks</h4>
                    <ul className="space-y-1.5 text-xs text-slate-400 pl-1 list-disc">
                      {mealSuggestions.Snacks.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                  {/* Dinner */}
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-2">
                    <h4 className="font-display font-bold text-sm text-slate-200">🌙 Dinner</h4>
                    <ul className="space-y-1.5 text-xs text-slate-400 pl-1 list-disc">
                      {mealSuggestions.Dinner.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'steps' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <StepsTab
                steps={steps}
                setSteps={setSteps}
                caloriesBurned={caloriesBurned}
                stepGoal={stepGoal}
                setStepGoal={setStepGoal}
                sensorActive={sensorActive}
                sessionDuration={sessionDuration}
                handleStartWalk={handleStartWalk}
                handleStopWalk={handleStopWalk}
                stepHistory={stepHistory}
                stepHistoryLoading={stepHistoryLoading}
                statsAverages={statsAverages}
                getFoodEquivalent={getFoodEquivalent}
              />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ProfileTab
                profile={profileState}
                authUser={authUser}
                onLogout={onReset}
                onUpdateProfile={(newProfile, newAuthDetails) => {
                  const updated = { ...profileState, ...newProfile };
                  setProfileState(updated);
                  
                  // Also mutate the parent prop if it's referenced outside
                  Object.assign(profile, newProfile);

                  if (authUser) {
                    authUser.name = newAuthDetails.name;
                    authUser.email = newAuthDetails.email;
                    localStorage.setItem('healthmate_auth_user', JSON.stringify(authUser));
                  }

                  // Synchronize database on the fly
                  fetch('/api/create-profile', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-user-id': authUser?._id || '',
                    },
                    body: JSON.stringify(updated),
                  }).catch(err => console.error("Error updating profile database:", err));
                }}
              />
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile navigation bottom bar (Only visible on small devices) */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-900/90 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] h-[calc(4.2rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md shadow-lg shadow-black">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center h-full w-full gap-0.5 text-[9px] transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('steps')}
          className={`flex flex-col items-center justify-center h-full w-full gap-0.5 text-[9px] transition-colors cursor-pointer ${
            activeTab === 'steps' ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Footprints className="w-4.5 h-4.5" />
          <span>Tracker</span>
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`flex-1 flex flex-col items-center justify-center h-full w-full gap-0.5 text-[9px] transition-colors cursor-pointer ${
            activeTab === 'food' ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Apple className="w-4.5 h-4.5" />
          <span>Food</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center h-full w-full gap-0.5 text-[9px] transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <User className="w-4.5 h-4.5" />
          <span>Profile</span>
        </button>
      </footer>
    </div>
  );
}
