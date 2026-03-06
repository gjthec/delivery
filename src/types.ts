export interface ExtraItem {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  type?: 'regular' | 'pizza';
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  preparationTime: string;
  imageUrl: string;
  imagePublicId?: string;
  description: string;
  size: 'P' | 'M' | 'G';
  tags: string[];
  calories?: number;
  ingredients?: string[];
  extras?: ExtraItem[];
  pricingStrategy?: PizzaPricingStrategy;
  sizes?: PizzaSizeOption[];
  allowedFlavorIds?: string[];
}

export type PizzaPricingStrategy = 'highestFlavor' | 'averageFlavor' | 'fixedBySize';

export interface PizzaSizeOption {
  id: string;
  label: string;
  basePrice: number;
  maxFlavors: number;
  slices?: number | null;
}

export interface Ingredient {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  allergens?: string[] | null;
}

export interface PizzaFlavor {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  tags: string[];
  ingredients: Array<{ id: string; name: string }>;
  active: boolean;
  priceDeltaBySize?: Record<string, number> | null;
}

export interface OrderItemPizzaFlavor {
  id: string;
  name: string;
  ingredients: string[];
  priceDeltaApplied: number;
}

export interface OrderItemPizzaSegment {
  index: number;
  flavorId: string;
  flavorName: string;
}

export interface OrderItemPizza {
  kind: 'pizza';
  pizzaBaseId: string;
  pizzaName: string;
  sizeId: string;
  sizeLabel: string;
  maxFlavors: number;
  flavorCountSelected: number;
  pricingStrategyUsed: PizzaPricingStrategy;
  segments: OrderItemPizzaSegment[];
  ingredientsSummary: string[];
  unitPriceComputed: number;
  quantity: number;
  notes?: string | null;
}

export interface CartItem {
  cartId: string;
  item: MenuItem;
  quantity: number;
  removedIngredients: string[];
  selectedExtras: ExtraItem[];
  observations: string;
  pizzaConfig?: Omit<OrderItemPizza, 'quantity' | 'notes'>;
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
  customer: {
    name: string;
    phone: string;
  };
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
