
export type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'completed' | 'cancelled';

export interface ExtraItem {
  type?: 'regular' | 'pizza';
  name: string;
  price: number;
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
  flavorType?: 'Salgado' | 'Doce';
  extraPrice?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  tags: string[];
  ingredients: Array<{ id: string; name: string }>;
  active: boolean;
  priceDeltaBySize?: Record<string, number> | null;
}

export interface MenuItem {
  id: string;
  type?: 'regular' | 'pizza';
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  originalPrice?: number;
  description: string;
  imageUrl: string;
  imagePublicId?: string;
  rating: number;
  preparationTime: string;
  size: 'P' | 'M' | 'G';
  tags: string[];
  calories?: number;
  ingredients: string[];
  extras: ExtraItem[];
  pricingStrategy?: PizzaPricingStrategy;
  sizes?: PizzaSizeOption[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Address {
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  removedIngredients: string[];
  selectedExtras: ExtraItem[];
  observations?: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerPhone?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  address: Address;
  payment: {
    method: 'credit' | 'debit' | 'pix' | 'cash';
    brand?: 'mastercard' | 'visa' | 'elo';
  };
}


export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
  payload?: NotificationPayload;
}

export type OrderNotificationEvent = 'created' | 'preparing' | 'shipping' | 'completed' | 'cancelled';

export type NotificationType = OrderNotificationEvent | 'system' | 'ai';

export type NotificationPayload = {
  orderId?: string;
  status?: OrderStatus;
  event?: OrderNotificationEvent;
} & Record<string, any>;

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
  payload?: NotificationPayload;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  items: Array<{ id: string, name: string, qty: number }>;
  price: number;
  discountPercent: number;
  active: boolean;
  reason?: string;
}

// AI Specific Schemas
export interface SalesInsights {
  summary: string;
  kpis: { orders: number, revenue: number, avgTicket: number };
  topItems: Array<{ name: string, qty: number, revenue: number, share: number }>;
  timeInsights: {
    bestDays: string[],
    worstDays: string[],
    bestHours: string[],
    worstHours: string[]
  };
  recommendations: Array<{
    title: string,
    evidence: string,
    action: string,
    impact: "low" | "medium" | "high"
  }>;
}

export interface SavedInsight {
  id: string;
  date: string;
  data: SalesInsights;
}

export interface ComboSuggestions {
  combos: Array<{
    name: string,
    description: string,
    items: Array<{ id: string, name: string, qty: number }>,
    suggestedPrice: number,
    suggestedDiscountPercent: number,
    reason: string
  }>;
}

export interface MenuCopy {
  newName: string;
  descriptionShort: string;
  descriptionLong: string;
  tags: string[];
  upsellSuggestion: string;
}

export interface OwnerChatAction {
  type: "open_insights" | "create_combo" | "edit_menu" | "open_orders";
  label: string;
  payload: Record<string, any>;
}

export interface OwnerChatResponse {
  answer: string;
  bullets: string[];
  actions: OwnerChatAction[];
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscountValue?: number;
  active: boolean;
}

export interface StoreSettings {
  deliveryFee: number;
  companyName?: string;
  logoUrl?: string;
  openingHours?: string;
  averageTimeMinutes?: number;
}
