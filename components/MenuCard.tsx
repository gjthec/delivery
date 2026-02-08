
import React, { useState, useEffect } from 'react';
import { Star, Clock, Plus, Flame, Tag, Check, ShoppingCart } from 'lucide-react';
import { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  isHighlighted?: boolean;
  onAdd?: (item: MenuItem) => void;
  count?: number;
}

const MenuCard: React.FC<Props> = ({ item, isHighlighted, onAdd, count = 0 }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [pulse, setPulse] = useState(false);
  
  const hasPromo = item.originalPrice && item.originalPrice > item.price;
  const discountPercent = hasPromo ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
  const isInCart = count > 0;

  // Efeito de pulso quando o contador muda
  useEffect(() => {
    if (count > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    setShowPlusOne(true);
    onAdd?.(item);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);

    setTimeout(() => {
      setShowPlusOne(false);
    }, 800);
  };

  return (
    <div 
      className={`min-w-[300px] md:min-w-[320px] bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden transition-all duration-500 border-2 group cursor-pointer food-card-shadow relative
      ${isAdding ? 'scale-[0.97]' : 'hover:scale-[1.02] active:scale-[0.98]'}
      ${isInCart 
        ? 'border-orange-500 shadow-[0_20px_40px_rgba(249,115,22,0.15)] dark:shadow-[0_20px_50px_rgba(249,115,22,0.05)] ring-4 ring-orange-500/10' 
        : isHighlighted 
          ? 'border-orange-500/40 ring-8 ring-orange-50 dark:ring-orange-900/10' 
          : 'border-transparent hover:border-orange-100 dark:hover:border-orange-900/30'}`}>
      
      {/* Background Glow for Selected Items */}
      {isInCart && (
        <div className="absolute inset-0 bg-orange-500/[0.02] dark:bg-orange-500/[0.01] pointer-events-none" />
      )}

      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className={`w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110 ${isInCart ? 'contrast-[1.1] brightness-[0.95]' : ''}`}
        />
        
        {/* Unit Counter Badge - High visibility */}
        {count > 0 && (
          <div className={`absolute top-4 right-4 z-20 transition-all duration-500 transform ${pulse ? 'scale-125' : 'scale-100'}`}>
            <div className="orange-gradient p-[2px] rounded-2xl shadow-[0_10px_25px_rgba(249,115,22,0.4)]">
              <div className="bg-white dark:bg-zinc-950 px-4 py-2 rounded-[14px] flex items-center gap-2">
                <ShoppingCart size={16} className="text-orange-500 fill-orange-500/20" />
                <span className="text-base font-black text-zinc-900 dark:text-zinc-50">{count}</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Indicator for +1 */}
        {showPlusOne && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <span className="text-white font-black text-6xl animate-float-out drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              +{count}
            </span>
          </div>
        )}

        {/* Top Badges (Promo/Fit) */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           {hasPromo && (
             <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-red-500/30 animate-pulse">
               <Tag size={12} /> -{discountPercent}% OFF
             </div>
           )}
           {item.calories && item.calories < 400 && (
             <div className="bg-green-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-green-500/20">
               <Flame size={12} /> Fit
             </div>
           )}
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-4 right-4">
           <button 
            onClick={handleAdd}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 transform
              ${isAdding 
                ? 'bg-green-500 text-white scale-110 rotate-[360deg]' 
                : isInCart
                  ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:scale-110 active:scale-90'
                  : 'orange-gradient text-white hover:scale-110 active:scale-90 shadow-orange-200 dark:shadow-orange-950/20'}`}
          >
            {isAdding ? <Check size={28} strokeWidth={4} /> : <Plus size={28} strokeWidth={3} />}
          </button>
        </div>
      </div>
      
      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 mr-2">
            <div className="flex items-center gap-2 mb-1">
              {isInCart && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
              <h3 className={`font-extrabold text-xl leading-tight transition-colors ${isInCart ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-50 group-hover:text-orange-600'}`}>
                {item.name}
              </h3>
            </div>
            {isInCart && (
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 mb-2">Já está na sua sacola</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xl font-black ${hasPromo ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-50'}`}>
              R${item.price.toFixed(0)}
            </span>
            {hasPromo && (
              <span className="text-[10px] font-bold text-zinc-400 line-through">
                R${item.originalPrice?.toFixed(0)}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-400 dark:text-zinc-400 text-xs font-medium line-clamp-2 mb-6">
          {item.description}
        </p>
        
        <div className={`flex items-center gap-4 text-[11px] font-bold transition-all duration-300 border-t pt-4 ${isInCart ? 'text-orange-600/60 dark:text-orange-400/60 border-orange-500/10' : 'text-gray-500 dark:text-zinc-500 border-gray-50 dark:border-zinc-800'}`}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 rounded-full">
            <Star size={14} className="text-orange-500 fill-orange-500" />
            <span className="text-zinc-900 dark:text-zinc-300">{item.rating}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 rounded-full">
            <Clock size={14} className="text-orange-500" />
            <span className="text-zinc-900 dark:text-zinc-300">{item.preparationTime}</span>
          </div>
          <div className={`ml-auto uppercase tracking-tighter ${isInCart ? 'text-orange-600' : 'text-orange-500'}`}>
            {item.size}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
