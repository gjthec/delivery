
import React from 'react';
import { Star, Clock, Plus, Flame } from 'lucide-react';
import { MenuItem } from '../types';

interface Props {
  item: MenuItem;
  isHighlighted?: boolean;
  onAdd?: (item: MenuItem) => void;
}

const MenuCard: React.FC<Props> = ({ item, isHighlighted, onAdd }) => {
  return (
    <div className={`min-w-[300px] md:min-w-[320px] bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden transition-all duration-500 border-2 group cursor-pointer food-card-shadow
      ${isHighlighted 
        ? 'border-orange-500 ring-8 ring-orange-50 dark:ring-orange-900/10' 
        : 'border-transparent hover:border-orange-100 dark:hover:border-orange-900/30'}`}>
      
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
        />
        
        <div className="absolute top-4 left-4 flex gap-2">
           {item.calories && item.calories < 400 && (
             <div className="bg-green-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1">
               <Flame size={12} /> Fit
             </div>
           )}
           {isHighlighted && (
             <div className="bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
               IA Suggestion
             </div>
           )}
        </div>

        <div className="absolute bottom-4 right-4">
           <button 
            onClick={(e) => { e.stopPropagation(); onAdd?.(item); }}
            className="w-12 h-12 orange-gradient text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-200 dark:shadow-orange-950/20 hover:scale-110 active:scale-95 transition-all"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-orange-600 transition-colors">
            {item.name}
          </h3>
          <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">R${item.price.toFixed(0)}</span>
        </div>
        
        <p className="text-gray-400 dark:text-zinc-400 text-xs font-medium line-clamp-2 mb-6">
          {item.description}
        </p>
        
        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 dark:text-zinc-500 border-t border-gray-50 dark:border-zinc-800 pt-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 rounded-full">
            <Star size={14} className="text-orange-500 fill-orange-500" />
            <span className="text-zinc-900 dark:text-zinc-300">{item.rating}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 rounded-full">
            <Clock size={14} className="text-orange-500" />
            <span className="text-zinc-900 dark:text-zinc-300">{item.preparationTime}</span>
          </div>
          <div className="ml-auto text-orange-500 uppercase tracking-tighter">
            {item.size}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
