
export interface ExtraItem {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  preparationTime: string;
  imageUrl: string;
  description: string;
  size: 'P' | 'M' | 'G';
  tags: string[];
  calories?: number;
  ingredients?: string[]; 
  extras?: ExtraItem[]; // Adicionais possíveis
}

export interface CartItem {
  cartId: string;
  item: MenuItem;
  quantity: number;
  removedIngredients: string[];
  selectedExtras: ExtraItem[];
  observations: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

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

// Fix: Adding missing PaymentType definition
export type PaymentType = 'credit' | 'debit' | 'pix' | 'cash';

// Fix: Adding missing CardBrand definition
export type CardBrand = 'mastercard' | 'visa' | 'elo';

// Fix: Adding missing Address interface definition
export interface Address {
  id: string;
  label: string;
  type: 'home' | 'work' | 'other';
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}
