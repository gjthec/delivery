
import { MenuItem, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Entradas', icon: '🥗', color: 'bg-green-100' },
  { id: '2', name: 'Pratos Principais', icon: '🍽️', color: 'bg-orange-100' },
  { id: '3', name: 'Bebidas', icon: '🥤', color: 'bg-blue-100' },
  { id: '4', name: 'Sobremesas', icon: '🍰', color: 'bg-pink-100' },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Burger Artesanal Supremo',
    category: 'Pratos Principais',
    price: 45.90,
    rating: 4.9,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
    description: 'Pão brioche, 200g de carne angus, queijo cheddar derretido e bacon crocante. Acompanha fritas.',
    size: 'G',
    tags: ['Mais vendido', 'Carnes'],
    calories: 850
  },
  {
    id: 'm2',
    name: 'Salada Caesar Fresh',
    category: 'Entradas',
    price: 28.00,
    rating: 4.5,
    preparationTime: '10 min',
    imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=800',
    description: 'Alface americana, croutons caseiros, parmesão ralado e molho especial.',
    size: 'M',
    tags: ['Leve', 'Veggie'],
    calories: 320
  },
  {
    id: 'm3',
    name: 'Filé Mignon ao Molho Madeira',
    category: 'Pratos Principais',
    price: 72.00,
    rating: 4.8,
    preparationTime: '30 min',
    imageUrl: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=800',
    description: 'Medalhão de filé mignon, arroz à piamontese e batatas rústicas.',
    size: 'G',
    tags: ['Premium', 'Sofisticado'],
    calories: 740
  },
  {
    id: 'm4',
    name: 'Mini Slider Kids',
    category: 'Pratos Principais',
    price: 22.50,
    rating: 4.6,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?q=80&w=800',
    description: 'Versão reduzida do nosso burger clássico, ideal para crianças.',
    size: 'P',
    tags: ['Kids', 'Barato'],
    calories: 410
  },
  {
    id: 'm5',
    name: 'Petit Gâteau',
    category: 'Sobremesas',
    price: 19.90,
    rating: 4.9,
    preparationTime: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800',
    description: 'Bolo de chocolate com recheio cremoso e uma bola de sorvete de baunilha.',
    size: 'P',
    tags: ['Doce', 'Clássico']
  }
];
