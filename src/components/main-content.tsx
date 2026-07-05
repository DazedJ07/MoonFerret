'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Minus, FolderOpen, FolderClosed, 
  Shirt, ClipboardList, PenTool, Trash2, 
  CheckCircle2, Circle, Save, Tag, AlertCircle, History, X, Image as ImageIcon 
} from 'lucide-react';
import DashboardView, { type IndividualItem, type StorageUnit } from '@/components/views/dashboard-view';
import type { Space } from '@/data/mock-data';
import type { ViewId } from '@/hooks/use-navigation';
import type { SubNavTab } from '@/hooks/use-sub-nav';

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
}

function MyOutfitsView({ 
  items, 
  setIndividualItemsList, 
  storageUnitsList, 
  setStorageUnitsList 
}: MyOutfitsViewProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [outfitName, setOutfitName] = useState('');
  
  const initialOutfits = [
    { id: 'o-1', name: 'Smart Casual Autumn', items: ['Classic Blue Oxford Shirt', 'Charcoal Wool Trouser', 'Minimalist White Sneakers'] },
    { id: 'o-2', name: 'Winter Layered Classic', items: ['Pure Cashmere Cream Sweater', 'Slim Fit Indigo Jeans', 'Over-sized Beige Trench Coat', 'Minimalist White Sneakers'] }
  ];
  const [outfits, setOutfits] = useState(initialOutfits);

  // Quick Clothing add form modal states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickCond, setQuickCond] = useState<'Mint' | 'Good' | 'Worn'>('Good');
  const [quickImage, setQuickImage] = useState<string | null>(null);

  // Filter items that qualify as clothing/apparel (e.g. Shirts, Pants, Shoes, Sweaters, Coats)
  const apparelItems = items.filter(item => 
    item.imageUrl && (
      item.name.toLowerCase().includes('shirt') ||
      item.name.toLowerCase().includes('trouser') ||
      item.name.toLowerCase().includes('sneakers') ||
      item.name.toLowerCase().includes('coat') ||
      item.name.toLowerCase().includes('jeans') ||
      item.name.toLowerCase().includes('sweater') ||
      item.name.toLowerCase().includes('shoes') ||
      item.name.toLowerCase().includes('jacket')
    )
  );

  const toggleSelect = (name: string) => {
    setSelectedItems(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const handleCompile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitName.trim() || selectedItems.length === 0) return;
    const newOutfit = {
      id: `o-${Date.now()}`,
      name: outfitName.trim(),
      items: [...selectedItems]
    };
    setOutfits(prev => [newOutfit, ...prev]);
    setOutfitName('');
    setSelectedItems([]);
  };

  const handleDelete = (id: string) => {
    setOutfits(prev => prev.filter(o => o.id !== id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setQuickImage(url);
    }
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    // Use Main Clothes Cabinet (su-1) as default storage container for quick wardrobe clothes
    const newClothingItem: IndividualItem = {
      id: `ii-${Date.now()}`,
      containerId: 'su-1', 
      name: quickName.trim(),
      description: quickDesc.trim() || 'Fast track wardrobe item',
      imageUrl: quickImage || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80',
      quantity: 1,
      condition: quickCond,
      isSpare: false
    };

    setIndividualItemsList(prev => [...prev, newClothingItem]);
    setSelectedItems(prev => [...prev, newClothingItem.name]);

    // Update parent storage stats
    setStorageUnitsList(prev => prev.map(unit => {
      if (unit.id === 'su-1') {
        const nextTotal = unit.totalItems + 1;
        return {
          ...unit,
          totalItems: nextTotal,
          status: nextTotal >= unit.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
        };
      }
      return unit;
    }));

    setQuickName('');
    setQuickDesc('');
    setQuickCond('Good');
    setQuickImage(null);
    setIsQuickAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-base font-bold text-primary">Outfit Builder</h2>
          <p className="text-xs text-secondary">Construct custom clothing sets by selecting logged items</p>
        </div>
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="h-8 px-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Clothes Shortcut
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Clothing Checklist Selection */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border-main/40 p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
            <Shirt className="w-3.5 h-3.5 text-sky-500" />
            Clothing Wardrobe Checklist
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {apparelItems.map((item) => {
              const isChecked = selectedItems.includes(item.name);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleSelect(item.name)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${
                    isChecked
                      ? 'border-sky-400 bg-sky-500/5 shadow-sm'
                      : 'border-border-main/30 bg-canvas/10 hover:bg-canvas/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-canvas overflow-hidden shrink-0 border border-border-main/20">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary truncate">{item.name}</p>
                      <p className="text-[9px] text-secondary mt-0.5 uppercase tracking-widest font-semibold">{item.condition}</p>
                    </div>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isChecked ? 'border-sky-500 bg-sky-500 text-white' : 'border-border-main/40'
                  }`}>
                    {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Outfit compilation form */}
          <form onSubmit={handleCompile} className="pt-3 border-t border-border-main/30 space-y-3">
            {/* Fine-grained modification tags display */}
            {selectedItems.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Drafting Look Components:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItems.map((name) => (
                    <span 
                      key={name}
                      className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-600 border border-sky-400/20 px-3 py-1 rounded-full text-[10px] font-bold"
                    >
                      {name}
                      <button 
                        type="button" 
                        onClick={() => toggleSelect(name)}
                        className="hover:text-rose-500 text-sky-600/60 hover:text-rose-500 p-0.5 rounded-full transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Name this look (e.g. Evening Out)..."
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                className="flex-1 h-9 px-4 text-xs bg-canvas/30 rounded-full border border-border-main/40 focus:outline-none focus:bg-white focus:border-sky-300 font-medium"
              />
              <button
                type="submit"
                disabled={!outfitName.trim() || selectedItems.length === 0}
                className="h-9 px-4 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Save Look
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Dynamic Outfits Cards with Overlapping stacked images */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5 text-sky-500" />
            Saved Outfits ({outfits.length})
          </h3>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {outfits.map((outfit) => (
              <div key={outfit.id} className="bg-card rounded-2xl border border-border-main/40 p-4.5 shadow-sm space-y-3 relative group">
                <button
                  onClick={() => handleDelete(outfit.id)}
                  className="absolute top-4 right-4 text-secondary/40 hover:text-rose-500 transition-colors"
                  aria-label="Delete outfit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div>
                  <h4 className="text-xs font-bold text-primary pr-6">{outfit.name}</h4>
                  <p className="text-[9px] text-secondary mt-0.5 uppercase tracking-wider font-semibold">Custom Set</p>
                </div>

                {/* Overlapping dynamic stacked preview configuration */}
                <div className="flex -space-x-3 overflow-hidden py-1">
                  {outfit.items.map((itemName, idx) => {
                    const matchedItem = items.find(i => i.name === itemName);
                    if (!matchedItem || !matchedItem.imageUrl) return null;
                    return (
                      <div 
                        key={idx} 
                        className="w-10 h-10 rounded-full border-2 border-card overflow-hidden shrink-0 relative shadow-sm ring-1 ring-border-main/20"
                      >
                        <img 
                          src={matchedItem.imageUrl} 
                          alt={itemName} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Add Clothing Modal */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickAddOpen(false)}
            />
            <motion.div 
              className="relative w-full max-w-md bg-card rounded-3xl border border-border-main/40 p-6 shadow-2xl z-10 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
                <h3 className="text-sm font-bold text-primary">Quick Add Wardrobe Apparel</h3>
                <button onClick={() => setIsQuickAddOpen(false)} className="p-1 hover:bg-canvas rounded-full text-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickAddSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-secondary">Apparel Item Name</label>
                  <input
                    type="text"
                    required
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="e.g. Pure Cashmere Cream Sweater..."
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-sky-300 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-secondary">Description / Details</label>
                  <input
                    type="text"
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    placeholder="e.g. Cream knit, luxury cashmere fiber..."
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Condition Rating</label>
                    <select
                      value={quickCond}
                      onChange={(e) => setQuickCond(e.target.value as any)}
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white font-medium"
                    >
                      <option value="Mint">Mint / New</option>
                      <option value="Good">Good / Used</option>
                      <option value="Worn">Worn / Mending</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Apparel Thumbnail Picture</label>
                    <div className="relative h-9">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="absolute inset-0 bg-canvas/30 rounded-xl border border-border-main/40 flex items-center justify-center gap-1.5 hover:bg-canvas/50">
                        <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] text-secondary font-medium">
                          {quickImage ? 'Selected ✅' : 'Choose File'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-main/20 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8.5 px-4 rounded-full bg-sky-500 text-white font-bold hover:bg-sky-600 shadow-sm"
                  >
                    Add Clothing Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   2. MY NOTES VIEW (notes board grid & custom workspace)
   ──────────────────────────────────────────────────────── */
interface MyNotesViewProps {
  notes: { id: string; title: string; body: string; date: string }[];
  setNotes: React.Dispatch<React.SetStateAction<{ id: string; title: string; body: string; date: string }[]>>;
}

function MyNotesView({ notes, setNotes }: MyNotesViewProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorBody, setEditorBody] = useState('');

  const loadNote = (note: typeof notes[0]) => {
    setActiveNoteId(note.id);
    setEditorTitle(note.title);
    setEditorBody(note.body);
  };

  const handleSave = () => {
    if (!editorTitle.trim() || !editorBody.trim()) return;

    if (activeNoteId) {
      setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, title: editorTitle, body: editorBody } : n));
    } else {
      const newNote = {
        id: `n-${Date.now()}`,
        title: editorTitle,
        body: editorBody,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
      };
      setNotes(prev => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    }
  };

  const createNew = () => {
    setActiveNoteId(null);
    setEditorTitle('');
    setEditorBody('');
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) {
      createNew();
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
            <div className="bg-card rounded-2xl border border-border-main/40 p-6 shadow-sm font-sans">
              {activeTab === 'my-outfits' && (
                <MyOutfitsView 
                  items={individualItemsList} 
                  setIndividualItemsList={setIndividualItemsList}
                  storageUnitsList={storageUnitsList}
                  setStorageUnitsList={setStorageUnitsList}
                />
              )}
              {activeTab === 'my-notes' && <MyNotesView notes={notesList} setNotes={setNotesList} />}
              {activeTab === 'todo-list' && <TodoListView spaces={spaces} />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
