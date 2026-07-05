'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import Grainient from '@/components/ui/grainient';
import { User, Lock, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';

interface AuthGatewayProps {
  onSuccess: (session: any) => void;
}

export default function AuthGateway({ onSuccess }: AuthGatewayProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Normalize username string into standard email formatting to satisfy Supabase Auth
    const normalizedEmail = `${username.trim().toLowerCase()}@moonferret.com`;

    try {
      if (activeTab === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password,
        });
        if (error) throw error;
        
        if (data?.session) {
          // Record current login timestamp to enforce the exact 15-day login lifespan
          localStorage.setItem('moonferret-login-time', Date.now().toString());
          onSuccess(data.session);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: password,
          options: {
            data: {
              display_name: fullName.trim() || username.trim(),
            }
          }
        });
        if (error) throw error;
        
        // Since Confirm Email is disabled in Supabase, signUp automatically logs the user in
        if (data?.session) {
          localStorage.setItem('moonferret-login-time', Date.now().toString());
          onSuccess(data.session);
        } else {
          setSuccessMsg('Account created successfully! You can now sign in using your credentials.');
          setActiveTab('signin');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-stone-950 font-sans p-4">
      {/* 1. Animated grainient canvas background */}
      <Grainient 
        color1="#75a0e6"
        color2="#9983f0"
        color3="#aec2e4"
        timeSpeed={0.25}
        colorBalance={0}
        warpStrength={1}
        warpFrequency={5}
        warpSpeed={2}
        warpAmplitude={50}
        blendAngle={0}
        blendSoftness={0.05}
        rotationAmount={500}
        noiseScale={2}
        grainAmount={0.1}
        grainScale={2}
        grainAnimated={false}
        contrast={1.5}
        gamma={1}
        saturation={1}
        centerX={0}
        centerY={0}
        zoom={0.9}
      />

      {/* 2. Foreground Center Form Card matching image_9ea56b.jpg */}
      <motion.div
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl border border-stone-200/50 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] p-8 space-y-6"
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        {/* Brand logo Moonferret */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-stone-50 border border-stone-200/50 rounded-2xl flex items-center justify-center p-3 shadow-inner">
            <img 
              src="/Ico/Moonferret.ico" 
              alt="MoonFerret Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">MoonFerret</h2>
            <p className="text-xs text-stone-500 font-medium">Minimalist Household Inventory</p>
          </div>
        </div>

        {/* Sliding horizontal selection bar */}
        <div className="relative flex bg-stone-100 p-1 rounded-full border border-stone-200/20">
          <motion.div
            className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm"
            layoutId="activeTabBg"
            animate={{
              left: activeTab === 'signin' ? '4px' : '50%',
              right: activeTab === 'signin' ? '50%' : '4px',
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setErrorMsg(null); }}
            className={`flex-1 relative z-10 py-1.5 text-[11px] font-bold text-center transition-colors duration-200 cursor-pointer ${
              activeTab === 'signin' ? 'text-stone-900' : 'text-stone-400'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
            className={`flex-1 relative z-10 py-1.5 text-[11px] font-bold text-center transition-colors duration-200 cursor-pointer ${
              activeTab === 'signup' ? 'text-stone-900' : 'text-stone-400'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {activeTab === 'signup' && (
              <motion.div
                className="space-y-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jian Medina"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-9.5 px-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-1 focus:ring-sky-200 transition-all font-medium"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                placeholder="e.g. jianm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-9.5 pl-9 pr-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-1 focus:ring-sky-200 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9.5 pl-9 pr-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-1 focus:ring-sky-200 transition-all font-medium"
              />
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-[10px] text-rose-600 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-[10px] text-emerald-600 font-medium">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : activeTab === 'signin' ? (
              <>
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Create Account
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
