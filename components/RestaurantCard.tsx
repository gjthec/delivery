
import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Restaurant } from '../types';

interface Props {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<Props> = ({ restaurant }) => {
  return (
    <div className="min-w-[280px] md:min-w-[320px] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={restaurant.imageUrl} 
          alt={restaurant.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold">{restaurant.rating}</span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{restaurant.name}</h3>
            <p className="text-gray-500 text-sm">{restaurant.category} • {restaurant.priceRange}</p>
          </div>
          <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
            <Clock size={14} />
            <span className="text-[10px] font-medium whitespace-nowrap">{restaurant.deliveryTime}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          {restaurant.tags.map(tag => (
            <span key={tag} className="text-[10px] uppercase tracking-wider font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
