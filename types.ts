
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  preparationTime: string;
  imageUrl: string;
  description: string;
  size: 'P' | 'M' | 'G';
  tags: string[];
  calories?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Added Restaurant interface to fix the "Module '../types' has no exported member 'Restaurant'" error in RestaurantCard.tsx
export interface Restaurant {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  rating: number;
  deliveryTime: string;
  imageUrl: string;
  tags: string[];
}

export enum FilterType {
  Cheapest = 'Mais barato',
  MostExpensive = 'Premium',
  Healthy = 'Saudável',
  LargePortion = 'Para matar a fome',
}
