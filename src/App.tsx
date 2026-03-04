import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO,
  isToday
} from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Settings as SettingsIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  ExternalLink,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Smartphone,
  SmartphoneNfc,
  Clock,
  StickyNote,
  CheckSquare,
  Moon,
  Sun,
  Monitor,
  Briefcase,
  User,
  HeartPulse,
  Users,
  AlertCircle,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { CalendarItem, AppSettings, EventCategory } from './types';
import { loadItems, saveItems, loadSettings, saveSettings } from './utils/storage';
import { cn } from './utils/cn';

export default function App() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null);
  const [showQuickTip, setShowQuickTip] = useState(true);

  // Form state
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<CalendarItem['type']>('todo');
  const [newItemEventCategory, setNewItemEventCategory] = useState<EventCategory>('other');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemLinks, setNewItemLinks] = useState<string[]>([]);
  const [newItemLinkInput, setNewItemLinkInput] = useState('');
  const [newItemTime, setNewItemTime] = useState('');
  const [notifyOnAdd, setNotifyOnAdd] = useState(false);
  const [notifyNowMsg, setNotifyNowMsg] = useState('Hello from Kyah!');

  useEffect(() => {
    setItems(loadItems());
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = settings.theme === 'system' ? systemTheme : settings.theme;
    
    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveSettings(settings);
  }, [settings]);

  const itemsForSelectedDate = useMemo(() => {
    return items.filter(item => isSameDay(parseISO(item.date), selectedDate));
  }, [items, selectedDate]);

  const handleAddOrUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const itemData: CalendarItem = {
      id: editingItem?.id || crypto.randomUUID(),
      title: newItemTitle,
      type: newItemType,
      eventCategory: newItemType === 'event' ? newItemEventCategory : undefined,
      description: newItemDesc,
      links: newItemLinks,
      date: format(selectedDate, 'yyyy-MM-dd'),
      completed: editingItem?.completed || false,
      time: newItemTime || undefined,
      notifyOnAdd: notifyOnAdd,
    };

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? itemData : i));
    } else {
      setItems([...items, itemData]);
      if (settings.notificationsEnabled) {
        if (settings.soundEnabled) playNotificationSound();
        if (notifyOnAdd) {
          sendNotification(`Task Added: ${newItemTitle}`, newItemDesc || 'Check your calendar for details.');
        }
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setNewItemTitle('');
    setNewItemType('todo');
    setNewItemEventCategory('other');
    setNewItemDesc('');
    setNewItemLinks([]);
    setNewItemLinkInput('');
    setNewItemTime('');
    setNotifyOnAdd(false);
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const sendNotification = (title: string, body: string) => {
    if (!settings.notificationsEnabled) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  };

  const handleNotifyNow = () => {
    sendNotification('Kyah Alert', notifyNowMsg);
    if (settings.soundEnabled) playNotificationSound();
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const toggleComplete = (id: string) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const newCompleted = !i.completed;
        if (newCompleted && settings.vibrationEnabled) {
          navigator.vibrate?.(50);
        }
        return { ...i, completed: newCompleted };
      }
      return i;
    }));
  };

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  };

  const renderHeader = () => {
    return (
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center text-white dark:text-zinc-900">
            <CalendarIcon size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Kyah</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "MMMM yyyy";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const hasItems = items.some(item => isSameDay(parseISO(item.date), cloneDay));
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative h-14 sm:h-20 border-r border-b border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center cursor-pointer transition-all",
              !isCurrentMonth ? "text-zinc-300 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
              isSelected && "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white ring-2 ring-inset ring-zinc-900 dark:ring-zinc-100 z-10"
            )}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className={cn(
              "text-sm font-medium",
              isToday(day) && !isSelected && "text-zinc-900 dark:text-zinc-100 font-bold underline underline-offset-4"
            )}>
              {formattedDate}
            </span>
            {hasItems && (
              <div className={cn(
                "absolute bottom-2 w-1 h-1 rounded-full",
                isSelected ? "bg-white dark:bg-zinc-900" : "bg-zinc-400 dark:bg-zinc-500"
              )} />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{format(currentMonth, dateFormat)}</h2>
          <div className="flex gap-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-2 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400">
              Today
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {d}
            </div>
          ))}
        </div>
        <div>{rows}</div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{format(selectedDate, 'EEEE')}</h2>
            <p className="text-zinc-500 dark:text-zinc-400">{format(selectedDate, 'MMMM d, yyyy')}</p>
          </div>
          <button 
            onClick={() => setIsAddingItem(true)}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {itemsForSelectedDate.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
              <CheckSquare size={48} strokeWidth={1} className="mb-2 opacity-20" />
              <p>No tasks for this day</p>
            </div>
          ) : (
            itemsForSelectedDate.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((item) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className={cn(
                  "group p-4 rounded-2xl border transition-all flex items-start gap-4",
                  item.completed 
                    ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <button 
                  onClick={() => toggleComplete(item.id)}
                  className={cn(
                    "mt-1 transition-colors",
                    item.completed ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700 hover:text-zinc-400 dark:hover:text-zinc-600"
                  )}
                >
                  {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      item.type === 'todo' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : 
                      item.type === 'event' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" : 
                      "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}>
                      {item.type === 'event' && item.eventCategory ? `${item.type}: ${item.eventCategory}` : item.type}
                    </span>
                    {item.time && (
                      <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        <Clock size={12} />
                        {item.time}
                      </div>
                    )}
                  </div>
                  <h3 className={cn(
                    "font-semibold text-zinc-900 dark:text-zinc-100 truncate",
                    item.completed && "line-through text-zinc-400 dark:text-zinc-600"
                  )}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {item.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.links.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.startsWith('http') ? link : `https://${link}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <ExternalLink size={12} />
                          <span className="max-w-[120px] truncate">{link.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingItem(item);
                      setNewItemTitle(item.title);
                      setNewItemType(item.type);
                      setNewItemEventCategory(item.eventCategory || 'other');
                      setNewItemDesc(item.description || '');
                      setNewItemLinks(item.links);
                      setNewItemTime(item.time || '');
                      setNotifyOnAdd(item.notifyOnAdd || false);
                      setIsAddingItem(true);
                    }}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
                  >
                    <Plus size={18} className="rotate-45" />
                  </button>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-zinc-400 dark:text-zinc-600 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900 dark:selection:bg-zinc-100 selection:text-white dark:selection:text-zinc-900 transition-colors">
      {renderHeader()}

      <main className="max-w-5xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex flex-col gap-6">
          {renderCalendar()}
          
          <AnimatePresence>
            {showQuickTip && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-zinc-900 dark:bg-zinc-100 rounded-2xl p-6 text-white dark:text-zinc-900 shadow-lg overflow-hidden relative"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold">Quick Tip</h3>
                    <button 
                      onClick={() => setShowQuickTip(false)}
                      className="p-1 hover:bg-white/10 dark:hover:bg-black/10 rounded-lg transition-colors"
                    >
                      <Plus size={18} className="rotate-45" />
                    </button>
                  </div>
                  <p className="text-zinc-400 dark:text-zinc-600 text-sm leading-relaxed pr-8">
                    Kyah works completely offline. Your data is stored locally in your browser and never leaves your device.
                  </p>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 dark:bg-black/5 rounded-full blur-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-5">
          {renderDayView()}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto p-8 mt-8 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center text-white dark:text-zinc-900">
                <CalendarIcon size={16} />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Kyah</h2>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
              A minimalist, offline-first productivity tool designed to help you organize your life without compromising your privacy. No accounts, no tracking, just your time, well-spent.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-4">
            <div className="flex gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Privacy First</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Offline Ready</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">No Login</span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              © {new Date().getFullYear()} Kyah Task Calendar. Built for focus.
            </p>
          </div>
        </div>
      </footer>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingItem ? 'Edit Item' : 'New Item'}</h2>
                <button onClick={resetForm} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <Plus size={24} className="rotate-45 text-zinc-400 dark:text-zinc-500" />
                </button>
              </div>
              
              <form onSubmit={handleAddOrUpdateItem} className="p-6 flex flex-col gap-5">
                <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <LayoutGroup id="type-tabs">
                    {(['todo', 'event', 'note'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewItemType(type)}
                        className={cn(
                          "relative flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 z-10",
                          newItemType === type ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                      >
                        {newItemType === type && (
                          <motion.div 
                            layoutId="active-tab"
                            className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-sm -z-10"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                        {type === 'todo' && <CheckSquare size={14} />}
                        {type === 'event' && <Clock size={14} />}
                        {type === 'note' && <StickyNote size={14} />}
                        {type}
                      </button>
                    ))}
                  </LayoutGroup>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={newItemType}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {newItemType === 'event' && (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">Event Category</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['work', 'personal', 'health', 'social', 'urgent', 'other'] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setNewItemEventCategory(cat)}
                              className={cn(
                                "py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all border flex items-center justify-center gap-1.5",
                                newItemEventCategory === cat 
                                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent" 
                                  : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                              )}
                            >
                              {cat === 'work' && <Briefcase size={12} />}
                              {cat === 'personal' && <User size={12} />}
                              {cat === 'health' && <HeartPulse size={12} />}
                              {cat === 'social' && <Users size={12} />}
                              {cat === 'urgent' && <AlertCircle size={12} />}
                              {cat === 'other' && <Hash size={12} />}
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">Title</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder={newItemType === 'todo' ? "What needs to be done?" : newItemType === 'event' ? "What's happening?" : "Note title..."}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all dark:text-zinc-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">Date</label>
                        <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-xl text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                          {format(selectedDate, 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">Time (Optional)</label>
                        <input 
                          type="time" 
                          value={newItemTime}
                          onChange={(e) => setNewItemTime(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">Description</label>
                      <textarea 
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        placeholder="Add more details..."
                        rows={3}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all resize-none dark:text-zinc-100"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notify on add</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setNotifyOnAdd(!notifyOnAdd)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          notifyOnAdd ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full transition-all",
                          notifyOnAdd ? "left-[22px] bg-white dark:bg-zinc-900" : "left-0.5 bg-white dark:bg-zinc-400"
                        )} />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5 block">Links</label>
                      <div className="flex gap-2 mb-2">
                        <input 
                          type="text" 
                          value={newItemLinkInput}
                          onChange={(e) => setNewItemLinkInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newItemLinkInput.trim()) {
                                setNewItemLinks([...newItemLinks, newItemLinkInput.trim()]);
                                setNewItemLinkInput('');
                              }
                            }
                          }}
                          placeholder="Add a link (e.g. google.com)"
                          className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all text-sm dark:text-zinc-100"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (newItemLinkInput.trim()) {
                              setNewItemLinks([...newItemLinks, newItemLinkInput.trim()]);
                              setNewItemLinkInput('');
                            }
                          }}
                          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {newItemLinks.map((link, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            <span className="max-w-[150px] truncate">{link}</span>
                            <button 
                              type="button"
                              onClick={() => setNewItemLinks(newItemLinks.filter((_, i) => i !== idx))}
                              className="hover:text-red-500"
                            >
                              <Plus size={14} className="rotate-45" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <button 
                  type="submit"
                  className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-lg active:scale-[0.98]"
                >
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <Plus size={24} className="rotate-45 text-zinc-400 dark:text-zinc-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">Preferences</label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors">
                        {settings.notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold">Notifications</p>
                        <p className="text-xs text-zinc-500">Enable system alerts</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        settings.notificationsEnabled ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full transition-all",
                        settings.notificationsEnabled ? "left-7 bg-white dark:bg-zinc-900" : "left-1 bg-white dark:bg-zinc-400"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors">
                        {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold">Sound Effects</p>
                        <p className="text-xs text-zinc-500">Play sound on actions</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        settings.soundEnabled ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full transition-all",
                        settings.soundEnabled ? "left-7 bg-white dark:bg-zinc-900" : "left-1 bg-white dark:bg-zinc-400"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors">
                        {settings.vibrationEnabled ? <SmartphoneNfc size={20} /> : <Smartphone size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold">Haptic Feedback</p>
                        <p className="text-xs text-zinc-500">Vibrate on completion</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        settings.vibrationEnabled ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full transition-all",
                        settings.vibrationEnabled ? "left-7 bg-white dark:bg-zinc-900" : "left-1 bg-white dark:bg-zinc-400"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">Theme</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSettings({ ...settings, theme: t })}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                          settings.theme === t 
                            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                      >
                        {t === 'light' && <Sun size={14} />}
                        {t === 'dark' && <Moon size={14} />}
                        {t === 'system' && <Monitor size={14} />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">Notify Now</label>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      value={notifyNowMsg}
                      onChange={(e) => setNotifyNowMsg(e.target.value)}
                      placeholder="Notification message..."
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-sm dark:text-zinc-100"
                    />
                    <button 
                      onClick={handleNotifyNow}
                      className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Bell size={18} />
                      Send Test Notification
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center">
                    Kyah v1.1.0 • Made with ❤️ for Productivity
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
