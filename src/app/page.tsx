'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import SubNav from '@/components/sub-nav';
import MainContent from '@/components/main-content';
import UtilityBar from '@/components/utility-bar';
import { useNavigation, type ViewId } from '@/hooks/use-navigation';
import { useSubNav } from '@/hooks/use-sub-nav';
import { useItemCounts } from '@/hooks/use-item-counts';
import type { Space } from '@/data/mock-data';
import type { IndividualItem, StorageUnit } from '@/data/types';
import { X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, uploadImageToStorage } from '@/lib/supabase';
import AuthGateway from '@/components/auth-gateway';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { activeView, navigate } = useNavigation();
  const { activeTab, switchTab } = useSubNav();
  const { counts, increment, decrement } = useItemCounts();

  // Anchoring authenticated user session
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // States initialized to empty array or null (awaiting Supabase hydration)
  const [spacesList, setSpacesList] = useState<Space[]>([]);
  const [storageUnitsList, setStorageUnitsList] = useState<StorageUnit[]>([]);
  const [individualItemsList, setIndividualItemsList] = useState<IndividualItem[]>([]);
  const [notesList, setNotesList] = useState<{ id: string; title: string; body: string; date: string }[]>([]);

  // Profile states
  const [userName, setUserName] = useState('Jian M.');
  const [workspaceTitle, setWorkspaceTitle] = useState('LaMoon Home');
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Global search bar state
  const [searchQuery, setSearchQuery] = useState('');

  // Active Carousel Index state (can go negative/positive indefinitely for infinite loop)
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  // Add Space Modal states
  const [isAddSpaceOpen, setIsAddSpaceOpen] = useState(false);
  const [spaceNameInput, setSpaceNameInput] = useState('');
  const [spaceDescInput, setSpaceDescInput] = useState('');
  const [spaceQtyInput, setSpaceQtyInput] = useState(2);
  const [spaceDimInput, setSpaceDimInput] = useState('');
  const [spaceImageInput, setSpaceImageInput] = useState<string | null>(null);
  const [isSpaceUploading, setIsSpaceUploading] = useState(false);

  // 1. Direct Callback: Carousel slide changes activeView and carousel state directly
  const handleCarouselChange = useCallback((index: number) => {
    setActiveCarouselIndex(index);
    if (spacesList.length === 0) return;
    
    const len = spacesList.length + 1; // including dashboard
    const currentNormalized = ((index % len) + len) % len;
    
    if (currentNormalized === 0) {
      if (activeView !== 'dashboard') {
        navigate('dashboard');
      }
    } else {
      const targetSpace = spacesList[currentNormalized - 1];
      if (targetSpace && activeView !== targetSpace.id) {
        navigate(targetSpace.id as ViewId);
      }
    }
  }, [spacesList, activeView, navigate]);

  // 2. Direct Callback: Sidebar navigation changes activeView and carousel state directly
  const handleSidebarNavigate = useCallback((spaceId: ViewId) => {
    navigate(spaceId);
    switchTab('my-items'); // Always reset to items tab when navigating
    if (spacesList.length === 0) return;
    
    const len = spacesList.length + 1;
    const currentNormalized = ((activeCarouselIndex % len) + len) % len;

    if (spaceId === 'dashboard') {
      if (currentNormalized !== 0) {
        const diff = 0 - currentNormalized;
        setActiveCarouselIndex(prev => prev + diff);
      }
    } else {
      const targetIdx = spacesList.findIndex((s) => s.id === spaceId);
      if (targetIdx !== -1) {
        const expectedNormalized = targetIdx + 1;
        if (currentNormalized !== expectedNormalized) {
          let diff = expectedNormalized - currentNormalized;
          if (diff > len / 2) diff -= len;
          if (diff < -len / 2) diff += len;
          setActiveCarouselIndex(prev => prev + diff);
        }
      }
    }
  }, [spacesList, activeCarouselIndex, navigate, switchTab]);

  // Supabase Async Hydrator on Client Mount
  const fetchDashboardData = useCallback(async (activeUid: string) => {
    try {
      // 1. Fetch Profile info from DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUid)
        .maybeSingle();
      
      if (profile) {
        setUserName(profile.display_name || profile.username || 'Jian M.');
        setWorkspaceTitle(profile.workspace_title || 'MoonFerret Home');
        setProfilePic(profile.avatar_url || profile.profile_pic || null);
      }

      // 2. Fetch Spaces from DB
      const { data: spaces } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', activeUid);

      setSpacesList(
        spaces
          ? spaces.map((s: any) => ({
              id: s.id,
              name: s.name,
              slug: s.id,
              icon: s.icon || 'Folder',
              description: s.description || '',
              imageCount: s.image_count || 2,
              imageUrl: s.image_url || undefined,
              dimensions: s.dimensions || undefined,
            }))
          : []
      );

      // 3. Fetch Storage Units from DB
      const { data: storages } = await supabase
        .from('storages')
        .select('*')
        .eq('user_id', activeUid);

      setStorageUnitsList(
        storages
          ? storages.map((s: any) => ({
              id: s.id,
              name: s.name,
              spaceId: s.space_id,
              spaceName: s.space_name || '',
              parentId: s.parent_id || null,
              totalItems: s.total_items || 0,
              capacity: s.capacity || 20,
              status: s.status || 'empty',
              imageUrl: s.image_url || undefined,
              compartments: s.compartments || 4,
              type: s.type || 'Closet',
            }))
          : []
      );

      // 4. Fetch Individual Items from DB
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', activeUid);

      setIndividualItemsList(
        items
          ? items.map((i: any) => ({
              id: i.id,
              containerId: i.container_id,
              name: i.name,
              description: i.description || '',
              imageUrl: i.image_url || undefined,
              quantity: i.quantity || 1,
              condition: i.condition || 'Good',
              isSpare: i.is_spare || false,
              itemType: i.item_type || 'item-accessory',
              category: i.category || undefined,
              subCategory: i.sub_category || undefined,
              size: i.size || undefined,
              color: i.color || undefined,
              material: i.material || undefined,
              brand: i.brand || undefined,
            }))
          : []
      );

      // 5. Fetch Notes from DB
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', activeUid);

      setNotesList(
        notes
          ? notes.map((n: any) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              date: n.date || new Date(n.created_at).toLocaleDateString(),
            }))
          : []
      );
    } catch (e) {
      console.warn('Supabase hydration error (falling back to empty lists):', e);
    }
  }, []);

  // established useEffect Auth Check
  useEffect(() => {
    if (!isMounted) return;

    const initSession = async () => {
      try {
        // Enforce 15-day session memory lifespan limit
        const loginTimeStr = localStorage.getItem('moonferret-login-time');
        if (loginTimeStr) {
          const loginTime = parseInt(loginTimeStr);
          const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
          if (Date.now() - loginTime > fifteenDaysInMs) {
            // Expired! Sign out.
            await supabase.auth.signOut();
            localStorage.removeItem('moonferret-login-time');
            setSession(null);
            setUserId(null);
            setAuthLoading(false);
            return;
          }
        }

        const { data: { session: activeSession } } = await supabase.auth.getSession();
        setSession(activeSession);
        if (activeSession?.user) {
          setUserId(activeSession.user.id);
          fetchDashboardData(activeSession.user.id);
        }
      } catch (err) {
        console.warn('Auth session check fail:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initSession();

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        setUserId(currentSession.user.id);
        fetchDashboardData(currentSession.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isMounted, fetchDashboardData]);

  // CRUD: Space mutations
  const handleAddSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceNameInput.trim()) return;

    const newId = spaceNameInput.toLowerCase().replace(/\s+/g, '-');
    if (spacesList.some(s => s.id === newId)) return;

    const newSpace: Space = {
      id: newId,
      name: spaceNameInput.trim(),
      slug: newId,
      icon: 'Folder',
      description: spaceDescInput.trim() || `Tracked container in custom room ${spaceNameInput}`,
      imageCount: spaceQtyInput,
      dimensions: spaceDimInput.trim() || undefined,
    };

    if (spaceImageInput) {
      newSpace.imageUrl = spaceImageInput;
    }

    setSpacesList(prev => [...prev, newSpace]);

    if (userId) {
      try {
        const { error } = await supabase.from('spaces').insert({
          id: newSpace.id,
          name: newSpace.name,
          description: newSpace.description,
          image_count: newSpace.imageCount,
          image_url: newSpace.imageUrl || null,
          dimensions: newSpace.dimensions || null,
          user_id: userId
        });
        if (error) throw error;
      } catch (err) {
        console.error('Supabase space insert fail:', err);
      }
    }

    setSpaceNameInput('');
    setSpaceDescInput('');
    setSpaceQtyInput(2);
    setSpaceDimInput('');
    setSpaceImageInput(null);
    setIsAddSpaceOpen(false);
  };

  const handleUpdateSpace = async (id: string, updatedFields: Partial<Space>) => {
    setSpacesList(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));

    if (userId) {
      try {
        const { error } = await supabase.from('spaces').update({
          name: updatedFields.name,
          description: updatedFields.description,
          dimensions: updatedFields.dimensions,
          image_url: updatedFields.imageUrl
        }).eq('id', id).eq('user_id', userId);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase space update fail:', err);
      }
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSpaceUploading(true);
      const url = await uploadImageToStorage(file, 'spaces');
      if (url) {
        setSpaceImageInput(url);
      }
      setIsSpaceUploading(false);
    }
  };

  const handleDeleteSpace = async (id: string) => {
    setSpacesList(prev => prev.filter(s => s.id !== id));
    if (activeView === id) {
      handleSidebarNavigate('dashboard');
    }

    if (userId) {
      try {
        const { error: spaceError } = await supabase.from('spaces').delete().eq('id', id).eq('user_id', userId);
        if (spaceError) throw spaceError;
        // Cascades to delete nested storage units inside DB
        const { error: storageError } = await supabase.from('storages').delete().eq('space_id', id).eq('user_id', userId);
        if (storageError) throw storageError;
      } catch (err) {
        console.error('Supabase space delete fail:', err);
      }
    }
  };

  // CRUD for Quick Notes saving to DB
  const handleSaveQuickNote = async (text: string) => {
    const newNote = {
      id: `n-${Date.now()}`,
      title: text.split('\n')[0].substring(0, 25) || 'Quick Note',
      body: text,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
    };
    setNotesList(prev => [newNote, ...prev]);
    switchTab('my-notes'); // Automatically slide to My Notes tab to view it!

    if (userId) {
      try {
        const { error } = await supabase.from('notes').insert({
          id: newNote.id,
          title: newNote.title,
          body: newNote.body,
          date: newNote.date,
          user_id: userId
        });
        if (error) throw error;
      } catch (err) {
        console.error('Supabase note insert fail:', err);
      }
    }
  };

  const totalItemsCount = individualItemsList.reduce((acc, item) => acc + item.quantity, 0);
  const totalCapacity = storageUnitsList.reduce((acc, unit) => acc + unit.capacity, 0);
  const utilizationRate = totalCapacity > 0 ? Math.min(100, Math.round((totalItemsCount / totalCapacity) * 100)) : 0;

  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-200/50 animate-pulse" />
          <div className="w-20 h-3 bg-sky-200/30 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Display the Auth Gateway if user session is null
  if (!session) {
    return (
      <AuthGateway 
        onSuccess={(activeSession) => {
          setSession(activeSession);
          if (activeSession?.user) {
            setUserId(activeSession.user.id);
            fetchDashboardData(activeSession.user.id);
          }
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-8">
      {/* Top Header — sky-blue accent banner running edge-to-edge flush with screen top */}
      <Header 
        title="MoonFerret" 
        userName={userName}
        setUserName={setUserName}
        workspaceTitle={workspaceTitle}
        setWorkspaceTitle={setWorkspaceTitle}
        profilePic={profilePic}
        setProfilePic={setProfilePic}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userId={userId}
        onMenuToggle={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Three-Column Layout */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_300px] gap-6 w-full min-w-0">
          {/* Left Sidebar */}
          <Sidebar 
            activeView={activeView} 
            onNavigate={handleSidebarNavigate}
            spaces={spacesList}
            onAddSpaceClick={() => setIsAddSpaceOpen(true)}
            onDeleteSpace={handleDeleteSpace}
            totalItems={totalItemsCount}
            utilization={utilizationRate}
          />

          {/* Center Content Area */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Sub-Navigation Pill Bar — Centered within its track */}
            <div className="flex justify-center w-full">
              <SubNav activeTab={activeTab} onTabChange={switchTab} />
            </div>

            {/* Active View */}
            <MainContent
              activeView={activeView}
              activeTab={activeTab}
              counts={counts}
              onIncrement={increment}
              onDecrement={decrement}
              onNavigateToSpace={handleSidebarNavigate}
              spaces={spacesList}
              activeCarouselIndex={activeCarouselIndex}
              setActiveCarouselIndex={handleCarouselChange}
              storageUnitsList={storageUnitsList}
              setStorageUnitsList={setStorageUnitsList}
              individualItemsList={individualItemsList}
              setIndividualItemsList={setIndividualItemsList}
              notesList={notesList}
              setNotesList={setNotesList}
              searchQuery={searchQuery}
              onUpdateSpace={handleUpdateSpace}
              userId={userId}
              userName={userName}
            />
          </div>

          {/* Right Utility Bar */}
          <UtilityBar 
            activeView={activeView} 
            onSaveNote={handleSaveQuickNote}
            individualItemsList={individualItemsList}
          />
        </div>
      </main>

      {/* Add Space modal form container */}
      <AnimatePresence>
        {isAddSpaceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddSpaceOpen(false)}
            />
            <motion.div 
              className="relative w-full max-w-md bg-card rounded-3xl border border-border-main/40 p-6 shadow-2xl z-10 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
                <h3 className="text-sm font-bold text-primary">Add New Space</h3>
                <button onClick={() => setIsAddSpaceOpen(false)} className="p-1 hover:bg-canvas rounded-full text-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSpaceSubmit} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-secondary">Space Name / Title</label>
                  <input
                    type="text"
                    required
                    value={spaceNameInput}
                    onChange={(e) => setSpaceNameInput(e.target.value)}
                    placeholder="e.g. Backyard Shed..."
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-sky-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-secondary">Space Description / Details</label>
                  <input
                    type="text"
                    value={spaceDescInput}
                    onChange={(e) => setSpaceDescInput(e.target.value)}
                    placeholder="Describe placement or purpose..."
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Quantity of Storages</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10}
                      value={spaceQtyInput}
                      onChange={(e) => setSpaceQtyInput(parseInt(e.target.value) || 2)}
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Size Dimensions (optional)</label>
                    <input
                      type="text"
                      value={spaceDimInput}
                      onChange={(e) => setSpaceDimInput(e.target.value)}
                      placeholder="e.g. 12x10 ft..."
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-secondary">Space Background Image</label>
                  <div className="relative h-9">
                     <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isSpaceUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="absolute inset-0 bg-canvas/30 rounded-xl border border-border-main/40 flex items-center justify-center gap-1.5 hover:bg-canvas/50">
                      <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                      <span className="text-[10px] text-secondary font-medium">
                        {isSpaceUploading ? 'Uploading...' : spaceImageInput ? 'Selected ✅' : 'Choose File'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-main/20 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSpaceOpen(false)}
                    className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSpaceUploading}
                    className="h-8.5 px-4 rounded-full bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSpaceUploading ? 'Uploading...' : 'Create Space'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Drawer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            {/* Drawer Content Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[85vw] h-full bg-card border-r border-border-main/20 p-4 flex flex-col z-10"
            >
              {/* Close Button inside mobile drawer */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-canvas rounded-full text-secondary z-20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <Sidebar
                activeView={activeView}
                onNavigate={(view) => {
                  handleSidebarNavigate(view);
                  setIsMobileSidebarOpen(false); // Auto close drawer on navigation
                }}
                spaces={spacesList}
                onAddSpaceClick={() => {
                  setIsAddSpaceOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                onDeleteSpace={handleDeleteSpace}
                totalItems={totalItemsCount}
                utilization={utilizationRate}
                className="w-full min-w-0 block"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
