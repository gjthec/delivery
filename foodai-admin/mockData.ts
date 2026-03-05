
import { MenuItem, Category, Order } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Burgers', icon: '🍔', color: 'bg-orange-100 text-orange-600' },
  { id: '2', name: 'Entradas', icon: '🍟', color: 'bg-red-100 text-red-600' },
  { id: '3', name: 'Bebidas', icon: '🥤', color: 'bg-blue-100 text-blue-600' },
  { id: '4', name: 'Saudável', icon: '🥗', color: 'bg-green-100 text-green-600' },
];

export const INITIAL_MENU: MenuItem[] = [];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'PED-102',
    customerName: 'Ricardo Lima',
    items: [
      {
        menuItem: INITIAL_MENU[0],
        quantity: 1,
        removedIngredients: [],
        selectedExtras: [],
        observations: 'Bem passado, por favor.'
      }
    ],
    total: 34.90,
    status: 'pending',
    createdAt: new Date().toISOString(),
    payment: { method: 'pix' },
    address: {
      label: 'Casa',
      street: 'Rua das Palmeiras',
      number: '450',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01410-000'
    }
  },
  {
    id: 'PED-101',
    customerName: 'Juliana Costa',
    items: [
      {
        menuItem: INITIAL_MENU[1],
        quantity: 2,
        removedIngredients: ['Picles'],
        selectedExtras: [{ name: 'Maionese à Parte', price: 3.00 }]
      },
      {
        menuItem: INITIAL_MENU[3],
        quantity: 1,
        removedIngredients: [],
        selectedExtras: []
      }
    ],
    total: 90.80,
    status: 'preparing',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    payment: { method: 'credit', brand: 'visa' },
    address: {
      label: 'Trabalho',
      street: 'Faria Lima',
      number: '3000',
      neighborhood: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04538-132'
    }
  },
  {
    id: 'PED-100',
    customerName: 'Fernando Souza',
    items: [
      {
        menuItem: INITIAL_MENU[2],
        quantity: 1,
        removedIngredients: [],
        selectedExtras: []
      }
    ],
    total: 32.00,
    status: 'shipping',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    payment: { method: 'pix' },
    address: {
      label: 'Casa',
      street: 'Rua Oscar Freire',
      number: '12',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05409-010'
    }
  },
  {
    id: 'PED-099',
    customerName: 'Carla Mendes',
    items: [
      {
        menuItem: INITIAL_MENU[0],
        quantity: 3,
        removedIngredients: [],
        selectedExtras: []
      }
    ],
    total: 104.70,
    status: 'completed',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    payment: { method: 'cash' },
    address: {
      label: 'Casa',
      street: 'Al. Santos',
      number: '88',
      neighborhood: 'Paraíso',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04006-000'
    }
  },
  {
    id: 'PED-098',
    customerName: 'Bruno Henrique',
    items: [
      {
        menuItem: INITIAL_MENU[1],
        quantity: 1,
        removedIngredients: [],
        selectedExtras: []
      }
    ],
    total: 29.90,
    status: 'cancelled',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    payment: { method: 'pix' },
    address: {
      label: 'Apartamento',
      street: 'Rua Augusta',
      number: '1500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-100'
    }
  },
  {
    id: 'PED-097',
    customerName: 'Alice Oliveira',
    items: [
      {
        menuItem: INITIAL_MENU[0],
        quantity: 2,
        removedIngredients: [],
        selectedExtras: [{ name: 'Bacon Extra', price: 6.00 }]
      }
    ],
    total: 81.80,
    status: 'completed',
    createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
    payment: { method: 'pix' },
    address: {
      label: 'Casa',
      street: 'Avenida Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    }
  }
];
