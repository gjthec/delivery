
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Moon, Sun, Menu, Bell, Zap, Info, Settings, LogOut, X } from 'lucide-react';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<Props> = ({ isDarkMode, onToggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] px-4 py-3 md:px-8 md:py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass border border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[2.5rem] px-5 py-3 md:px-8">
        
        {/* Lado Esquerdo: Logo & Branding */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="relative w-11 h-11 orange-gradient rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(249,115,22,0.3)] transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110">
              <Zap size={20} className="text-white fill-white animate-pulse" />
              <div className="absolute -inset-1 bg-orange-400/20 blur-lg rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-xl md:text-2xl font-[900] tracking-tighter text-zinc-900 dark:text-zinc-50">
                Food<span className="text-orange-500">AI</span>
              </h1>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-600/60 dark:text-orange-400/60 leading-none">Smart Delivery</span>
            </div>
          </div>

          {/* Localização (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 px-5 py-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer transition-all duration-300 group">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
              <MapPin size={14} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-0.5">Entregar agora</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">Rua Gourmet, 456</span>
                <ChevronDown size={12} className="text-zinc-400 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Notificações e Menu Central */}
        <div className="flex items-center gap-2 md:gap-4 relative" ref={menuRef}>
          
          {/* Notificações */}
          <button className="flex w-12 h-12 items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all group">
            <div className="relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
            </div>
          </button>

          {/* Menu Dropdown Trigger */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-sm ${isMenuOpen ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rotate-90' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
          >
            {isMenuOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>

          {/* Dropdown Menu - Fundo Sólido e Opaco */}
          {isMenuOpen && (
            <div className="absolute top-16 right-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-[2.2rem] p-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[110]">
              <div className="p-4 mb-2 border-b border-zinc-50 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">Menu Principal</p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">Personalize sua experiência na FoodAI.</p>
              </div>
              
              <div className="space-y-1">
                {/* Alternar Tema */}
                <button 
                  onClick={() => { onToggleDarkMode(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-200 transition-all group active:scale-95"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-zinc-800 text-yellow-500' : 'bg-orange-100 text-orange-600'}`}>
                    {isDarkMode ? <Sun size={18} fill="currentColor" fillOpacity={0.2} /> : <Moon size={18} fill="currentColor" fillOpacity={0.2} />}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-extrabold">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
                    <span className="text-[10px] font-medium text-zinc-400 italic">Trocar visual</span>
                  </div>
                </button>

                {/* Sobre */}
                <button 
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-200 transition-all group active:scale-95"
                  onClick={() => { setIsMenuOpen(false); alert('FoodAI v1.0 - Transformando delivery com inteligência artificial.'); }}
                >
                  <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-orange-500 transition-colors">
                    <Info size={18} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-extrabold">Sobre o FoodAI</span>
                    <span className="text-[10px] font-medium text-zinc-400 italic">Versão e info</span>
                  </div>
                </button>

                {/* Configurações (Extra) */}
                <button 
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-200 transition-all group active:scale-95"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    <Settings size={18} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-extrabold">Ajustes</span>
                    <span className="text-[10px] font-medium text-zinc-400 italic">Preferências</span>
                  </div>
                </button>

                <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-2 mx-3" />

                <button className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-all active:scale-95">
                  <div className="w-9 h-9 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center">
                    <LogOut size={18} />
                  </div>
                  <span className="text-[13px] font-extrabold uppercase tracking-tight">Encerrar Sessão</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
