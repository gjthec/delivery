
import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Filter, X, ShoppingBag, ChefHat, ArrowRight, CheckCircle2, Star, Wand2, Wallet, Leaf, Zap, History, Loader2, User, Home, Bell, Tag, MapPin, Truck, UtensilsCrossed, PackageCheck, Copy, QrCode, Plus, Clock } from 'lucide-react';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import CartDrawer from './components/CartDrawer';
import PixPaymentModal from './components/PixPaymentModal';
import CategoryIcon from './components/CategoryIcon';
import ItemDetailModal from './components/ItemDetailModal';
import ProfileModal from './components/ProfileModal';
import { MENU_ITEMS, CATEGORIES, IS_FIREBASE_ON } from './constants';
import { AdminNotification, MenuItem, FilterType, CartItem, ExtraItem, CheckoutDetails, Category } from './types';
import { askWaiter } from './services/geminiService';
import { clearUserNotificationsFromFirebase, fetchCategoriesFromFirebase, fetchMenuFromFirebase, saveOrderToFirebase, subscribeToStoreSettingsFromFirebase, subscribeToUserNotifications, toFirebaseOrder } from './services/firebaseService';

interface AiSuggestion {
  itemId: string;
  quantity: number;
  reason: string;
}

interface CheckoutSession {
  orderId: string;
  details: CheckoutDetails;
  total: number;
  savedToDatabase: boolean;
}

