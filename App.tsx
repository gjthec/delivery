
import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Filter, X, ShoppingBag, ChefHat, ArrowRight, CheckCircle2, Star, Wand2, Wallet, Leaf, Zap, History, Loader2, User } from 'lucide-react';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import CartDrawer from './components/CartDrawer';
import { MENU_ITEMS, CATEGORIES } from './constants';
import { MenuItem, FilterType } from './types';
import { askWaiter } from './services/geminiService';

interface AiSuggestion {
  itemId: string;
  quantity: number;
  reason: string;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<{name: string, qty: number} | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Persistência de tema
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('foodai-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('foodai-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory ? item.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem, quantity: number = 1) => {
    const itemsToAdd = Array(quantity).fill(item);
    setCart(prev => [...prev, ...itemsToAdd]);
    setLastAddedItem({ name: item.name, qty: quantity });
    setTimeout(() => setLastAddedItem(null), 3000);
  };

  const handleQuickAction = async (text: string) => {
    setSearchQuery(text);
    setIsAiLoading(true);
    setAiSuggestions([]);
    setIsSearchFocused(false); // Esconde as sugestões após clicar
    const result = await askWaiter(text);
    if (result?.suggestions) {
        setAiSuggestions(result.suggestions);
        setTimeout(() => {
            const el = document.getElementById('ai-suggestions-anchor');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    setIsAiLoading(false);
  };

  const handleAskWaiter = async () => {
    if (!searchQuery) return;
    setIsAiLoading(true);
    setAiSuggestions([]);
    setIsSearchFocused(false);
    const result = await askWaiter(searchQuery);
    if (result?.suggestions) {
        setAiSuggestions(result.suggestions);
        setTimeout(() => {
            const el = document.getElementById('ai-suggestions-anchor');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    setIsAiLoading(false);
  };

  const quickPrompts = [
    { text: "Quero algo barato", icon: <Wallet size={16} className="text-orange-600" />, action: "Quero sugestões de pratos mais em conta no cardápio" },
    { text: "Quero comer saudável", icon: <Leaf size={16} className="text-green-600" />, action: "Quero opções leves e saudáveis" },
    { text: "Quero um lanche rápido", icon: <Zap size={16} className="text-yellow-500" />, action: "Quero algo que fique pronto rápido ou um lanche" },
    { text: "Quero repetir meu último pedido", icon: <History size={16} className="text-blue-500" />, action: "Quero o que pedi da última vez ou algo parecido" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300 pb-40">
      <Header 
        isDarkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onRemove={(idx) => setCart(prev => prev.filter((_, i) => i !== idx))}
        onClear={() => setCart([])}
      />

      {lastAddedItem && (
        <div className="fixed bottom-32 left-4 right-4 z-[100] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-slide-up border border-white/10 dark:border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={16} className="text-white" />
            </div>
            <p className="text-sm font-bold truncate">Adicionado à cesta!</p>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="text-orange-400 dark:text-orange-600 font-black text-xs uppercase tracking-widest px-2">
            Ver Tudo
          </button>
        </div>
      )}

      <main>
        <section className="px-6 pt-28 pb-4 bg-gradient-to-b from-orange-50/50 dark:from-orange-950/10 to-transparent">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-orange-100/50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full mb-3 border border-orange-200/50 dark:border-orange-500/20 animate-pulse">
              <Sparkles size={12} className="text-orange-600 dark:text-orange-400" />
              <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.15em]">Sabor Inteligente</span>
            </div>
            <h1 className="text-[2.5rem] font-[900] tracking-tighter leading-[0.95] mb-4 text-zinc-900 dark:text-zinc-50">
              O que você quer <br/> <span className="text-orange-500 italic text-[2.75rem]">sentir hoje?</span>
            </h1>
          </div>

          <div className="relative group mb-2">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors text-orange-500">
               {isAiLoading ? <Loader2 size={20} className="animate-spin text-orange-500" /> : <Sparkles size={20} />}
            </div>
            <input
              ref={searchInputRef}
              type="text"
              className="w-full pl-12 pr-28 py-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[1.8rem] shadow-2xl shadow-orange-100/20 dark:shadow-black/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:ring-4 focus:ring-orange-50 dark:focus:ring-orange-900/10 outline-none transition-all"
              placeholder='Ex: "Jantar romântico leve"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              // O timeout no blur permite que o clique nas sugestões seja registrado antes delas sumirem
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskWaiter()}
            />
            <button 
              onClick={handleAskWaiter}
              disabled={isAiLoading || !searchQuery}
              className="absolute right-2 top-2 bottom-2 px-6 orange-gradient text-white rounded-[1.4rem] font-black text-[10px] tracking-widest uppercase disabled:opacity-30 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : 'PEDIR'}
            </button>
          </div>
        </section>

        {/* ÁREA DE SUGESTÕES E CATEGORIAS STICKY */}
        <div className="sticky-nav bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl py-4 border-b border-gray-100 dark:border-zinc-900 z-40">
          
          {/* QUICK SUGGESTIONS (CHIPS) - Condicionado ao foco do input */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSearchFocused ? 'max-h-20 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-6 snap-x snap-mandatory">
              {quickPrompts.map((prompt, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleQuickAction(prompt.action)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm whitespace-nowrap hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-95 snap-start"
                >
                  {prompt.icon}
                  <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{prompt.text}</span>
                </button>
              ))}
              <button 
                  onClick={() => handleQuickAction("Quero uma sugestão aleatória e surpreendente do cardápio")}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl orange-gradient text-white shadow-lg shadow-orange-100 dark:shadow-orange-900/20 whitespace-nowrap active:scale-95 transition-all snap-start mr-6"
              >
                  <Sparkles size={16} />
                  <span className="text-[13px] font-bold">Surpreenda-me</span>
              </button>
            </div>
          </div>

          {/* FILTRO DE CATEGORIAS (Sempre visível para navegação rápida) */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar px-6 pb-1">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2
                ${activeCategory === null ? 'orange-gradient border-transparent text-white shadow-md' : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-500'}`}
            >
              Todos
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2
                  ${activeCategory === cat.name ? 'orange-gradient border-transparent text-white shadow-md' : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-500'}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div id="ai-suggestions-anchor"></div>
        {aiSuggestions.length > 0 && !isAiLoading && (
          <section className="mt-8 px-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <ChefHat size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-xl tracking-tight text-zinc-900 dark:text-zinc-50">O Garçom Sugere</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Personalizado para você</p>
              </div>
              <button onClick={() => setAiSuggestions([])} className="ml-auto text-gray-300 hover:text-zinc-900 dark:hover:text-zinc-50 p-2">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-6 hide-scrollbar -mx-6 px-6">
              {aiSuggestions.map((sug, idx) => {
                const item = MENU_ITEMS.find(i => i.id === sug.itemId);
                if (!item) return null;
                return (
                  <div key={idx} className="min-w-[300px] flex flex-col gap-4">
                    <div className="relative bg-zinc-900 dark:bg-zinc-800 text-white p-5 rounded-[2rem] border-b-4 border-orange-500 shadow-xl overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 text-orange-500">
                          <Sparkles size={48} />
                       </div>
                       <p className="text-sm font-medium leading-relaxed relative z-10 italic">
                         "{sug.reason}"
                       </p>
                    </div>
                    <div className="relative">
                      <MenuCard item={item} isHighlighted={true} onAdd={(i) => addToCart(i, sug.quantity)} />
                      {sug.quantity > 1 && (
                        <div className="absolute -top-3 -right-3 w-12 h-12 orange-gradient rounded-full flex items-center justify-center text-white font-black text-lg shadow-xl border-4 border-white dark:border-zinc-900">
                          {sug.quantity}x
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="px-6 pt-10 space-y-10">
          <div className="flex items-center justify-between">
            <div>
               <h3 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                 {activeCategory || "Nosso Cardápio"}
               </h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sabor artesanal em cada prato</p>
            </div>
            <span className="text-[10px] font-black text-zinc-400 bg-gray-50 dark:bg-zinc-900 px-3 py-1 rounded-full uppercase">{filteredItems.length} itens</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredItems.map((item, idx) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom-8 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                <MenuCard 
                  item={item} 
                  onAdd={(i) => addToCart(i, 1)}
                  isHighlighted={aiSuggestions.some(s => s.itemId === item.id)} 
                />
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
             <div className="py-20 text-center space-y-4 opacity-50">
                <Search size={48} className="mx-auto text-gray-300" />
                <p className="font-bold text-gray-400 italic">Nada por aqui! Tente outra busca.</p>
             </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-auto md:min-w-[420px] glass h-20 rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-white/10 flex items-center justify-around px-8 z-[60] animate-in slide-in-from-bottom-12 duration-1000">
        <button className="text-orange-500 flex flex-col items-center gap-1 relative">
          <div className="w-10 h-1 bg-orange-500 absolute -top-3 rounded-full"></div>
          <Search size={22} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Explorar</span>
        </button>
        
        <button className="text-zinc-300 dark:text-zinc-600 hover:text-orange-400 transition-colors flex flex-col items-center gap-1 group">
          <Filter size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Filtros</span>
        </button>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="text-zinc-300 dark:text-zinc-600 hover:text-orange-400 transition-colors flex flex-col items-center gap-1 group relative"
        >
          <ShoppingBag size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Pedidos</span>
          {cart.length > 0 && <span className="absolute top-0 -right-1 w-2.5 h-2.5 bg-orange-600 rounded-full border-2 border-white dark:border-zinc-900"></span>}
        </button>

        <button className="text-zinc-300 dark:text-zinc-600 hover:text-orange-400 transition-colors flex flex-col items-center gap-1 group">
          <User size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
