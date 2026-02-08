
import React from 'react';
import { User, ShoppingBag, MapPin, ChevronDown, Moon, Sun } from 'lucide-react';

interface Props {
  cartCount: number;
  onCartClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<Props> = ({ cartCount, onCartClick, isDarkMode, onToggleDarkMode }) => {
  return (
    <header className="fixed top-0 left-0 right-0 glass z-50 px-6 py-4 flex items-center justify-between border-b border-gray-100/50 dark:border-white/10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-950/20 transition-transform group-hover:scale-105">
            <span className="text-white font-black text-xl italic">F</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 hidden sm:block">Food<span className="text-orange-500">AI</span></h1>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 px-4 py-2 rounded-full border border-gray-100 dark:border-zinc-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
          <MapPin size={16} className="text-orange-500" />
          <span className="text-xs font-bold text-gray-600 dark:text-zinc-400">Entregar em: <span className="text-gray-900 dark:text-zinc-50">Rua Gourmet, 456</span></span>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleDarkMode}
          className="w-12 h-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          title="Alternar Modo Escuro"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button 
          onClick={onCartClick}
          className="relative w-12 h-12 flex items-center justify-center bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 rounded-2xl hover:bg-black dark:hover:bg-white transition-all shadow-lg active:scale-95"
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-950 font-black">
              {cartCount}
            </span>
          )}
        </button>
        <button className="w-12 h-12 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all shadow-sm overflow-hidden group">
          <img src="https://picsum.photos/seed/user1/100/100" alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </header>
  );
};

export default Header;
