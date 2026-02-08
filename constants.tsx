
import { MenuItem, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Entradas', icon: '🥗', color: 'bg-green-100' },
  { id: '2', name: 'Burgers', icon: '🍔', color: 'bg-orange-100' },
  { id: '3', name: 'Pratos Executivos', icon: '🍽️', color: 'bg-yellow-100' },
  { id: '4', name: 'Pizzas', icon: '🍕', color: 'bg-red-100' },
  { id: '5', name: 'Japonesa', icon: '🍣', color: 'bg-rose-100' },
  { id: '6', name: 'Bebidas', icon: '🥤', color: 'bg-blue-100' },
  { id: '7', name: 'Sobremesas', icon: '🍰', color: 'bg-pink-100' },
];

export const MENU_ITEMS: MenuItem[] = [
  // --- BURGERS ---
  {
    id: 'b1',
    name: 'Burger Artesanal Supremo',
    category: 'Burgers',
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
    id: 'b2',
    name: 'Smash Classic',
    category: 'Burgers',
    price: 29.90,
    rating: 4.7,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1510709638350-ef2b1cbdcc95?q=80&w=800',
    description: 'Pão de batata, dois blends de 80g prensados, queijo americano e maionese da casa.',
    size: 'M',
    tags: ['Barato', 'Rápido'],
    calories: 620
  },
  {
    id: 'b3',
    name: 'Veggie Trufado',
    category: 'Burgers',
    price: 42.00,
    rating: 4.8,
    preparationTime: '22 min',
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c5956f675b17?q=80&w=800',
    description: 'Hambúrguer de grão de bico, cogumelos trufados, rúcula e maionese vegana.',
    size: 'M',
    tags: ['Veggie', 'Saudável'],
    calories: 450
  },

  // --- ENTRADAS ---
  {
    id: 'e1',
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
    id: 'e2',
    name: 'Batata Rústica com Alecrim',
    category: 'Entradas',
    price: 18.50,
    rating: 4.6,
    preparationTime: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1630384066252-19e1ad95b4f6?q=80&w=800',
    description: 'Batatas fritas com casca, temperadas com alecrim e flor de sal.',
    size: 'G',
    tags: ['Petisco', 'Favorito'],
    calories: 380
  },
  {
    id: 'e3',
    name: 'Bruschetta Italiana',
    category: 'Entradas',
    price: 24.90,
    rating: 4.8,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?q=80&w=800',
    description: 'Pão italiano tostado, tomates cereja marinado em azeite, manjericão e alho.',
    size: 'P',
    tags: ['Vegetariano', 'Clássico'],
    calories: 210
  },

  // --- PRATOS EXECUTIVOS ---
  {
    id: 'p1',
    name: 'Filé Mignon ao Molho Madeira',
    category: 'Pratos Executivos',
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
    id: 'p2',
    name: 'Salmão Grelhado com Aspargos',
    category: 'Pratos Executivos',
    price: 68.90,
    rating: 4.9,
    preparationTime: '25 min',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800',
    description: 'Filé de salmão grelhado na manteiga de ervas, acompanhado de aspargos e purê de mandioquinha.',
    size: 'M',
    tags: ['Saudável', 'Peixes'],
    calories: 420
  },
  {
    id: 'p3',
    name: 'Risoto de Funghi Secchi',
    category: 'Pratos Executivos',
    price: 54.00,
    rating: 4.7,
    preparationTime: '28 min',
    imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=800',
    description: 'Arroz arbóreo, mix de cogumelos hidratados, vinho branco e parmesão.',
    size: 'M',
    tags: ['Vegetariano', 'Gourmet'],
    calories: 580
  },

  // --- PIZZAS ---
  {
    id: 'z1',
    name: 'Pizza Margherita DOC',
    category: 'Pizzas',
    price: 48.00,
    rating: 4.9,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=800',
    description: 'Molho de tomate pelati, mozzarella de búfala, manjericão fresco e azeite extra virgem.',
    size: 'M',
    tags: ['Italiana', 'Clássica'],
    calories: 980
  },
  {
    id: 'z2',
    name: 'Pizza Calabresa Premium',
    category: 'Pizzas',
    price: 44.50,
    rating: 4.6,
    preparationTime: '18 min',
    imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?q=80&w=800',
    description: 'Calabresa artesanal fatiada, cebola roxa, azeitonas pretas e orégano.',
    size: 'G',
    tags: ['Favorita', 'Carnes'],
    calories: 1100
  },

  // --- JAPONESA ---
  {
    id: 'j1',
    name: 'Combo Sushi Master (20 unid)',
    category: 'Japonesa',
    price: 85.00,
    rating: 4.8,
    preparationTime: '35 min',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800',
    description: 'Mix de sushis variados: 5 salmão, 5 atum, 5 uramaki filadélfia e 5 hossomaki.',
    size: 'G',
    tags: ['Festa', 'Premium'],
    calories: 650
  },
  {
    id: 'j2',
    name: 'Poke Bowl Salmão',
    category: 'Japonesa',
    price: 42.90,
    rating: 4.7,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800',
    description: 'Base de arroz, salmão fresco em cubos, edamame, manga, pepino e molho tarê.',
    size: 'M',
    tags: ['Saudável', 'Peixes'],
    calories: 480
  },

  // --- BEBIDAS ---
  {
    id: 'd1',
    name: 'Suco de Laranja Natural',
    category: 'Bebidas',
    price: 12.00,
    rating: 4.8,
    preparationTime: '5 min',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=800',
    description: 'Suco 100% natural, espremido na hora. Sem açúcar.',
    size: 'M',
    tags: ['Natural', 'Saudável'],
    calories: 120
  },
  {
    id: 'd2',
    name: 'Pink Lemonade',
    category: 'Bebidas',
    price: 15.90,
    rating: 4.9,
    preparationTime: '7 min',
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=800',
    description: 'Limonada siciliana com xarope artesanal de frutas vermelhas e gelo.',
    size: 'M',
    tags: ['Refrescante', 'Estiloso'],
    calories: 180
  },
  {
    id: 'd3',
    name: 'Cerveja Artesanal IPA',
    category: 'Bebidas',
    price: 24.00,
    rating: 4.7,
    preparationTime: '3 min',
    imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=800',
    description: 'Cerveja local com notas cítricas e amargor equilibrado. 500ml.',
    size: 'G',
    tags: ['Álcool', 'Artesanal'],
    calories: 220
  },
  {
    id: 'd4',
    name: 'Coca-Cola Zero',
    category: 'Bebidas',
    price: 7.50,
    rating: 4.5,
    preparationTime: '2 min',
    imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=800',
    description: 'Lata 350ml bem gelada.',
    size: 'P',
    tags: ['Soda', 'Clássico'],
    calories: 0
  },

  // --- SOBREMESAS ---
  {
    id: 's1',
    name: 'Petit Gâteau de Chocolate',
    category: 'Sobremesas',
    price: 26.90,
    rating: 4.9,
    preparationTime: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800',
    description: 'Bolo de chocolate belga com recheio cremoso e sorvete de baunilha Bourbon.',
    size: 'P',
    tags: ['Chocolate', 'Favorito'],
    calories: 520
  },
  {
    id: 's2',
    name: 'Cheesecake de Frutas Vermelhas',
    category: 'Sobremesas',
    price: 24.00,
    rating: 4.8,
    preparationTime: '10 min',
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800',
    description: 'Massa crocante, creme de queijo leve e calda artesanal de morango, amora e framboesa.',
    size: 'M',
    tags: ['Frutas', 'Clássico'],
    calories: 410
  },
  {
    id: 's3',
    name: 'Tiramisu Tradicional',
    category: 'Sobremesas',
    price: 28.50,
    rating: 4.9,
    preparationTime: '8 min',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=800',
    description: 'Biscoito champagne embebido em café, creme de mascarpone e cacau em pó.',
    size: 'M',
    tags: ['Italiano', 'Sofisticado'],
    calories: 380
  },
  {
    id: 's4',
    name: 'Mini Churros com Doce de Leite',
    category: 'Sobremesas',
    price: 16.00,
    rating: 4.7,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1581404476143-6d097723384e?q=80&w=800',
    description: '6 unidades de mini churros crocantes recheados com doce de leite argentino.',
    size: 'P',
    tags: ['Doce', 'Infantil'],
    calories: 450
  },

  // --- ADICIONAIS ---
  {
    id: 'b4',
    name: 'Smash Double Cheese',
    category: 'Burgers',
    price: 38.90,
    rating: 4.8,
    preparationTime: '18 min',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800',
    description: 'Três carnes smash, triplo cheddar, cebola caramelizada e pão de brioche.',
    size: 'G',
    tags: ['Ogro', 'Carnes'],
    calories: 950
  },
  {
    id: 'p4',
    name: 'Nhoque de Batata ao Sugo',
    category: 'Pratos Executivos',
    price: 42.00,
    rating: 4.6,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800',
    description: 'Massa artesanal de batata com molho de tomate fresco e manjericão.',
    size: 'M',
    tags: ['Vegetariano', 'Caseiro'],
    calories: 490
  }
];
