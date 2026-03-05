import React from 'react';
import { Search, ShoppingBag, User } from 'lucide-react';

interface Props {
  shouldHideFooter: boolean;
  onExplore: () => void;
  onOpenCart: () => void;
  cartLength: number;
  isCartJiggling: boolean;
}

const CustomerBottomNav: React.FC<Props> = ({ shouldHideFooter, onExplore, onOpenCart, cartLength, isCartJiggling }) => {
  return (
    <div className={`fixed bottom-8 left-0 right-0 flex justify-center px-6 z-[50] pointer-events-none transition-all duration-500 ${shouldHideFooter ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
      <nav className="pointer-events-auto flex items-center gap-1 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-zinc-200/50 dark:border-white/5">
        <button onClick={onExplore} className="px-8 py-4 flex flex-col items-center gap-1.5 transition-all text-orange-500">
          <Search size={22} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-widest">Explorar</span>
        </button>
        <div className="w-[1px] h-8 bg-zinc-100 dark:bg-zinc-800/50" />
        <button onClick={onOpenCart} className={`relative px-8 py-4 flex flex-col items-center gap-1.5 transition-all ${cartLength > 0 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'} ${isCartJiggling ? 'animate-jiggle' : ''}`}>
          <div className="relative">
            <ShoppingBag size={22} strokeWidth={2.5} />
            {cartLength > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">{cartLength}</span>}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Pedidos</span>
        </button>
        <div className="w-[1px] h-8 bg-zinc-100 dark:bg-zinc-800/50" />
        <button className="px-8 py-4 flex flex-col items-center gap-1.5 text-zinc-400">
          <User size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerBottomNav;
