import { MenuItem, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Entradas', icon: '🥗', color: 'bg-green-100' },
  { id: '2', name: 'Burgers', icon: '🍔', color: 'bg-orange-100' },
  { id: '3', name: 'Pratos Executivos', icon: '🍽️', color: 'bg-yellow-100' },
  { id: '4', name: 'Pizzas', icon: '🍕', color: 'bg-red-100' },
  { id: '5', name: 'Japonesa', icon: '🍣', color: 'bg-rose-100' },
  { id: '6', name: 'Bebidas', icon: '🥤', color: 'bg-blue-100' },
  { id: '7', name: 'Sobremesas', icon: '🍰', color: 'bg-pink-100' },

  // --- NOVAS CATEGORIAS ---
  { id: '8', name: 'Massas', icon: '🍝', color: 'bg-amber-100' },
  { id: '9', name: 'Sanduíches', icon: '🥪', color: 'bg-lime-100' },
  { id: '10', name: 'Vegana', icon: '🌱', color: 'bg-emerald-100' },
  { id: '11', name: 'Kids', icon: '🧒', color: 'bg-indigo-100' },
  { id: '12', name: 'Cafés', icon: '☕', color: 'bg-stone-100' },
  { id: '13', name: 'Molhos & Extras', icon: '🧄', color: 'bg-slate-100' },
];

