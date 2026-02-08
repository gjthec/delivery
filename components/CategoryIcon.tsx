
import React from 'react';
import { Category } from '../types';

interface Props {
  category: Category;
  isActive?: boolean;
  onClick?: () => void;
}

const CategoryIcon: React.FC<Props> = ({ category, isActive, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl whitespace-nowrap transition-all duration-300 border-2 shrink-0
      ${isActive 
        ? 'orange-gradient border-transparent text-white shadow-lg shadow-orange-500/30 scale-105' 
        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-950/10'}`}
    >
      <span className="text-lg leading-none">{category.icon}</span>
      <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>
        {category.name}
      </span>
    </button>
  );
};

export default CategoryIcon;
