'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Minus, FolderOpen, FolderClosed, 
  Shirt, ClipboardList, PenTool, Trash2, 
  CheckCircle2, Circle, Save, Tag, AlertCircle, History, X, Image as ImageIcon 
} from 'lucide-react';
import { Space, StorageUnit, IndividualItem, Outfit } from '@/data/types';
import type { ViewId } from '@/hooks/use-navigation';
import type { SubNavTab } from '@/hooks/use-sub-nav';
import { supabase } from '@/lib/supabase';
import OutfitBuilder from '@/components/modals/outfit-builder';
import DashboardView from '@/components/views/dashboard-view';

interface MainContentProps {
  activeView: ViewId;
  activeTab: SubNavTab;
  counts: Record<string, number>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onNavigateToSpace: (spaceId: ViewId) => void;
  spaces: Space[];
  activeCarouselIndex: number;
  setActiveCarouselIndex: (index: number) => void;
  storageUnitsList: StorageUnit[];
  setStorageUnitsList: React.Dispatch<React.SetStateAction<StorageUnit[]>>;
  individualItemsList: IndividualItem[];
  setIndividualItemsList: React.Dispatch<React.SetStateAction<IndividualItem[]>>;
  notesList: { id: string; title: string; body: string; date: string }[];
  setNotesList: React.Dispatch<React.SetStateAction<{ id: string; title: string; body: string; date: string }[]>>;
  searchQuery: string;
  onUpdateSpace: (id: string, updatedFields: Partial<Space>) => void;
  userId: string | null;
  userName: string;
}

/* ────────────────────────────────────────────────────────
   1. MY OUTFITS VIEW (clothing builder grid & custom cards)
   ──────────────────────────────────────────────────────── */
interface MyOutfitsViewProps {
  items: IndividualItem[];
  setIndividualItemsList: React.Dispatch<React.SetStateAction<IndividualItem[]>>;
  storageUnitsList: StorageUnit[];
  setStorageUnitsList: React.Dispatch<React.SetStateAction<StorageUnit[]>>;
  userId: string | null;
}