const App: React.FC = () => {
  // Dados dinâmicos (Menu e Categorias)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(5.90);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartJiggling, setIsCartJiggling] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const PIX_CODE = "00020126330014br.gov.bcb.pix0111123456789015204000053039865802BR5925FoodAI Restaurantes6009Sao Paulo62070503***6304E2D1";
  const WHATSAPP_NUMBER = "5535998842525"; 

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('foodai-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Efeito para carregar dados do Firebase ao iniciar
  useEffect(() => {
    if (IS_FIREBASE_ON) {
      const loadFirebaseData = async () => {
        setIsLoadingData(true);
        const [fbMenu, fbCategories] = await Promise.all([
          fetchMenuFromFirebase(),
          fetchCategoriesFromFirebase()
        ]);
        
        if (fbMenu) setMenuItems(fbMenu);
        if (fbCategories) setCategories(fbCategories);
        setIsLoadingData(false);
      };
      loadFirebaseData();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToStoreSettingsFromFirebase((storeSettings) => {
      if (storeSettings?.deliveryFee !== undefined) {
        setDeliveryFee(storeSettings.deliveryFee);
      } else {
        setDeliveryFee(5.90);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('foodai-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isCartOpen || isPixModalOpen || isDetailModalOpen || isProfileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isCartOpen, isPixModalOpen, isDetailModalOpen, isProfileOpen]);


  useEffect(() => {
    const unsubscribe = subscribeToUserNotifications((userNotifications) => {
      setNotifications(userNotifications);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (activeCategory === 'Promoções') {
      matchesCategory = !!(item.originalPrice && item.originalPrice > item.price);
    } else if (activeCategory) {
      matchesCategory = item.category === activeCategory;
    }

    return matchesSearch && matchesCategory;
  });

  const getItemCountInCart = (itemId: string) => {
    return cart
      .filter(cartItem => cartItem.item.id === itemId)
      .reduce((acc, curr) => acc + curr.quantity, 0);
  };

  const saveToCart = (item: MenuItem, quantity: number, removedIngredients: string[], selectedExtras: ExtraItem[], observations: string) => {
    if (editingCartIndex !== null) {
      const updatedCart = [...cart];
      updatedCart[editingCartIndex] = {
        ...updatedCart[editingCartIndex],
        quantity,
        removedIngredients,
        selectedExtras,
        observations
      };
      setCart(updatedCart);
      setEditingCartIndex(null);
    } else {
      const newCartItem: CartItem = {
        cartId: Math.random().toString(36).substr(2, 9),
        item,
        quantity,
        removedIngredients,
        selectedExtras,
        observations
      };
      setCart(prev => [...prev, newCartItem]);
    }
    
    setIsCartJiggling(true);
    setTimeout(() => setIsCartJiggling(false), 500);
  };

  const openItemDetails = (item: MenuItem) => {
    setEditingCartIndex(null);
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleEditCartItem = (index: number) => {
    const cartItem = cart[index];
    setEditingCartIndex(index);
    setSelectedItem(cartItem.item);
    setIsDetailModalOpen(true);
  };

  const sendWhatsAppMessage = (details: any, items: CartItem[], total: number) => {
    let message = `*🍔 NOVO PEDIDO - FoodAI*%0A%0A`;
    message += `*Itens do Pedido:*%0A`;
    items.forEach(ci => {
      const extras = ci.selectedExtras.length > 0 ? ` (+ ${ci.selectedExtras.map(e => e.name).join(', ')})` : '';
      const removed = ci.removedIngredients.length > 0 ? ` (sem ${ci.removedIngredients.join(', ')})` : '';
      message += `• ${ci.quantity}x ${ci.item.name}${extras}${removed}%0A`;
      if (ci.observations) message += `   _Obs: ${ci.observations}_%0A`;
    });
    
    message += `%0A*Endereço de Entrega:*%0A`;
    message += `${details.address.label}: ${details.address.street}, ${details.address.number}`;
    if (details.address.complement) message += ` (${details.address.complement})`;
    message += `%0A${details.address.neighborhood}, ${details.address.city}/${details.address.state}%0A`;
    
    message += `%0A*Pagamento:* ${details.payment.type.toUpperCase()}`;
    if (details.payment.brand) message += ` - Bandeira: ${details.payment.brand.toUpperCase()}`;
    if (details.payment.changeFor) message += `%0A*Troco para:* R$ ${details.payment.changeFor}`;
    
    if (details.customer) {
      message += `%0A%0A*Cliente:* ${details.customer.name}`;
      message += `%0A*Telefone:* ${details.customer.phone}`;
    }

    message += `%0A%0A*VALOR TOTAL: R$ ${total.toFixed(2)}*`;
    message += `%0A%0A_Enviado via FoodAI App_`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const generateOrderId = () => `PED-${Date.now().toString().slice(-6)}`;

  const processOrderToDatabase = async (orderId: string, details: CheckoutDetails, items: CartItem[], total: number) => {
    const orderForDb = toFirebaseOrder({
      id: orderId,
      customerName: details.customer.name || 'Cliente FoodAI',
      details,
      items,
      total
    });

    return saveOrderToFirebase(orderForDb);
  };

  const handleCheckout = async (details: CheckoutDetails) => {
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((acc, ci) => {
      const extrasTotal = ci.selectedExtras.reduce((ea, ec) => ea + ec.price, 0);
      return acc + ((ci.item.price + extrasTotal) * ci.quantity);
    }, 0);
    const finalTotal = subtotal + deliveryFee;

    const orderId = generateOrderId();

    setCurrentTotal(finalTotal);
    setIsCartOpen(false);

    let savedToDatabase = false;

    // Se Firebase estiver On, salva no banco ANTES de qualquer coisa
    if (IS_FIREBASE_ON) {
      savedToDatabase = await processOrderToDatabase(orderId, details, cart, finalTotal);
    }

    setCheckoutSession({
      orderId,
      details,
      total: finalTotal,
      savedToDatabase
    });

    if (details.payment.type === 'pix') {
      setIsPixModalOpen(true);
    } else {
      sendWhatsAppMessage(details, cart, finalTotal);
      setCart([]); 
    }
  };

  const handlePixConfirmed = async () => {
    if (checkoutSession) {
      let wasSaved = checkoutSession.savedToDatabase;

      // Se não salvou no checkout (ex: por erro), tenta garantir o salvamento aqui com o MESMO id do pedido
      if (IS_FIREBASE_ON && !wasSaved) {
        wasSaved = await processOrderToDatabase(checkoutSession.orderId, checkoutSession.details, cart, checkoutSession.total);
      }

      sendWhatsAppMessage(checkoutSession.details, cart, checkoutSession.total);

      setCheckoutSession((prev) => prev ? { ...prev, savedToDatabase: wasSaved } : prev);
    }
    setCart([]); 
    setIsPixModalOpen(false);
  };

  const clearNotifications = async () => {
    const notificationIds = notifications.map((notification) => notification.id);

    setNotifications([]);
    await clearUserNotificationsFromFirebase(notificationIds);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleAskWaiter = async (overrideQuery?: string) => {
    const finalQuery = overrideQuery || searchQuery;
    if (!finalQuery) return;
    
    setSearchQuery(finalQuery);
    setIsAiLoading(true);
    setAiSuggestions([]);
    setIsSearchFocused(false);
    
    // Passamos o menuItems (que pode ser do Firebase) para a IA
    const result = await askWaiter(finalQuery, menuItems);
    if (result?.suggestions) {
        setAiSuggestions(result.suggestions);
        setTimeout(() => {
            const el = document.getElementById('ai-suggestions-anchor');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    setIsAiLoading(false);
  };

  const handleExploreClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      searchInputRef.current?.focus();
      setIsSearchFocused(true);
    }, 500);
  };

  const quickPrompts = [
    { text: "Quero algo barato", icon: <Wallet size={16} className="text-orange-500" />, action: "Quero opções de lanches e pratos mais baratos do cardápio" },
    { text: "Quero comer saudável", icon: <Leaf size={16} className="text-green-500" />, action: "Quero opções saudáveis, leves e com baixas calorias" },
    { text: "Quero um lanche rápido", icon: <Zap size={16} className="text-yellow-500" />, action: "Quero algo que fique pronto rápido para matar minha fome agora" },
    { text: "Quero repetir meu último pedido", icon: <History size={16} className="text-blue-500" />, action: "Quero repetir o combo de burger artesanal com fritas" }
  ];

  const currentInitialData = editingCartIndex !== null ? {
    removedIngredients: cart[editingCartIndex].removedIngredients,
    selectedExtras: cart[editingCartIndex].selectedExtras,
    observations: cart[editingCartIndex].observations,
    quantity: cart[editingCartIndex].quantity
  } : null;

  const shouldHideFooter = isCartOpen || isPixModalOpen || isDetailModalOpen || isSearchFocused;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300 pb-44 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      
      {/* Loading Overlay for Firebase */}
      {isLoadingData && (
        <div className="fixed inset-0 z-[300] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <Loader2 size={40} className="text-orange-500 animate-spin" />
          <p className="font-black text-xs uppercase tracking-[0.3em] text-orange-600">Sincronizando Cardápio...</p>
        </div>
      )}

      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${isCartOpen || isPixModalOpen || isDetailModalOpen ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <Header 
          isDarkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          notifications={notifications}
          onReadNotifications={markNotificationsAsRead}
          onClearNotifications={clearNotifications}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      </div>
      
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cart}
        onRemove={(idx) => setCart(prev => prev.filter((_, i) => i !== idx))}
        onEdit={handleEditCartItem}
        onClear={() => setCart([])}
        onCheckout={handleCheckout}
        deliveryFee={deliveryFee}
      />

      <PixPaymentModal 
        isOpen={isPixModalOpen} 
        onClose={() => setIsPixModalOpen(false)} 
        onConfirm={handlePixConfirmed}
        pixCode={PIX_CODE} 
        total={currentTotal} 
      />

      <ItemDetailModal 
        isOpen={isDetailModalOpen}
        item={selectedItem}
        initialData={currentInitialData}
        onClose={() => { setIsDetailModalOpen(false); setEditingCartIndex(null); }}
        onAddToCart={(custom) => {
          if (selectedItem) {
            saveToCart(selectedItem, custom.quantity, custom.removedIngredients, custom.selectedExtras, custom.observations);
          }
        }}
      />

      <main>
        <section className="px-6 pt-32 pb-4 bg-gradient-to-b from-orange-50/50 dark:from-orange-950/10 to-transparent">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-100/50 dark:bg-orange-500/10 px-4 py-2 rounded-full mb-4 border border-orange-200/50 dark:border-orange-500/20">
              <Sparkles size={14} className="text-orange-600" />
              <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em]">Inteligência Gastronômica</span>
            </div>
            <h1 className="text-[2.75rem] font-[900] tracking-tighter leading-[0.9] mb-4">
              O que você quer <br/> <span className="text-orange-500 italic text-[3rem]">sentir hoje?</span>
            </h1>
          </div>

          <div className="relative group mb-8">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors text-orange-500 z-10">
               {isAiLoading ? <Loader2 size={22} className="animate-spin" /> : <Sparkles size={22} />}
            </div>
            <input
              ref={searchInputRef}
              type="text"
              className="w-full pl-14 pr-20 py-5 md:py-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.2rem] shadow-xl text-sm md:text-base font-semibold outline-none transition-all placeholder:truncate"
              placeholder='Ex: "Jantar leve para dois"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskWaiter()}
            />
            <button 
              onClick={() => handleAskWaiter()}
              disabled={isAiLoading || !searchQuery}
              className="absolute right-2.5 top-2.5 bottom-2.5 aspect-square orange-gradient text-white rounded-full flex items-center justify-center shadow-xl shadow-orange-500/20 disabled:opacity-30 transition-all active:scale-90"
            >
              {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} strokeWidth={3} />}
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSearchFocused && !searchQuery ? 'max-h-24 opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-1 snap-x snap-mandatory">
              {quickPrompts.map((prompt, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleAskWaiter(prompt.action)}
                  className="flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-lg shadow-black/5 whitespace-nowrap hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-95 snap-start"
                >
                  {prompt.icon}
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{prompt.text}</span>
                </button>
              ))}
              <button 
                  onClick={() => handleAskWaiter("Quero uma sugestão aleatória e surpreendente do cardápio")}
                  className="flex items-center gap-2.5 px-6 py-4 rounded-2xl orange-gradient text-white shadow-xl shadow-orange-500/20 whitespace-nowrap active:scale-95 transition-all snap-start"
              >
                  <Sparkles size={16} />
                  <span className="text-sm font-black uppercase tracking-widest">Surpreenda-me</span>
              </button>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar items-center py-4 mb-4 -mx-6 px-6">
            <CategoryIcon 
              category={{ id: 'all', name: 'Todos', icon: '🍲', color: 'bg-orange-100' }}
              isActive={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            />
            {categories.map(cat => (
              <CategoryIcon 
                key={cat.id}
                category={cat}
                isActive={activeCategory === cat.name}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              />
            ))}
          </div>
        </section>

        <div id="ai-suggestions-anchor" className="scroll-mt-32" />

        {aiSuggestions.length > 0 && (
          <section className="px-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="bg-orange-50/50 dark:bg-orange-950/10 rounded-[3rem] p-8 border border-orange-100 dark:border-orange-500/10">
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 orange-gradient rounded-2xl flex items-center justify-center text-white shadow-lg"><ChefHat size={28} /></div>
                 <div>
                   <h2 className="text-2xl font-black tracking-tighter">Sugestões do Garçom AI</h2>
                   <p className="text-xs font-bold text-orange-600/60 uppercase tracking-widest">Baseado no seu pedido</p>
                 </div>
                 <button onClick={() => setAiSuggestions([])} className="ml-auto w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-400"><X size={18} /></button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {aiSuggestions.map((suggestion, idx) => {
                   const item = menuItems.find(i => i.id === suggestion.itemId);
                   if (!item) return null;
                   return (
                     <div key={idx} className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col h-full" onClick={() => openItemDetails(item)}>
                       <div className="flex gap-4 mb-4">
                         <img src={item.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
                         <div className="flex-1 min-w-0">
                           <h4 className="font-black text-sm truncate">{item.name}</h4>
                           <span className="text-xs font-bold text-orange-500">R$ {item.price.toFixed(2)}</span>
                         </div>
                       </div>
                       <p className="text-[11px] font-medium text-zinc-500 mb-6 flex-1 italic leading-relaxed">"{suggestion.reason}"</p>
                       <button 
                         onClick={(e) => { e.stopPropagation(); saveToCart(item, suggestion.quantity, [], [], ""); }}
                         className="w-full py-3 orange-gradient text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                       >
                         <Plus size={14} /> Adicionar {suggestion.quantity}x
                       </button>
                     </div>
                   );
                 })}
               </div>
             </div>
          </section>
        )}

        <section className="px-6 pt-4 space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredItems.map((item, idx) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom-10 duration-700" style={{ animationDelay: `${idx * 40}ms` }} onClick={() => openItemDetails(item)}>
                <MenuCard item={item} onAdd={(i) => saveToCart(i, 1, [], [], "")} count={getItemCountInCart(item.id)} />
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className={`fixed bottom-8 left-0 right-0 flex justify-center px-6 z-[50] pointer-events-none transition-all duration-500 ${shouldHideFooter ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <nav className="pointer-events-auto flex items-center gap-1 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-zinc-200/50 dark:border-white/5">
          <button onClick={handleExploreClick} className="px-8 py-4 flex flex-col items-center gap-1.5 transition-all text-orange-500">
            <Search size={22} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest">Explorar</span>
          </button>
          <div className="w-[1px] h-8 bg-zinc-100 dark:bg-zinc-800/50"></div>
          <button onClick={() => setIsCartOpen(true)} className={`relative px-8 py-4 flex flex-col items-center gap-1.5 transition-all ${cart.length > 0 ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'} ${isCartJiggling ? 'animate-jiggle' : ''}`}>
            <div className="relative">
              <ShoppingBag size={22} strokeWidth={2.5} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">{cart.length}</span>}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Pedidos</span>
          </button>
          <div className="w-[1px] h-8 bg-zinc-100 dark:bg-zinc-800/50"></div>
          <button className="px-8 py-4 flex flex-col items-center gap-1.5 text-zinc-400">
            <User size={22} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;
