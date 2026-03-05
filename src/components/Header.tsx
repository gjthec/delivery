
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Moon, Sun, Menu, Bell, Zap, Info, Settings, LogOut, X, CheckCircle2, Clock, Truck, UtensilsCrossed, User, ShoppingBag, MapPinned, Ticket } from 'lucide-react';
import { AdminNotification } from '../types';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: AdminNotification[];
  onReadNotifications: () => void;
  onClearNotifications: () => void;
  onOpenProfile: () => void;
  onOpenOrders: () => void;
}

const Header: React.FC<Props> = ({ isDarkMode, onToggleDarkMode, notifications, onReadNotifications, onClearNotifications, onOpenProfile, onOpenOrders }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifToggle = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) onReadNotifications();
    setIsMenuOpen(false);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsNotifOpen(false);
  };

  const getNotifIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'shipping':
        return <Truck size={16} className="text-green-500" />;
      case 'preparing':
        return <UtensilsCrossed size={16} className="text-orange-500" />;
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'cancelled':
        return <X size={16} className="text-red-500" />;
      case 'created':
        return <Clock size={16} className="text-blue-500" />;
      case 'ai':
        return <Zap size={16} className="text-purple-500" />;
      case 'system':
      default:
        return <Bell size={16} />;
    }
  };

  return (
    <header className="px-4 py-3 md:px-8 md:py-5 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass border border-white/20 dark:border-white/5 shadow-2xl rounded-[2.5rem] px-5 py-3 md:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-11 h-11 orange-gradient rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div className="flex flex-col -space-y-1">
            <h1 className="text-xl md:text-2xl font-[900] tracking-tighter text-zinc-900 dark:text-zinc-50">Food<span className="text-orange-500">AI</span></h1>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-600/60 leading-none">Smart Delivery</span>
          </div>
        </div>

        {/* Actions Container */}
        <div className="flex items-center gap-2">
          
          {/* Notificações */}
          <div className="relative" ref={notifRef}>
            <button onClick={handleNotifToggle} className={`flex w-12 h-12 items-center justify-center rounded-2xl transition-all ${isNotifOpen ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <div className="relative">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-950 animate-pulse">{unreadCount}</span>}
              </div>
            </button>

            {isNotifOpen && (
              <div className="absolute top-16 right-0 w-80 max-h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.2rem] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[150]">
                 <div className="p-5 border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-800/20 flex items-center justify-between gap-3">
                   <h4 className="font-black text-xs uppercase tracking-widest text-zinc-500">Notificações</h4>
                   <button
                     onClick={onClearNotifications}
                     className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors"
                   >
                     Limpar
                   </button>
                 </div>
                 <div className="overflow-y-auto hide-scrollbar p-3 space-y-2">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-xs font-bold text-zinc-400 italic">Nada por aqui.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 rounded-[1.5rem] border ${notif.read ? 'bg-white dark:bg-zinc-900 border-transparent' : 'bg-orange-50/50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/20 shadow-sm'}`}>
                          <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">{getNotifIcon(notif.type)}</div>
                             <div className="flex-1">
                                <div className="flex justify-between items-start mb-0.5">
                                   <p className="font-extrabold text-[13px] leading-tight text-zinc-900 dark:text-zinc-100">{notif.title}</p>
                                   <span className="text-[9px] font-bold text-zinc-400 uppercase">{notif.time}</span>
                                </div>
                                <p className="text-[11px] font-medium text-zinc-500 leading-relaxed mb-3">{notif.message}</p>
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            )}
          </div>

          {/* User Menu Dropdown com Tema Integrado */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={handleMenuToggle} 
              className={`flex w-12 h-12 items-center justify-center rounded-2xl transition-all ${isMenuOpen ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'}`}
            >
              <Menu size={20} />
            </button>

            {isMenuOpen && (
              <div className="absolute top-16 right-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-[2.2rem] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[150]">
                <div className="p-5 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                   <div className="w-10 h-10 orange-gradient rounded-full flex items-center justify-center text-white font-black">JD</div>
                   <div className="flex flex-col">
                      <span className="text-[13px] font-black text-zinc-900 dark:text-zinc-50">John Doe</span>
                      <span className="text-[10px] font-bold text-zinc-400">Premium Member</span>
                   </div>
                </div>
                
                <div className="p-3 space-y-1">
                  {/* Tema no Dropdown */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleDarkMode(); }} 
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-500 hover:text-orange-500 group"
                  >
                    {isDarkMode ? <Sun size={18} className="group-hover:scale-110 transition-transform" /> : <Moon size={18} className="group-hover:scale-110 transition-transform" />}
                    <span className="text-xs font-black uppercase tracking-widest">
                      {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                    </span>
                  </button>

                  <button onClick={() => { onOpenProfile(); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-500 hover:text-orange-500 group">
                    <User size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Meu Perfil</span>
                  </button>
                  <button onClick={() => { onOpenOrders(); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-500 hover:text-orange-500 group">
                    <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Meus Pedidos</span>
                  </button>
                  <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-500 hover:text-orange-500 group">
                    <Ticket size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Meus Cupons</span>
                  </button>
                </div>

                <div className="p-3 border-t border-zinc-50 dark:border-zinc-800">
                  <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-zinc-400 hover:text-red-500 group">
                    <LogOut size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
