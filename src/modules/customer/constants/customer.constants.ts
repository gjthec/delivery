import { QuickPrompt } from '../types/customer-app.types';

export const PIX_CODE = '00020126330014br.gov.bcb.pix0111123456789015204000053039865802BR5925FoodAI Restaurantes6009Sao Paulo62070503***6304E2D1';
export const WHATSAPP_NUMBER = '5535998842525';

export const QUICK_PROMPTS: QuickPrompt[] = [
  { text: 'Quero algo barato', icon: 'wallet', action: 'Quero opções de lanches e pratos mais baratos do cardápio' },
  { text: 'Quero comer saudável', icon: 'leaf', action: 'Quero opções saudáveis, leves e com baixas calorias' },
  { text: 'Quero um lanche rápido', icon: 'zap', action: 'Quero algo que fique pronto rápido para matar minha fome agora' },
  { text: 'Quero repetir meu último pedido', icon: 'history', action: 'Quero repetir o combo de burger artesanal com fritas' }
];

export const RANDOM_PROMPT = 'Quero uma sugestão aleatória e surpreendente do cardápio';
