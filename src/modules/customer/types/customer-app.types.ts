import { CheckoutDetails } from '../../../types';

export interface AiSuggestion {
  itemId: string;
  quantity: number;
  reason: string;
}

export interface CheckoutSession {
  orderId: string;
  details: CheckoutDetails;
  total: number;
  savedToDatabase: boolean;
}

export type QuickPromptIcon = 'wallet' | 'leaf' | 'zap' | 'history';

export interface QuickPrompt {
  text: string;
  icon: QuickPromptIcon;
  action: string;
}
