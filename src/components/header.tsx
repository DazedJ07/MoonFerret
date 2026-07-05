'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, User, Image as ImageIcon, X, Save, LogOut, Sun, Moon, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  title?: string;
  userName: string;
  setUserName: (name: string) => void;
  workspaceTitle: string;
  setWorkspaceTitle: (title: string) => void;
  profilePic: string | null;
  setProfilePic: (url: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userId: string | null;
  onMenuToggle?: () => void;
}

export default function Header({ 
  title = 'MoonFerret',
  userName,
  setUserName,
  workspaceTitle,
  setWorkspaceTitle,
  profilePic,
  setProfilePic,
  searchQuery,
  setSearchQuery,
  userId,
  onMenuToggle = () => {}
}: HeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [tempTitle, setTempTitle] = useState(workspaceTitle);
  const [tempPic, setTempPic] = useState<string | null>(profilePic);
  const [logoError, setLogoError] = useState(false);

  // Interface Theme States
  const [activeTheme, setActiveTheme] = useState('Minimalist Blue');
  const [customColor, setCustomColor] = useState('#38bdf8');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setIsMounted(true);
    // Initialize theme from local storage safely on client mount
    const savedTheme = localStorage.getItem('lamoon-theme') || 'Minimalist Blue';
    const savedCustom = localStorage.getItem('lamoon-custom-color') || '#38bdf8';
    setActiveTheme(savedTheme);
    setCustomColor(savedCustom);
    applyTheme(savedTheme, savedCustom);

    // Initialize light/dark mode (light is default)
    const savedMode = (localStorage.getItem('moonferret-theme-mode') as 'light' | 'dark') || 'light';
    setThemeMode(savedMode);
    if (savedMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const applyTheme = (themeName: string, customHex: string) => {
    let cssValue = '#bae6fd'; // Minimalist Blue default (sky-200)
    let accentVal = '#0ea5e9'; // sky-500 default
    let accentForegroundVal = '#ffffff';

    if (themeName === 'Minimalist Blue') {
      cssValue = '#bae6fd';
      accentVal = '#0ea5e9';
      accentForegroundVal = '#ffffff';
    } else if (themeName === 'Cyber Monochrome') {
      cssValue = '#f3f4f6';
      accentVal = '#1c1917'; // Stone-900 (Charcoal)
      accentForegroundVal = '#ffffff';
    } else if (themeName === 'Nordic Sage') {
      cssValue = '#d1fae5';
      accentVal = '#10b981'; // Emerald-500
      accentForegroundVal = '#ffffff';
    } else if (themeName === 'Aurora Borealis') {
      cssValue = 'linear-gradient(to right, #2dd4bf, #3b82f6)';
      accentVal = '#06b6d4'; // Teal-500
      accentForegroundVal = '#ffffff';
    } else if (themeName === 'Sunset Minimal') {
      cssValue = 'linear-gradient(to right, #f59e0b, #ec4899)';
      accentVal = '#f43f5e'; // Rose-500
      accentForegroundVal = '#ffffff';
    } else if (themeName === 'Deep Space') {
      cssValue = 'linear-gradient(to right, #0f172a, #1e293b)';
      accentVal = '#475569'; // Slate-600
      accentForegroundVal = '#ffffff';
    } else if (themeName === 'Custom') {
      cssValue = customHex;
      accentVal = customHex;
      // Contrast check for custom hex to assign black or white text dynamically
      accentForegroundVal = isThemeDark('Custom', customHex) ? '#ffffff' : '#1c1917';
    }
    
    document.documentElement.style.setProperty('--header-accent', cssValue);
    document.documentElement.style.setProperty('--color-brand', accentVal);
    document.documentElement.style.setProperty('--color-brand-foreground', accentForegroundVal);
    
    localStorage.setItem('lamoon-theme', themeName);
    if (themeName === 'Custom') {
      localStorage.setItem('lamoon-custom-color', customHex);
    }
  };

  const toggleThemeMode = () => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
    localStorage.setItem('moonferret-theme-mode', nextMode);
    if (nextMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleOpen = () => {
    setTempName(userName);
    setTempTitle(workspaceTitle);
    setTempPic(profilePic);
    setIsProfileModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempPic(url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(tempName);
    setWorkspaceTitle(tempTitle);
    setProfilePic(tempPic);
    applyTheme(activeTheme, customColor);

    if (userId) {
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          display_name: tempName,
          workspace_title: tempTitle,
          avatar_url: tempPic
        });
      } catch (err) {
        console.error('Supabase profile save fail:', err);
      }
    }

    setIsProfileModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('moonferret-login-time');
      window.location.reload();
    } catch (err) {
      console.error('Sign out fail:', err);
    }
  };

  // Get initials for profile fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'JM';
  };

  // Determine if the current active header theme background is dark or light
  const isThemeDark = (themeName: string, customHex: string) => {
    if (themeName === 'Deep Space' || themeName === 'Aurora Borealis' || themeName === 'Sunset Minimal') {
      return true;
    }
    if (themeName === 'Custom') {
      const hex = customHex.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.65;
      }
    }
    return false;
  };

  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 bg-[#bae6fd] border-b border-border-main/30 w-full h-[60px]" />
    );
  }

  const isDark = isThemeDark(activeTheme, customColor);
  const headerTextColor = isDark ? 'text-white' : 'text-stone-900';
  const headerSubColor = isDark ? 'text-stone-300' : 'text-stone-500';
  const searchInputStyle = isDark 
    ? 'bg-white/15 text-white placeholder:text-white/60 border-white/20 focus:bg-white/25 focus:border-white/40' 
    : 'bg-white/70 text-stone-900 placeholder:text-stone-500/60 border-stone-200/30 focus:bg-white focus:border-stone-400';
  const profilePillStyle = isDark 
    ? 'bg-white/15 border-white/10 hover:bg-white/25 text-white' 
    : 'bg-white/50 border-stone-200/20 hover:bg-white/70 text-stone-900';
  const signOutBtnStyle = isDark 
    ? 'bg-white/10 hover:bg-rose-500/20 border-white/10 text-white' 
    : 'bg-white/60 hover:bg-rose-55 border-stone-200/20 text-stone-600 hover:text-rose-600';

  return (
    <header 
      style={{ background: 'var(--header-accent)' }}
      className="sticky top-0 z-50 border-b border-border-main/30 w-full shadow-sm"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand logo, title, and hamburger menu trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Mobile hamburger menu button */}
          <button 
            onClick={onMenuToggle}
            className={`p-1.5 rounded-xl lg:hidden shrink-0 cursor-pointer transition-colors ${
              isDark ? 'hover:bg-white/15 text-white' : 'hover:bg-black/5 text-stone-700'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {logoError ? (
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20 text-brand font-bold shrink-0 shadow-inner">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </div>
          ) : (
            <img 
              src="/Ico/Moonferret.png" 
              alt="MoonFerret Logo" 
              className="w-10 h-10 object-contain shrink-0" 
              onError={() => setLogoError(true)}
            />
          )}
          <div className="min-w-0">
            <motion.h1
              className={`text-xs sm:text-sm font-bold tracking-tight leading-tight truncate font-sans transition-colors duration-300 ${headerTextColor}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {title}
            </motion.h1>
            <p className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-wider truncate leading-tight mt-0.5 font-sans transition-colors duration-300 ${headerSubColor}`}>
              {workspaceTitle}
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-auto min-w-0">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-white/60' : 'text-stone-400'}`} />
            <input
              type="text"
              placeholder="Search items, spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-8 pl-8 sm:pl-9 pr-3 sm:pr-4 backdrop-blur-sm rounded-full border text-[11px] sm:text-xs focus:outline-none transition-all duration-200 ${searchInputStyle}`}
            />
          </div>
        </div>

        {/* Right: Personalize Profile, Dark Mode Toggle & Sign Out */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Dark Mode Switcher */}
          <motion.button
            onClick={toggleThemeMode}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 border-white/10 text-amber-400' 
                : 'bg-white/60 hover:bg-white/80 border-stone-200/20 text-stone-600'
            }`}
            title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {themeMode === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </motion.button>

          {/* Profile Pill */}
          <motion.button
            onClick={handleOpen}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-2 h-8 pl-1 pr-2 sm:pr-3 rounded-full backdrop-blur-sm border transition-colors cursor-pointer ${profilePillStyle}`}
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border-main/10 shrink-0">
              {profilePic ? (
                <img src={profilePic} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[8px] font-bold text-primary">{getInitials(userName)}</span>
              )}
            </div>
            <span className="text-[11px] font-semibold hidden md:inline max-w-[80px] truncate">{userName}</span>
            <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
          </motion.button>

          {/* Sign Out Button */}
          <motion.button
            onClick={handleSignOut}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`h-8 px-2 sm:px-3 rounded-full flex items-center justify-center border transition-all cursor-pointer font-medium text-[11px] gap-1 ${signOutBtnStyle}`}
            title="Sign Out"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Sign Out</span>
          </motion.button>
        </div>
      </div>

      {/* Personalize Profile CRUD & Theme Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
            />
            {/* Modal Box */}
            <motion.div 
              className="relative w-full max-w-sm bg-card rounded-3xl border border-border-main/40 p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <User className="w-4 h-4 text-brand" />
                  Personalize Profile
                </h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-1 hover:bg-canvas rounded-full text-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full bg-canvas overflow-hidden border border-border-main/20 flex items-center justify-center group">
                    {tempPic ? (
                      <img src={tempPic} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-stone-400" />
                    )}
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <ImageIcon className="w-4 h-4 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="font-bold text-secondary">Display Name</label>
                    <input 
                      type="text" 
                      required
                      value={tempName} 
                      onChange={(e) => setTempName(e.target.value)} 
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Workspace Title</label>
                  <input 
                    type="text" 
                    required
                    value={tempTitle} 
                    onChange={(e) => setTempTitle(e.target.value)} 
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand font-medium"
                  />
                </div>

                {/* Interface Theme Selection Swatches */}
                <div className="space-y-3 pt-2 border-t border-border-main/20">
                  <h4 className="font-bold text-stone-700 uppercase tracking-wider text-[9px]">Interface Theme</h4>
                  
                  {/* Category 1: Solid Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-stone-400 font-bold block">Solid Presets:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Minimalist Blue', 'Cyber Monochrome', 'Nordic Sage'].map((theme) => {
                        const isSel = activeTheme === theme;
                        return (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => { setActiveTheme(theme); applyTheme(theme, customColor); }}
                            className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                              isSel 
                                ? 'bg-brand/10 border-brand text-brand' 
                                : 'bg-canvas/30 border-border-main/20 hover:bg-canvas/50 text-secondary'
                            }`}
                          >
                            {theme === 'Minimalist Blue' ? 'Sky Blue' : theme === 'Cyber Monochrome' ? 'Charcoal' : 'Sage'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 2: Gradient Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-stone-400 font-bold block">Premium Gradients:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Aurora Borealis', 'Sunset Minimal', 'Deep Space'].map((theme) => {
                        const isSel = activeTheme === theme;
                        return (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => { setActiveTheme(theme); applyTheme(theme, customColor); }}
                            className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                              isSel 
                                ? 'bg-indigo-500/10 border-indigo-400 text-indigo-600' 
                                : 'bg-canvas/30 border-border-main/20 hover:bg-canvas/50 text-secondary'
                            }`}
                          >
                            {theme === 'Aurora Borealis' ? 'Aurora' : theme === 'Sunset Minimal' ? 'Sunset' : 'Deep Space'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 3: Custom Color Creator */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] text-stone-400 font-bold block">Custom Color Theme Creator:</span>
                    <div className="flex items-center gap-3 bg-canvas/30 p-2 rounded-xl border border-border-main/20">
                      <input 
                        type="color" 
                        value={customColor} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomColor(val);
                          setActiveTheme('Custom');
                          applyTheme('Custom', val);
                        }}
                        className="w-7 h-7 rounded border border-border-main/20 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-primary block text-[10px]">Select Brand Tint</span>
                        <span className="text-[9px] text-stone-400 select-all font-mono uppercase">{customColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-main/20 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Settings
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
