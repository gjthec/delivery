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
  extras?: ExtraItem[];
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

export type PaymentType = 'credit' | 'debit' | 'pix' | 'cash';

export type CardBrand = 'mastercard' | 'visa' | 'elo';

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

export interface CheckoutDetails {
  payment: {
    type: PaymentType;
    brand?: CardBrand;
    changeFor?: string;
  };
  address: Address;
}

export type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'completed' | 'cancelled';

export type OrderNotificationEvent = 'created' | 'preparing' | 'shipping' | 'completed' | 'cancelled';

export type NotificationType = OrderNotificationEvent | 'system' | 'ai';

export type NotificationPayload = {
  orderId?: string;
  status?: OrderStatus;
  event?: OrderNotificationEvent;
} & Record<string, any>;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
  payload?: NotificationPayload;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
  payload?: NotificationPayload;
}