export const MENU_ITEMS: MenuItem[] = [
  // --- BURGERS ---
  {
    id: 'b1',
    name: 'Burger Artesanal Supremo',
    category: 'Burgers',
    price: 45.9,
    rating: 4.9,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
    description: 'Pão brioche, 200g de carne angus, cheddar derretido e bacon crocante. Acompanha fritas.',
    size: 'G',
    tags: ['Mais vendido', 'Carnes'],
    calories: 850
  },
  {
    id: 'b2',
    name: 'Smash Classic',
    category: 'Burgers',
    price: 29.9,
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
    price: 42.0,
    rating: 4.8,
    preparationTime: '22 min',
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c5956f675b17?q=80&w=800',
    description: 'Burger de grão de bico, cogumelos trufados, rúcula e maionese vegana.',
    size: 'M',
    tags: ['Veggie', 'Saudável'],
    calories: 450
  },
  {
    id: 'b4',
    name: 'Smash Double Cheese',
    category: 'Burgers',
    price: 38.9,
    rating: 4.8,
    preparationTime: '18 min',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800',
    description: 'Três carnes smash, triplo cheddar, cebola caramelizada e pão brioche.',
    size: 'G',
    tags: ['Ogro', 'Carnes'],
    calories: 950
  },

  // --- NOVOS BURGERS ---
  {
    id: 'b5',
    name: 'BBQ Bacon & Onion',
    category: 'Burgers',
    price: 41.9,
    rating: 4.7,
    preparationTime: '18 min',
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=800',
    description: 'Blend 180g, cheddar, bacon em tiras, onion rings crocantes e molho barbecue defumado.',
    size: 'G',
    tags: ['Defumado', 'Carnes'],
    calories: 880
  },
  {
    id: 'b6',
    name: 'Chicken Crispy Lemon',
    category: 'Burgers',
    price: 34.9,
    rating: 4.6,
    preparationTime: '16 min',
    imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e9a13086?q=80&w=800',
    description: 'Frango empanado crocante, maionese de limão, alface, picles e pão macio.',
    size: 'M',
    tags: ['Frango', 'Crocante'],
    calories: 640
  },
  {
    id: 'b7',
    name: 'Blue Cheese Madness',
    category: 'Burgers',
    price: 46.0,
    rating: 4.8,
    preparationTime: '22 min',
    imageUrl: 'https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=800',
    description: 'Blend 200g, gorgonzola, cebola roxa, rúcula e aioli da casa no brioche.',
    size: 'G',
    tags: ['Gourmet', 'Queijos'],
    calories: 820
  },

  // --- ENTRADAS ---
  {
    id: 'e1',
    name: 'Salada Caesar Fresh',
    category: 'Entradas',
    price: 28.0,
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
    price: 18.5,
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
    price: 24.9,
    rating: 4.8,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?q=80&w=800',
    description: 'Pão italiano tostado, tomates cereja marinados no azeite, manjericão e alho.',
    size: 'P',
    tags: ['Vegetariano', 'Clássico'],
    calories: 210
  },

  // --- NOVAS ENTRADAS ---
  {
    id: 'e4',
    name: 'Carpaccio de Carne com Rúcula',
    category: 'Entradas',
    price: 39.9,
    rating: 4.7,
    preparationTime: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1604908554027-8d24e0c7e0a6?q=80&w=800',
    description: 'Finas lâminas de carne, rúcula, lascas de parmesão, alcaparras e molho de mostarda.',
    size: 'M',
    tags: ['Sofisticado', 'Carnes'],
    calories: 280
  },
  {
    id: 'e5',
    name: 'Dadinho de Tapioca com Geleia',
    category: 'Entradas',
    price: 22.0,
    rating: 4.8,
    preparationTime: '14 min',
    imageUrl: 'https://images.unsplash.com/photo-1604908177451-983b47215190?q=80&w=800',
    description: 'Cubos crocantes de tapioca com queijo, servidos com geleia de pimenta suave.',
    size: 'P',
    tags: ['Brasileiro', 'Crocante'],
    calories: 360
  },
  {
    id: 'e6',
    name: 'Guacamole com Nachos',
    category: 'Entradas',
    price: 27.9,
    rating: 4.6,
    preparationTime: '10 min',
    imageUrl: 'https://images.unsplash.com/photo-1604909053905-73307039e891?q=80&w=800',
    description: 'Guacamole cremoso com limão, cebola roxa e coentro, acompanhado de nachos.',
    size: 'M',
    tags: ['Mexicano', 'Compartilhar'],
    calories: 430
  },

  // --- PRATOS EXECUTIVOS ---
  {
    id: 'p1',
    name: 'Filé Mignon ao Molho Madeira',
    category: 'Pratos Executivos',
    price: 72.0,
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
    price: 68.9,
    rating: 4.9,
    preparationTime: '25 min',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800',
    description: 'Salmão na manteiga de ervas, aspargos e purê de mandioquinha.',
    size: 'M',
    tags: ['Saudável', 'Peixes'],
    calories: 420
  },
  {
    id: 'p3',
    name: 'Risoto de Funghi Secchi',
    category: 'Pratos Executivos',
    price: 54.0,
    rating: 4.7,
    preparationTime: '28 min',
    imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=800',
    description: 'Arroz arbóreo, mix de cogumelos, vinho branco e parmesão.',
    size: 'M',
    tags: ['Vegetariano', 'Gourmet'],
    calories: 580
  },
  {
    id: 'p4',
    name: 'Nhoque de Batata ao Sugo',
    category: 'Pratos Executivos',
    price: 42.0,
    rating: 4.6,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800',
    description: 'Massa artesanal de batata com molho de tomate fresco e manjericão.',
    size: 'M',
    tags: ['Vegetariano', 'Caseiro'],
    calories: 490
  },

  // --- NOVOS PRATOS EXECUTIVOS ---
  {
    id: 'p5',
    name: 'Frango Grelhado com Legumes',
    category: 'Pratos Executivos',
    price: 39.9,
    rating: 4.6,
    preparationTime: '18 min',
    imageUrl: 'https://images.unsplash.com/photo-1604908177032-6cdb0f2e9b7f?q=80&w=800',
    description: 'Peito de frango grelhado, mix de legumes salteados e arroz integral.',
    size: 'M',
    tags: ['Fit', 'Leve'],
    calories: 420
  },
  {
    id: 'p6',
    name: 'Parmegiana Clássica',
    category: 'Pratos Executivos',
    price: 49.9,
    rating: 4.8,
    preparationTime: '25 min',
    imageUrl: 'https://images.unsplash.com/photo-1604908176511-8a2bdbe9d988?q=80&w=800',
    description: 'Bife empanado, molho de tomate, queijo gratinado, arroz e batata frita.',
    size: 'G',
    tags: ['Clássico', 'Carnes'],
    calories: 980
  },
  {
    id: 'p7',
    name: 'Strogonoff de Carne',
    category: 'Pratos Executivos',
    price: 46.0,
    rating: 4.7,
    preparationTime: '22 min',
    imageUrl: 'https://images.unsplash.com/photo-1604908177524-21d2b9dcd51b?q=80&w=800',
    description: 'Strogonoff cremoso com champignon, arroz branco e batata palha.',
    size: 'G',
    tags: ['Conforto', 'Carnes'],
    calories: 860
  },

  // --- PIZZAS ---
  {
    id: 'z1',
    name: 'Pizza Margherita DOC',
    category: 'Pizzas',
    price: 48.0,
    rating: 4.9,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=800',
    description: 'Molho pelati, mozzarella de búfala, manjericão e azeite extra virgem.',
    size: 'M',
    tags: ['Italiana', 'Clássica'],
    calories: 980
  },
  {
    id: 'z2',
    name: 'Pizza Calabresa Premium',
    category: 'Pizzas',
    price: 44.5,
    rating: 4.6,
    preparationTime: '18 min',
    imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?q=80&w=800',
    description: 'Calabresa artesanal, cebola roxa, azeitonas pretas e orégano.',
    size: 'G',
    tags: ['Favorita', 'Carnes'],
    calories: 1100
  },

  // --- NOVAS PIZZAS ---
  {
    id: 'z3',
    name: 'Pizza Quatro Queijos',
    category: 'Pizzas',
    price: 52.0,
    rating: 4.8,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=800',
    description: 'Mozzarella, parmesão, gorgonzola e provolone. Finalizada com azeite.',
    size: 'G',
    tags: ['Queijos', 'Clássico'],
    calories: 1200
  },
  {
    id: 'z4',
    name: 'Pizza Pepperoni',
    category: 'Pizzas',
    price: 56.9,
    rating: 4.7,
    preparationTime: '19 min',
    imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a24?q=80&w=800',
    description: 'Pepperoni fatiado, mozzarella, molho artesanal e toque de pimenta calabresa.',
    size: 'M',
    tags: ['Apimentado', 'Carnes'],
    calories: 1150
  },
  {
    id: 'z5',
    name: 'Pizza Portuguesa Especial',
    category: 'Pizzas',
    price: 54.0,
    rating: 4.6,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1601924928585-4c1f0b7f2c2a?q=80&w=800',
    description: 'Presunto, ovos, cebola, ervilha, azeitona e mozzarella. Orégano na finalização.',
    size: 'G',
    tags: ['Clássica', 'Família'],
    calories: 1250
  },

  // --- JAPONESA ---
  {
    id: 'j1',
    name: 'Combo Sushi Master (20 unid)',
    category: 'Japonesa',
    price: 85.0,
    rating: 4.8,
    preparationTime: '35 min',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800',
    description: 'Mix: 5 salmão, 5 atum, 5 uramaki filadélfia e 5 hossomaki.',
    size: 'G',
    tags: ['Festa', 'Premium'],
    calories: 650
  },
  {
    id: 'j2',
    name: 'Poke Bowl Salmão',
    category: 'Japonesa',
    price: 42.9,
    rating: 4.7,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800',
    description: 'Arroz, salmão em cubos, edamame, manga, pepino e molho tarê.',
    size: 'M',
    tags: ['Saudável', 'Peixes'],
    calories: 480
  },

  // --- NOVA JAPONESA ---
  {
    id: 'j3',
    name: 'Temaki Salmão Cream',
    category: 'Japonesa',
    price: 28.0,
    rating: 4.6,
    preparationTime: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=800',
    description: 'Temaki recheado com salmão, cream cheese e cebolinha. Alga crocante.',
    size: 'M',
    tags: ['Clássico', 'Rápido'],
    calories: 520
  },
  {
    id: 'j4',
    name: 'Uramaki Filadélfia (8 unid)',
    category: 'Japonesa',
    price: 32.9,
    rating: 4.7,
    preparationTime: '18 min',
    imageUrl: 'https://images.unsplash.com/photo-1607301405390-4f1c6bd3b5ad?q=80&w=800',
    description: 'Salmão, cream cheese e pepino, finalizado com gergelim.',
    size: 'P',
    tags: ['Salmão', 'Favorito'],
    calories: 420
  },
  {
    id: 'j5',
    name: 'Hot Roll (8 unid)',
    category: 'Japonesa',
    price: 34.0,
    rating: 4.8,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?q=80&w=800',
    description: 'Uramaki empanado, recheio de salmão e cream cheese, com molho tarê.',
    size: 'P',
    tags: ['Crocante', 'Quente'],
    calories: 560
  },

  // --- BEBIDAS ---
  {
    id: 'd1',
    name: 'Suco de Laranja Natural',
    category: 'Bebidas',
    price: 12.0,
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
    price: 15.9,
    rating: 4.9,
    preparationTime: '7 min',
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=800',
    description: 'Limonada siciliana com xarope de frutas vermelhas e gelo.',
    size: 'M',
    tags: ['Refrescante', 'Estiloso'],
    calories: 180
  },
  {
    id: 'd3',
    name: 'Cerveja Artesanal IPA',
    category: 'Bebidas',
    price: 24.0,
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
    price: 7.5,
    rating: 4.5,
    preparationTime: '2 min',
    imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=800',
    description: 'Lata 350ml bem gelada.',
    size: 'P',
    tags: ['Soda', 'Clássico'],
    calories: 0
  },

  // --- NOVAS BEBIDAS ---
  {
    id: 'd5',
    name: 'Água com Gás (500ml)',
    category: 'Bebidas',
    price: 6.0,
    rating: 4.4,
    preparationTime: '1 min',
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=800',
    description: 'Água com gás bem gelada. Ideal para acompanhar pratos.',
    size: 'P',
    tags: ['Zero', 'Leve'],
    calories: 0
  },
  {
    id: 'd6',
    name: 'Chá Gelado de Pêssego',
    category: 'Bebidas',
    price: 13.9,
    rating: 4.6,
    preparationTime: '4 min',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800',
    description: 'Chá preto gelado com pêssego e limão. Adoçado na medida.',
    size: 'M',
    tags: ['Refrescante', 'Natural'],
    calories: 110
  },
  {
    id: 'd7',
    name: 'Milkshake de Baunilha',
    category: 'Bebidas',
    price: 19.9,
    rating: 4.8,
    preparationTime: '8 min',
    imageUrl: 'https://images.unsplash.com/photo-1542444592-0d59924b2a60?q=80&w=800',
    description: 'Milkshake cremoso de baunilha com chantilly. 400ml.',
    size: 'G',
    tags: ['Doce', 'Cremoso'],
    calories: 520
  },

  // --- SOBREMESAS ---
  {
    id: 's1',
    name: 'Petit Gâteau de Chocolate',
    category: 'Sobremesas',
    price: 26.9,
    rating: 4.9,
    preparationTime: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800',
    description: 'Chocolate belga com recheio cremoso e sorvete de baunilha Bourbon.',
    size: 'P',
    tags: ['Chocolate', 'Favorito'],
    calories: 520
  },
  {
    id: 's2',
    name: 'Cheesecake de Frutas Vermelhas',
    category: 'Sobremesas',
    price: 24.0,
    rating: 4.8,
    preparationTime: '10 min',
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800',
    description: 'Creme de queijo leve e calda artesanal de frutas vermelhas.',
    size: 'M',
    tags: ['Frutas', 'Clássico'],
    calories: 410
  },
  {
    id: 's3',
    name: 'Tiramisu Tradicional',
    category: 'Sobremesas',
    price: 28.5,
    rating: 4.9,
    preparationTime: '8 min',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=800',
    description: 'Biscoito champagne no café, creme mascarpone e cacau.',
    size: 'M',
    tags: ['Italiano', 'Sofisticado'],
    calories: 380
  },
  {
    id: 's4',
    name: 'Mini Churros com Doce de Leite',
    category: 'Sobremesas',
    price: 16.0,
    rating: 4.7,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1581404476143-6d097723384e?q=80&w=800',
    description: '6 mini churros crocantes recheados com doce de leite argentino.',
    size: 'P',
    tags: ['Doce', 'Infantil'],
    calories: 450
  },

  // --- NOVAS SOBREMESAS ---
  {
    id: 's5',
    name: 'Brownie com Sorvete',
    category: 'Sobremesas',
    price: 22.9,
    rating: 4.8,
    preparationTime: '7 min',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800',
    description: 'Brownie quentinho com sorvete cremoso e calda de chocolate.',
    size: 'M',
    tags: ['Chocolate', 'Conforto'],
    calories: 620
  },
  {
    id: 's6',
    name: 'Mousse de Maracujá',
    category: 'Sobremesas',
    price: 14.9,
    rating: 4.6,
    preparationTime: '5 min',
    imageUrl: 'https://images.unsplash.com/photo-1601315488950-3b5048b2d4c0?q=80&w=800',
    description: 'Mousse aerado de maracujá com toque cítrico e raspas de limão.',
    size: 'P',
    tags: ['Leve', 'Frutas'],
    calories: 280
  },

  // --- MASSAS ---
  {
    id: 'm1',
    name: 'Penne ao Molho Alfredo',
    category: 'Massas',
    price: 44.0,
    rating: 4.7,
    preparationTime: '22 min',
    imageUrl: 'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=800',
    description: 'Penne com molho alfredo cremoso, parmesão e toque de noz-moscada.',
    size: 'M',
    tags: ['Cremoso', 'Clássico'],
    calories: 760
  },
  {
    id: 'm2',
    name: 'Spaghetti Carbonara',
    category: 'Massas',
    price: 52.0,
    rating: 4.9,
    preparationTime: '20 min',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800',
    description: 'Spaghetti, pancetta, gema, parmesão e pimenta do reino moída na hora.',
    size: 'G',
    tags: ['Italiano', 'Premium'],
    calories: 890
  },
  {
    id: 'm3',
    name: 'Lasanha Bolonhesa da Casa',
    category: 'Massas',
    price: 56.9,
    rating: 4.8,
    preparationTime: '30 min',
    imageUrl: 'https://images.unsplash.com/photo-1604908177271-2b0dbd5b2d10?q=80&w=800',
    description: 'Camadas generosas de massa, bolonhesa, molho branco e queijo gratinado.',
    size: 'G',
    tags: ['Conforto', 'Família'],
    calories: 980
  },

  // --- SANDUÍCHES ---
  {
    id: 'sa1',
    name: 'Sanduíche Caprese',
    category: 'Sanduíches',
    price: 29.9,
    rating: 4.6,
    preparationTime: '10 min',
    imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?q=80&w=800',
    description: 'Pão ciabatta, mozzarella, tomate, manjericão e pesto leve.',
    size: 'M',
    tags: ['Vegetariano', 'Leve'],
    calories: 520
  },
  {
    id: 'sa2',
    name: 'Sanduíche de Pastrami',
    category: 'Sanduíches',
    price: 39.9,
    rating: 4.7,
    preparationTime: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=800',
    description: 'Pão de fermentação natural, pastrami, queijo, picles e mostarda da casa.',
    size: 'G',
    tags: ['Carnes', 'Artesanal'],
    calories: 780
  },

  // --- VEGANA ---
  {
    id: 'v1',
    name: 'Bowl Vegano Thai',
    category: 'Vegana',
    price: 39.9,
    rating: 4.7,
    preparationTime: '15 min',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800',
    description: 'Arroz, tofu grelhado, legumes crocantes, amendoim e molho tailandês levemente picante.',
    size: 'M',
    tags: ['Vegano', 'Saudável'],
    calories: 540
  },
  {
    id: 'v2',
    name: 'Pizza Vegana de Cogumelos',
    category: 'Vegana',
    price: 58.0,
    rating: 4.6,
    preparationTime: '22 min',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=800',
    description: 'Molho artesanal, mix de cogumelos, cebola roxa e “queijo” vegetal. Finalizada com rúcula.',
    size: 'G',
    tags: ['Vegano', 'Gourmet'],
    calories: 990
  },

  // --- KIDS ---
  {
    id: 'k1',
    name: 'Mini Burger Kids',
    category: 'Kids',
    price: 22.9,
    rating: 4.6,
    preparationTime: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
    description: 'Mini burger com queijo, pão macio e batatinhas. Sem picles.',
    size: 'P',
    tags: ['Kids', 'Favorito'],
    calories: 520
  },
  {
    id: 'k2',
    name: 'Nuggets + Batata Kids',
    category: 'Kids',
    price: 24.9,
    rating: 4.5,
    preparationTime: '10 min',
    imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e9a13086?q=80&w=800',
    description: 'Nuggets crocantes com batata e molho da casa.',
    size: 'P',
    tags: ['Kids', 'Crocante'],
    calories: 640
  },

  // --- CAFÉS ---
  {
    id: 'c1',
    name: 'Café Espresso',
    category: 'Cafés',
    price: 6.9,
    rating: 4.7,
    preparationTime: '3 min',
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=800',
    description: 'Shot de espresso encorpado com crema. 50ml.',
    size: 'P',
    tags: ['Café', 'Clássico'],
    calories: 5
  },
  {
    id: 'c2',
    name: 'Cappuccino Cremoso',
    category: 'Cafés',
    price: 12.9,
    rating: 4.8,
    preparationTime: '6 min',
    imageUrl: 'https://images.unsplash.com/photo-1522992319-0365e5f11656?q=80&w=800',
    description: 'Café, leite vaporizado e espuma cremosa com toque de canela.',
    size: 'M',
    tags: ['Cremoso', 'Quente'],
    calories: 160
  },
  {
    id: 'c3',
    name: 'Latte Gelado de Baunilha',
    category: 'Cafés',
    price: 15.9,
    rating: 4.6,
    preparationTime: '5 min',
    imageUrl: 'https://images.unsplash.com/photo-1525382455947-f319bc05fb38?q=80&w=800',
    description: 'Leite, espresso e xarope de baunilha com gelo. 400ml.',
    size: 'G',
    tags: ['Gelado', 'Estiloso'],
    calories: 210
  },

  // --- MOLHOS & EXTRAS ---
  {
    id: 'x1',
    name: 'Maionese da Casa',
    category: 'Molhos & Extras',
    price: 4.9,
    rating: 4.8,
    preparationTime: '1 min',
    imageUrl: 'https://images.unsplash.com/photo-1604909053905-73307039e891?q=80&w=800',
    description: 'Maionese artesanal temperada. 60g.',
    size: 'P',
    tags: ['Extra', 'Favorito'],
    calories: 180
  },
  {
    id: 'x2',
    name: 'Molho Barbecue Defumado',
    category: 'Molhos & Extras',
    price: 5.5,
    rating: 4.7,
    preparationTime: '1 min',
    imageUrl: 'https://images.unsplash.com/photo-1604909054101-4b3a2db279b9?q=80&w=800',
    description: 'Barbecue com toque defumado e adocicado. 60g.',
    size: 'P',
    tags: ['Extra', 'Defumado'],
    calories: 120
  },
  {
    id: 'x3',
    name: 'Cheddar Extra',
    category: 'Molhos & Extras',
    price: 6.9,
    rating: 4.6,
    preparationTime: '1 min',
    imageUrl: 'https://images.unsplash.com/photo-1604908177271-2b0dbd5b2d10?q=80&w=800',
    description: 'Porção de cheddar cremoso para acompanhar fritas e burgers.',
    size: 'P',
    tags: ['Extra', 'Queijos'],
    calories: 220
  },
];