function MyOutfitsView({ 
  items, 
  setIndividualItemsList, 
  storageUnitsList, 
  setStorageUnitsList,
  userId
}: MyOutfitsViewProps) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Fetch outfits from Supabase
  useEffect(() => {
    if (!userId) return;

    const fetchOutfits = async () => {
      try {
        const { data: outfitsData, error: outfitsError } = await supabase
          .from('outfits')
          .select('id, name, image_url, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (outfitsError) throw outfitsError;

        const { data: itemsData, error: itemsError } = await supabase
          .from('outfit_items')
          .select('outfit_id, item_id');

        if (itemsError) throw itemsError;

        const compiledOutfits = (outfitsData || []).map((outfit) => {
          const itemIds = (itemsData || [])
            .filter((oi) => oi.outfit_id === outfit.id)
            .map((oi) => oi.item_id);

          return {
            id: outfit.id,
            name: outfit.name,
            imageUrl: outfit.image_url || undefined,
            itemIds,
          };
        });

        setOutfits(compiledOutfits);
      } catch (err) {
        console.error('Error fetching outfits:', err);
      }
    };

    fetchOutfits();
  }, [userId]);

  // CRUD: Save curating outfit
  const handleSaveOutfit = async (outfitData: { name: string; itemIds: string[]; imageUrl?: string }) => {
    const newOutfitId = crypto.randomUUID();
    const newOutfit: Outfit = {
      id: newOutfitId,
      name: outfitData.name,
      itemIds: outfitData.itemIds,
      imageUrl: outfitData.imageUrl,
    };

    setOutfits((prev) => [newOutfit, ...prev]);

    if (userId) {
      try {
        const { error: outfitError } = await supabase.from('outfits').insert({
          id: newOutfitId,
          name: outfitData.name,
          image_url: outfitData.imageUrl || null,
          user_id: userId,
        });
        if (outfitError) throw outfitError;

        const relationRows = outfitData.itemIds.map((itemId) => ({
          outfit_id: newOutfitId,
          item_id: itemId,
        }));

        const { error: relationError } = await supabase.from('outfit_items').insert(relationRows);
        if (relationError) throw relationError;
      } catch (err) {
        console.error('Error saving outfit:', err);
      }
    }
  };

  // CRUD: Delete outfit
  const handleDeleteOutfit = async (id: string) => {
    setOutfits((prev) => prev.filter((o) => o.id !== id));

    if (userId) {
      try {
        const { error: outfitError } = await supabase.from('outfits').delete().eq('id', id).eq('user_id', userId);
        if (outfitError) throw outfitError;
        const { error: relationError } = await supabase.from('outfit_items').delete().eq('outfit_id', id);
        if (relationError) throw relationError;
      } catch (err) {
        console.error('Error deleting outfit:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-base font-bold text-primary">Outfit Builder</h2>
          <p className="text-xs text-secondary">Construct custom clothing sets by pairing logged items</p>
        </div>
        <button
          onClick={() => setIsBuilderOpen(true)}
          className="h-8 px-4 bg-brand text-brand-foreground rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Shirt className="w-3.5 h-3.5" />
          Create Outfit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {outfits.map((outfit) => (
          <div key={outfit.id} className="bg-card rounded-2xl border border-border-main/20 p-4.5 shadow-sm space-y-3 relative group overflow-hidden">
            <button
              onClick={() => handleDeleteOutfit(outfit.id)}
              className="absolute top-4 right-4 z-20 p-1 bg-white hover:bg-rose-50 rounded-full border border-border-main/20 shadow-md text-stone-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Delete outfit"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Cover image if available */}
            {outfit.imageUrl ? (
              <div className="h-32 w-full rounded-xl overflow-hidden bg-canvas border border-border-main/10 relative z-0">
                <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-32 w-full rounded-xl overflow-hidden bg-gradient-to-tr from-brand/20 to-brand/5 border border-border-main/10 flex items-center justify-center relative z-0">
                <Shirt className="w-8 h-8 text-brand/30" />
              </div>
            )}

            <div className="relative z-10 font-sans">
              <h4 className="text-xs font-bold text-primary pr-6 truncate">{outfit.name}</h4>
              <p className="text-[9px] text-secondary mt-0.5 uppercase tracking-wider font-semibold">
                Custom Set
              </p>
            </div>

            {/* Overlapping dynamic stacked preview config */}
            <div className="flex -space-x-3 overflow-hidden py-1">
              {outfit.itemIds.slice(0, 5).map((itemId, idx) => {
                const matchedItem = items.find((i) => i.id === itemId);
                if (!matchedItem || !matchedItem.imageUrl) return null;
                return (
                  <div 
                    key={idx} 
                    className="w-8 h-8 rounded-full border-2 border-card overflow-hidden shrink-0 relative shadow-sm ring-1 ring-border-main/25"
                    title={matchedItem.name}
                  >
                    <img 
                      src={matchedItem.imageUrl} 
                      alt={matchedItem.name} 
                      className={
                        matchedItem.imageUrl.endsWith('#contain')
                          ? 'max-w-full max-h-full object-contain w-auto h-auto rounded-lg absolute inset-0 m-auto'
                          : 'w-full h-full object-cover'
                      } 
                    />
                  </div>
                );
              })}
              {outfit.itemIds.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-card bg-canvas flex items-center justify-center text-[9px] font-black text-secondary shrink-0 shadow-sm ring-1 ring-border-main/25 select-none font-mono">
                  +{outfit.itemIds.length - 5}
                </div>
              )}
            </div>
          </div>
        ))}

        {outfits.length === 0 && (
          <div className="col-span-full py-16 text-center text-secondary text-xs bg-canvas/30 rounded-2xl border border-dashed border-border-main/20">
            No curated looks saved yet. Click 'Create Outfit' to design one!
          </div>
        )}
      </div>

      <OutfitBuilder 
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleSaveOutfit}
        allItems={items}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   2. MY NOTES VIEW (notes board grid & custom workspace)
   ──────────────────────────────────────────────────────── */
interface MyNotesViewProps {
  notes: { id: string; title: string; body: string; date: string }[];
  setNotes: React.Dispatch<React.SetStateAction<{ id: string; title: string; body: string; date: string }[]>>;
  userId: string | null;
}

function MyNotesView({ notes, setNotes, userId }: MyNotesViewProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorBody, setEditorBody] = useState('');

  const loadNote = (note: typeof notes[0]) => {
    setActiveNoteId(note.id);
    setEditorTitle(note.title);
    setEditorBody(note.body);
  };

  const handleSave = async () => {
    if (!editorTitle.trim() || !editorBody.trim()) return;

    if (activeNoteId) {
      setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, title: editorTitle, body: editorBody } : n));
      
      if (userId) {
        try {
          const { error } = await supabase.from('notes').update({
            title: editorTitle.trim(),
            body: editorBody.trim(),
          }).eq('id', activeNoteId).eq('user_id', userId);
          if (error) throw error;
        } catch (err) {
          console.error('Error updating note:', err);
        }
      }
    } else {
      const newId = `n-${Date.now()}`;
      const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
      const newNote = {
        id: newId,
        title: editorTitle.trim(),
        body: editorBody.trim(),
        date: dateStr
      };
      setNotes(prev => [newNote, ...prev]);
      setActiveNoteId(newId);

      if (userId) {
        try {
          const { error } = await supabase.from('notes').insert({
            id: newId,
            title: editorTitle.trim(),
            body: editorBody.trim(),
            date: dateStr,
            user_id: userId
          });
          if (error) throw error;
        } catch (err) {
          console.error('Error creating note:', err);
        }
      }
    }
  };

  const createNew = () => {
    setActiveNoteId(null);
    setEditorTitle('');
    setEditorBody('');
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) {
      createNew();
    }

    if (userId) {
      try {
        const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;
      } catch (err) {
        console.error('Error deleting note:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-primary">Notes Workspace</h2>
          <p className="text-xs text-secondary">Organize and manage personal memos and space inventory audits</p>
        </div>
        <button
          onClick={createNew}
          className="h-8 px-3.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          New Note
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left: Notes Grid Column */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => loadNote(note)}
              className={`w-full text-left p-4 bg-card rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-sm flex flex-col justify-between ${
                activeNoteId === note.id ? 'border-sky-400 bg-sky-500/5' : 'border-border-main/30'
              }`}
            >
              <div className="w-full">
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-primary truncate pr-4">{note.title}</h4>
                  <span 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="text-secondary/40 hover:text-rose-500 p-0.5 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                </div>
                <p className="text-[11px] text-secondary mt-1.5 line-clamp-2 leading-relaxed">{note.body}</p>
              </div>
              <span className="text-[9px] text-secondary/60 mt-3 font-semibold block">{note.date}</span>
            </button>
          ))}
        </div>

        {/* Right: Rich Workspace Texteditor */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border-main/40 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-sky-500" />
              Editor Panel
            </span>
            <button
              onClick={handleSave}
              className="h-7 px-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold transition-all flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Save Note
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Note Title..."
              value={editorTitle}
              onChange={(e) => setEditorTitle(e.target.value)}
              className="w-full h-8.5 px-3 text-xs bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-sky-300 font-bold"
            />
            <textarea
              placeholder="Type your notes body content here..."
              value={editorBody}
              onChange={(e) => setEditorBody(e.target.value)}
              rows={8}
              className="w-full bg-canvas/30 p-4 text-xs text-primary placeholder:text-secondary/40 border border-border-main/40 focus:outline-none focus:bg-white focus:border-sky-300 rounded-2xl resize-none transition-all leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   3. TODO LIST VIEW (tasks state + completedTasksHistory state)
   ──────────────────────────────────────────────────────── */
const initialTodos = [
  { id: 't-1', text: 'Reallocate USB cables to living room cabinet', spaceId: 'living-room', priority: 'Medium', done: false },
  { id: 't-2', text: 'Check TV console battery replacement', spaceId: 'living-room', priority: 'Low', done: false },
  { id: 't-3', text: 'Refill liquid hand soap in comfort room vanity', spaceId: 'comfort-room', priority: 'High', done: true },
  { id: 't-4', text: 'Clean and reorganize the upper kitchen cabinets', spaceId: 'kitchen', priority: 'High', done: false },
];

function TodoListView({ spaces }: { spaces: Space[] }) {
  const [todos, setTodos] = useState(initialTodos);
  
  // Lift history state tracker
  const [completedTasksHistory, setCompletedTasksHistory] = useState<typeof initialTodos>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [newTodo, setNewTodo] = useState('');
  const [todoSpace, setTodoSpace] = useState('dashboard');
  const [todoPriority, setTodoPriority] = useState('Medium');

  const toggleTodo = (id: string) => {
    // If checking off a task, append it to completedTasksHistory instead of hard-delete
    setTodos(prev => {
      const match = prev.find(t => t.id === id);
      if (match) {
        const nextDone = !match.done;
        
        if (nextDone) {
          // Add to history after small animation lag
          setCompletedTasksHistory(hist => [...hist, { ...match, done: true }]);
          return prev.filter(t => t.id !== id);
        }
      }
      return prev;
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos(prev => [
      ...prev,
      { 
        id: `t-${Date.now()}`, 
        text: newTodo.trim(), 
        spaceId: todoSpace, 
        priority: todoPriority, 
        done: false 
      }
    ]);
    setNewTodo('');
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'High':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'Medium':
        return 'bg-sky-500/10 text-sky-600 border-sky-400/20';
      default:
        return 'bg-stone-500/10 text-stone-500 border-stone-500/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-primary">Task Tracker</h2>
          <p className="text-xs text-secondary">Manage and organize tasks across spaces with priority tagging</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="h-7 px-3 rounded-full border border-border-main/30 hover:bg-canvas text-secondary text-[10px] font-bold transition-all flex items-center gap-1"
        >
          <History className="w-3.5 h-3.5" />
          {showHistory ? 'Hide History' : 'View Task History'}
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border-main/40 p-5 space-y-4 shadow-sm">
        {/* Creation form */}
        <form onSubmit={handleAdd} className="space-y-3 pb-3 border-b border-border-main/20">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add new custom task..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="flex-1 h-9 px-4 text-xs bg-canvas/30 rounded-full border border-border-main/40 focus:outline-none focus:bg-white focus:border-sky-300"
            />
            <button
              type="submit"
              disabled={!newTodo.trim()}
              className="h-9 px-4 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center disabled:opacity-40"
            >
              Add Task
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-secondary font-semibold">Assign Space:</span>
              <select
                value={todoSpace}
                onChange={(e) => setTodoSpace(e.target.value)}
                className="h-7 px-2.5 rounded-full bg-canvas border border-border-main/30 text-xs text-primary focus:outline-none focus:border-sky-300"
              >
                <option value="dashboard">Global (No Space)</option>
                {spaces.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-secondary font-semibold">Priority:</span>
              <select
                value={todoPriority}
                onChange={(e) => setTodoPriority(e.target.value)}
                className="h-7 px-2.5 rounded-full bg-canvas border border-border-main/30 text-xs text-primary focus:outline-none focus:border-sky-300"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </form>

        {/* Task lists container */}
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {/* Active Todos */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest">Active Tasks ({todos.length})</h4>
            {todos.map((todo) => {
              const matchedSpace = spaces.find(s => s.id === todo.spaceId);
              return (
                <div
                  key={todo.id}
                  className="p-3.5 rounded-2xl border border-border-main/30 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex items-center justify-between gap-3 hover:scale-[1.005] transition-all"
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="flex items-center gap-3 text-left min-w-0"
                  >
                    <Circle className="w-4 h-4 text-secondary/60 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-primary truncate block">
                        {todo.text}
                      </span>
                      <div className="flex gap-1.5 items-center mt-1">
                        {matchedSpace && (
                          <span className="text-[8px] font-bold text-secondary bg-canvas px-2.5 py-0.5 rounded-full border border-border-main/20">
                            {matchedSpace.name}
                          </span>
                        )}
                        <span className={`text-[8px] font-bold uppercase border px-2 py-0.5 rounded-full ${getPriorityBadge(todo.priority)}`}>
                          {todo.priority}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Faded History Tracker */}
          {showHistory && completedTasksHistory.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-dashed border-border-main/30">
              <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest">Completed History ({completedTasksHistory.length})</h4>
              <div className="space-y-2 opacity-50">
                {completedTasksHistory.map((todo) => {
                  const matchedSpace = spaces.find(s => s.id === todo.spaceId);
                  return (
                    <div
                      key={todo.id}
                      className="p-3 rounded-2xl border border-border-main/10 bg-canvas/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 text-left min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-secondary line-through truncate block">
                            {todo.text}
                          </span>
                          <div className="flex gap-1.5 items-center mt-0.5">
                            {matchedSpace && (
                              <span className="text-[7px] font-bold text-secondary bg-canvas px-1.5 py-0.5 rounded border border-border-main/15">
                                {matchedSpace.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   4. ROUTER MAIN COMPOSITION
   ──────────────────────────────────────────────────────── */
export default function MainContent({ 
  activeView, 
  activeTab, 
  counts, 
  onIncrement, 
  onDecrement,
  onNavigateToSpace,
  spaces,
  activeCarouselIndex,
  setActiveCarouselIndex,
  storageUnitsList,
  setStorageUnitsList,
  individualItemsList,
  setIndividualItemsList,
  notesList,
  setNotesList,
  searchQuery,
  onUpdateSpace,
  userId,
  userName
}: MainContentProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + '-' + activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          {activeTab === 'my-items' && (
            <DashboardView 
              spaces={spaces}
              activeCarouselIndex={activeCarouselIndex}
              setActiveCarouselIndex={setActiveCarouselIndex}
              storageUnitsList={storageUnitsList}
              setStorageUnitsList={setStorageUnitsList}
              individualItemsList={individualItemsList}
              setIndividualItemsList={setIndividualItemsList}
              searchQuery={searchQuery}
              onUpdateSpace={onUpdateSpace}
              userId={userId}
              userName={userName}
            />
          )}
          {activeTab === 'my-items' ? null : (
            <div className="glass-liquid rounded-2xl p-6 font-sans">
              {activeTab === 'my-outfits' && (
                <MyOutfitsView 
                  items={individualItemsList} 
                  setIndividualItemsList={setIndividualItemsList}
                  storageUnitsList={storageUnitsList}
                  setStorageUnitsList={setStorageUnitsList}
                  userId={userId}
                />
              )}
              {activeTab === 'my-notes' && <MyNotesView notes={notesList} setNotes={setNotesList} userId={userId} />}
              {activeTab === 'todo-list' && <TodoListView spaces={spaces} />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
