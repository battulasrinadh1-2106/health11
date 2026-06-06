/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import Splash from './components/Splash';
import ProfileSetup from './components/ProfileSetup';
import MainPage from './components/MainPage';
import Auth from './components/Auth';
import HealthMateCompanionWidget from './components/HealthMateCompanionWidget';

type AppStep = 'splash' | 'auth' | 'setup' | 'main';

export default function App() {
  const [step, setStep] = useState<AppStep>('main');

const [profile, setProfile] = useState<UserProfile | null>({
  age: 25,
  gender: 'male',
  height: 170,
  weight: 70,
  activityLevel: 'moderate'
});

const [authUser, setAuthUser] = useState<any | null>({
  _id: 'test-user',
  name: 'Test User',
  email: 'test@test.com'
});
  

  const [initialIsSignup, setInitialIsSignup] = useState<boolean>(false);

  // Trigger contextual messages for our persistent 3D buddy on app step transitions
  useEffect(() => {
    const t = setTimeout(() => {
      if (step === 'splash') {
        window.dispatchEvent(new CustomEvent('aura-buddy', {
          detail: {
            mood: 'happy',
            text: "Hi! I'm your HealthMate 🌱"
          }
        }));
      } else if (step === 'auth') {
        window.dispatchEvent(new CustomEvent('aura-buddy', {
          detail: {
            mood: 'calm',
            text: "Welcome back."
          }
        }));
      } else if (step === 'setup') {
        window.dispatchEvent(new CustomEvent('aura-buddy', {
          detail: {
            mood: 'thinking',
            text: "Let's understand your health profile. Tell me about yourself."
          }
        }));
      } else if (step === 'main') {
        window.dispatchEvent(new CustomEvent('aura-buddy', {
          detail: {
            mood: 'happy',
            text: "Here's your progress."
          }
        }));
      }
    }, 400);

    return () => clearTimeout(t);
  }, [step]);

  // Restore authenticated session from localStorage if present
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('healthmate_auth_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setAuthUser(parsedUser);

        // Fetch fresh profile state from backend
        fetch('/api/get-profile', {
          headers: {
            'x-user-id': parsedUser._id,
          },
        })
          .then((res) => res.json())
          .then((resJson) => {
            if (resJson.success && resJson.data && resJson.data.age) {
              const u = resJson.data;
              const mappedProfile: UserProfile = {
                age: u.age,
                gender: u.gender,
                height: u.height,
                weight: u.weight,
                activityLevel: u.activityLevel,
              };
              setProfile(mappedProfile);
              setStep('main');
            } else {
              setStep('setup');
            }
          })
          .catch((err) => {
            console.warn('Backup routing active. Loading local cached profiles.', err);
            const storedProfile = localStorage.getItem('healthmate_profile');
            if (storedProfile) {
              setProfile(JSON.parse(storedProfile));
              setStep('main');
            } else {
              setStep('auth');
            }
          });
      }
    } catch (e) {
      console.warn('Could not restore user profile stats from storage', e);
    }
  }, []);

  const handleGetStarted = (mode: 'login' | 'register') => {
    setInitialIsSignup(mode === 'register');
    setStep('auth');
  };

  const handleAuthSuccess = (userData: any) => {
    setAuthUser(userData);
    try {
      localStorage.setItem('healthmate_auth_user', JSON.stringify(userData));
      localStorage.setItem('healthmate_just_logged_in', 'true');
    } catch (e) {
      console.error('Failed to preserve credentials', e);
    }

    if (userData.age && userData.height && userData.weight) {
      const mappedProfile: UserProfile = {
        age: userData.age,
        gender: userData.gender,
        height: userData.height,
        weight: userData.weight,
        activityLevel: userData.activityLevel,
      };
      setProfile(mappedProfile);
      setStep('main');
    } else {
      setStep('setup');
    }
  };

  const handleProfileSubmit = (newProfile: UserProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('healthmate_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.error('Failed to preserve user profile in offline storage', e);
    }

    fetch('/api/create-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': authUser?._id || '',
      },
      body: JSON.stringify(newProfile),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('✅ Profile saved to database successfully:', data);
        if (data.success && data.data) {
          const updatedUser = { ...authUser, ...data.data };
          setAuthUser(updatedUser);
          localStorage.setItem('healthmate_auth_user', JSON.stringify(updatedUser));
        }
      })
      .catch((err) => {
        console.warn('⚠️ Database profile sync deferred. Running in offline fallback.', err.message);
      });

    setStep('main');
  };

  const handleEditProfile = () => {
    setStep('setup');
  };

  const handleWipeAndReset = () => {
    try {
      localStorage.removeItem('healthmate_profile');
      localStorage.removeItem('healthmate_auth_user');
    } catch (e) {
      console.error(e);
    }
    setProfile(null);
    setAuthUser(null);
    setStep('auth');
  };

  return (
    <div className="relative min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans transition-all duration-300">
      {step === 'splash' && (
        <Splash onGetStarted={handleGetStarted} />
      )}

      {step === 'auth' && (
        <Auth 
          onSuccess={handleAuthSuccess}
          onBack={() => setStep('splash')}
          initialIsSignup={initialIsSignup}
        />
      )}

      {step === 'setup' && (
        <ProfileSetup 
          initialProfile={profile || undefined}
          onSubmit={handleProfileSubmit}
          onBack={profile ? () => setStep('main') : undefined}
        />
      )}

      {step === 'main' && profile && authUser && (
        <MainPage 
          profile={profile}
          authUser={authUser}
          onEditProfile={handleEditProfile}
          onReset={handleWipeAndReset}
        />
      )}

      {/* Global persistent HealthMate movable companion */}
      <HealthMateCompanionWidget />
    </div>
  );
}
