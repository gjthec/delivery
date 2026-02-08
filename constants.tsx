
import { MenuItem, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '0', name: 'Promoções', icon: '🏷️', color: 'bg-red-100' },
  { id: '1', name: 'Entradas', icon: '🥗', color: 'bg-green-100' },
  { id: '2', name: 'Burgers', icon: '🍔', color: 'bg-orange-100' },
  { id: '3', name: 'Pratos Executivos', icon: '🍽️', color: 'bg-yellow-100' },
  { id: '4', name: 'Pizzas', icon: '🍕', color: 'bg-red-100' },
  { id: '5', name: 'Japonesa', icon: '🍣', color: 'bg-rose-100' },
  { id: '6', name: 'Bebidas', icon: '🥤', color: 'bg-blue-100' },
  { id: '7', name: 'Sobremesas', icon: '🍰', color: 'bg-pink-100' },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'b1',
    name: 'Burger Artesanal Supremo',
    category: 'Burgers',
    price: 34.90,
    originalPrice: 45.90,
    rating: 4.9,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
    description: 'Pão brioche, 200g de carne angus, queijo cheddar derretido e bacon crocante. Acompanha fritas rústicas e molho da casa.',
    size: 'G',
    tags: ['Mais vendido', 'Carnes'],
    calories: 850,
    ingredients: ['Pão Brioche', 'Carne Angus 200g', 'Queijo Cheddar', 'Bacon', 'Alface', 'Tomate', 'Maionese'],
    extras: [
      { name: 'Bacon Extra', price: 6.00 },
      { name: 'Ovo Frito', price: 4.00 },
      { name: 'Queijo Cheddar Extra', price: 5.00 },
      { name: 'Hambúrguer 160g', price: 12.00 }
    ]
  },
  {
    id: 'b2',
    name: 'Smash Classic',
    category: 'Burgers',
    price: 29.90,
    rating: 4.7,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1510709638350-ef2b1cbdcc95?q=80&w=800',
    description: 'Pão de batata, dois blends de 80g prensados, queijo americano e maionese artesanal super leve.',
    size: 'M',
    tags: ['Barato', 'Rápido'],
    calories: 620,
    ingredients: ['Pão de Batata', 'Carne 80g (2x)', 'Queijo Americano', 'Cebola Roxa', 'Picles', 'Maionese'],
    extras: [
      { name: 'Carne Smash Extra', price: 8.00 },
      { name: 'Picles Extra', price: 2.00 },
      { name: 'Maionese à Parte', price: 3.00 }
    ]
  },
  {
    id: 'b3',
    name: 'Veggie Trufado',
    category: 'Burgers',
    price: 32.00,
    originalPrice: 42.00,
    rating: 4.8,
    preparationTime: '22 min',
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c5956f675b17?q=80&w=800',
    description: 'Explosão de sabores: hambúrguer de grão de bico, cogumelos trufados, rúcula fresca e maionese vegana.',
    size: 'M',
    tags: ['Veggie', 'Saudável'],
    calories: 450,
    ingredients: ['Pão Integral', 'Hambúrguer Grão de Bico', 'Cogumelos Trufados', 'Rúcula', 'Maionese Vegana'],
    extras: [
      { name: 'Cogumelos Extra', price: 7.00 },
      { name: 'Abacate', price: 5.00 }
    ]
  },
  {
    id: 'e1',
    name: 'Salada Caesar Fresh',
    category: 'Entradas',
    price: 28.00,
    rating: 4.5,
    preparationTime: '10 min',
    imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=800',
    description: 'Alface americana crocante, croutons caseiros, parmesão ralado na hora e nosso famoso molho especial.',
    size: 'M',
    tags: ['Leve', 'Veggie'],
    calories: 320,
    ingredients: ['Alface Americana', 'Croutons', 'Parmesão', 'Molho Caesar', 'Frango Grelhado'],
    extras: [
      { name: 'Tiras de Frango Extra', price: 9.00 },
      { name: 'Ovo Cozido', price: 3.50 }
    ]
  }
];
