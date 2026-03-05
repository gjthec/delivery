
export type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'completed' | 'cancelled';
export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash';
export type CardBrand = 'mastercard' | 'visa' | 'elo';
export type AppTab = 'dashboard' | 'menu' | 'orders' | 'sales-insights' | 'combos-ai' | 'menu-ai' | 'clientes-fieis' | 'satisfacao' | 'configuracoes';

export interface ExtraItem {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  originalPrice?: number;
  description: string;
  imageUrl: string;
  rating: number;
  preparationTime: string;
  size: 'P' | 'M' | 'G';
  tags: string[];
  calories?: number;
  ingredients: string[];
  extras: ExtraItem[];
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
    method: PaymentMethod;
    brand?: CardBrand;
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
} & Record<string, unknown>;

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
export interface SalesInsightsData {
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
  data: SalesInsightsData;
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
  payload: Record<string, unknown>;
}

// Compatibilidade retroativa para imports existentes
export type SalesInsights = SalesInsightsData;

export interface OwnerChatResponse {
  answer: string;
  bullets: string[];
  actions: OwnerChatAction[];
}


export interface AiWaiterSuggestion {
  itemId: string;
  quantity: number;
  reason: string;
}

export interface AiWaiterResponse {
  reply?: string;
  suggestions: AiWaiterSuggestion[];
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
