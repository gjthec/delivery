import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MenuManager from './components/MenuManager';
import OrderTracker from './components/OrderTracker';
import SalesInsights from './components/SalesInsights';
import ComboAI from './components/ComboAI';
import MenuAI from './components/MenuAI';
import OwnerChat from './components/OwnerChat';
import ClientesFieis from './components/ClientesFieis';
import Satisfacao from './components/Satisfacao';
import Configuracoes from './components/Configuracoes';
import AdminLogin from './components/AdminLogin';
import { AppNotification } from './types';
import { dbGlobalSearch, dbNotifications, GlobalSearchResult } from './services/dbService';
import { authService } from './services/authService';
import {
  Bell, Search, User, Moon, Sun, Settings, LogOut,
  Sparkles, MessageSquare, X, ShoppingBag, Clock, Trash2
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitializedNotificationSoundRef = useRef(false);
  const seenCreatedNotificationIdsRef = useRef<Set<string>>(new Set());

  const isCreatedOrderNotification = (notif: AppNotification) => notif.type === 'created';

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setIsAuthenticated(!!user);
      if (!user) {
        setActiveTab('dashboard');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchResults(await dbGlobalSearch.search(searchTerm));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const unsubscribe = dbNotifications.subscribe((items) => {
      const adminVisibleNotifications = (items as AppNotification[]).filter(isCreatedOrderNotification);
      setNotifications(adminVisibleNotifications);

      const seenIds = seenCreatedNotificationIdsRef.current;
      const unreadCreated = adminVisibleNotifications.filter((n) => !n.read);

      if (!hasInitializedNotificationSoundRef.current) {
        unreadCreated.forEach((n) => seenIds.add(n.id));
        hasInitializedNotificationSoundRef.current = true;
        return;
      }

      const hasNewUnreadCreated = unreadCreated.some((n) => !seenIds.has(n.id));
      unreadCreated.forEach((n) => seenIds.add(n.id));

      if (hasNewUnreadCreated) {
        audioRef.current?.play().catch(() => console.log('Audio playback blocked by browser'));
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchResults([]);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setIsUserMenuOpen(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleSearchResultClick = (result: GlobalSearchResult) => {
    setActiveTab(result.route);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await dbNotifications.markAsRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }

    if (notif.payload?.orderId) {
      setSelectedOrderId(notif.payload.orderId);
      setActiveTab('orders');
      setIsNotificationOpen(false);
    }
  };

  const clearNotifications = async () => {
    await dbNotifications.clearAll();
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'menu': return <MenuManager />;
      case 'orders': return <OrderTracker externalSelectedOrderId={selectedOrderId} onModalClose={() => setSelectedOrderId(null)} />;
      case 'sales-insights': return <SalesInsights />;
      case 'combos-ai': return <ComboAI />;
      case 'menu-ai': return <MenuAI />;
      case 'clientes-fieis': return <ClientesFieis />;
      case 'satisfacao': return <Satisfacao />;
      case 'configuracoes': return <Configuracoes />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={async (email, password) => authService.login(email, password)} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 ml-64 p-8 lg:p-12 relative">
        <header className="flex items-center justify-between mb-12 sticky top-0 z-30 py-4 -mt-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl transition-all">
          <div className="relative w-full max-md hidden md:block group" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar em toda a plataforma..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] pl-12 pr-6 py-3.5 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all text-sm dark:text-slate-100 shadow-sm"
            />
            {searchTerm.length >= 2 && (
              <div className="absolute mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-slate-500 px-2 py-3">Nenhum resultado encontrado.</p>
                ) : (
                  ['clientes', 'pedidos', 'produtos'].map((group) => {
                    const grouped = searchResults.filter((item) => item.type === group);
                    if (!grouped.length) return null;
                    return (
                      <div key={group} className="mb-2">
                        <p className="text-[10px] uppercase font-black text-slate-400 px-2 py-1">{group}</p>
                        {grouped.map((item) => (
                          <button key={`${item.type}-${item.id}`} onClick={() => handleSearchResultClick(item)} className="w-full text-left px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                            {item.label}
                          </button>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative" ref={notificationRef}>{/* notification unchanged */}
              <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="relative p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                <Bell className={`text-slate-600 dark:text-slate-300 ${unreadCount > 0 ? 'animate-swing text-orange-500' : ''}`} size={22} />
                {unreadCount > 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</div>}
              </button>
              {isNotificationOpen && <div className="absolute right-0 mt-4 w-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-50 overflow-hidden"><div className="p-5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800"><h3 className="text-xs font-black text-stone-700 dark:text-stone-200 uppercase tracking-widest">Alertas de Pedidos</h3>{notifications.length > 0 && <button onClick={clearNotifications} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 flex items-center gap-1"><Trash2 size={12} />Limpar</button>}</div><div className="max-h-[420px] overflow-y-auto">{notifications.length === 0 ? (<div className="p-12 text-center"><div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4"><Bell size={24} /></div><p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tudo tranquilo por aqui</p></div>) : notifications.map((notif) => (<button key={notif.id} onClick={() => handleNotificationClick(notif)} className={`w-full text-left p-5 border-b border-stone-50 dark:border-stone-800 flex items-start gap-4 transition-all hover:bg-stone-50 dark:hover:bg-stone-800/40 ${!notif.read ? 'bg-orange-500/5 dark:bg-orange-500/5 border-l-4 border-l-orange-500' : ''}`}><div className="p-3 rounded-xl shrink-0 bg-orange-100 text-orange-600 dark:bg-orange-500/20"><ShoppingBag size={18} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between mb-0.5"><p className="text-xs font-black text-stone-800 dark:text-white uppercase truncate">{notif.title}</p><span className="text-[9px] font-bold text-stone-400 flex items-center gap-1"><Clock size={10} /> {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium line-clamp-2">{notif.message}</p></div></button>))}</div>{notifications.length > 0 && <div className="p-4 bg-stone-50 dark:bg-stone-800/30 text-center"><button onClick={() => { setActiveTab('orders'); setIsNotificationOpen(false); }} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">Ver todos os pedidos</button></div>}</div>}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-slate-800 group">
                <div className="text-right hidden sm:block"><p className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">Admin Master</p><p className="text-[10px] text-orange-500 font-black uppercase tracking-widest flex items-center justify-end gap-1">Operacional <Sparkles size={10} /></p></div>
                <div className="relative"><div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xl group-hover:rotate-6 transition-all duration-500"><User size={24} /></div><div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-4 h-4 border-2 border-white dark:border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.5)]" /></div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-4 space-y-1">
                    <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all"><div className="flex items-center gap-3">{darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-500" />}<span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span></div><div className={`w-10 h-5 rounded-full relative transition-colors duration-500 ${darkMode ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-500 ${darkMode ? 'left-6' : 'left-1'}`} /></div></button>

                    <button onClick={() => { setActiveTab('configuracoes'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all"><Settings size={20} className="text-slate-400" /><span>Configurações</span></button>
                    <div className="my-2 mx-5 border-t border-slate-100 dark:border-slate-800" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all group"><LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /><span>Encerrar Sessão</span></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">{renderContent()}</div>
      </main>

      <div className="fixed bottom-6 right-6 z-[150]">
        <button onClick={() => setIsAIChatOpen(!isAIChatOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(249,115,22,0.5)] transition-all duration-500 hover:scale-110 active:scale-95 group relative ${isAIChatOpen ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rotate-90' : 'bg-orange-500 text-white'}`}>
          {isAIChatOpen ? <X size={28} /> : <><Sparkles className="absolute -top-1 -right-1 text-yellow-400 group-hover:animate-bounce" size={20} /><MessageSquare size={28} /></>}
        </button>
      </div>

      <OwnerChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />

      <style>{`@keyframes swing {0%, 100% { transform: rotate(0); }20% { transform: rotate(15deg); }40% { transform: rotate(-10deg); }60% { transform: rotate(5deg); }80% { transform: rotate(-5deg); }} .animate-swing {animation: swing 1s ease-in-out infinite;transform-origin: top center;}`}</style>
    </div>
  );
};

export default App;
