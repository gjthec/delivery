
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
      className={`flex flex-col items-center gap-2 group transition-all duration-300 p-2 rounded-2xl ${isActive ? 'bg-orange-50 scale-105' : 'hover:bg-gray-50'}`}
    >
      <div className={`w-14 h-14 md:w-16 md:h-16 ${category.color} rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:shadow-md transition-all duration-300 border border-transparent ${isActive ? 'border-orange-200' : ''}`}>
        {category.icon}
      </div>
      <span className={`text-xs md:text-sm font-semibold transition-colors ${isActive ? 'text-orange-600' : 'text-gray-600 group-hover:text-orange-500'}`}>
        {category.name}
      </span>
    </button>
  );
};

export default CategoryIcon;
