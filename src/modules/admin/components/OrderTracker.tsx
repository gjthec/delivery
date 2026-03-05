
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, MenuItem, CartItem, ExtraItem } from '../types';
import { dbOrders, dbMenu } from '../services/dbService';
import { INITIAL_CATEGORIES } from '../mockData';
import { 
  Clock, Package, Truck, CheckCircle2, XCircle, Search, 
  PlusCircle, Play, X, User, MapPin, CreditCard, ShoppingBag,
  ChevronRight, Minus, Plus, Trash2, Utensils
} from 'lucide-react';

interface OrderTrackerProps {
  externalSelectedOrderId?: string | null;
  onModalClose?: () => void;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendente',
  preparing: 'Cozinha',
  shipping: 'Expedição',
  completed: 'Entregue',
  cancelled: 'Cancelado',
};

const statusColors: Record<OrderStatus, { bg: string, text: string, icon: any }> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Clock },
  preparing: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: Play },
  shipping: { bg: 'bg-purple-500/10', text: 'text-purple-600', icon: Truck },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle2 },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-600', icon: XCircle },
};

const OrderTracker: React.FC<OrderTrackerProps> = ({ externalSelectedOrderId, onModalClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuCatalog, setMenuCatalog] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // State para Novo Pedido (PDV)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderCart, setNewOrderCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(INITIAL_CATEGORIES[0].name);

  useEffect(() => {
    loadOrders();
    loadMenu();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (externalSelectedOrderId && orders.length > 0) {
      const order = orders.find(o => o.id === externalSelectedOrderId);
      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [externalSelectedOrderId, orders]);

  const loadOrders = async () => {
    const data = await dbOrders.getAll();
    setOrders(data);
  };

  const loadMenu = async () => {
    const data = await dbMenu.getAll();
    setMenuCatalog(data);
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'pending': return 'preparing';
      case 'preparing': return 'shipping';
      case 'shipping': return 'completed';
      default: return null;
    }
  };

  const getActionButtonLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'Iniciar Preparo';
      case 'preparing': return 'Enviar p/ Entrega';
      case 'shipping': return 'Confirmar Entrega';
      default: return '';
    }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await dbOrders.updateStatus(orderId, newStatus);
    loadOrders();
    if (selectedOrder?.id === orderId) {
      const updated = await dbOrders.getAll();
      const current = updated.find(o => o.id === orderId);
      if (current) setSelectedOrder(current);
    }
  };

  // --- Lógica de Criação de Pedido ---

  const addToCart = (item: MenuItem, size: 'P' | 'M' | 'G') => {
    setNewOrderCart(prev => {
      // Ajuste de preço fictício por tamanho (poderia ser mais complexo)
      const sizeMultiplier = size === 'P' ? 0.8 : size === 'M' ? 1 : 1.2;
      const adjustedPrice = item.price * sizeMultiplier;
      
      // Cria um item modificado para o carrinho refletindo o tamanho escolhido
      const cartMenuItem: MenuItem = { ...item, size: size, price: adjustedPrice };

      const existing = prev.find(i => i.menuItem.id === item.id && i.menuItem.size === size);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        menuItem: cartMenuItem, 
        quantity: 1, 
        removedIngredients: [], 
        selectedExtras: [] 
      }];
    });
  };

  const removeFromCart = (index: number) => {
    setNewOrderCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setNewOrderCart(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleCreateOrder = async () => {
    if (!newOrderCustomer.trim() || newOrderCart.length === 0) {
      alert("Preencha o nome do cliente e adicione itens.");
      return;
    }

    const total = newOrderCart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
    
    const newOrder: Order = {
      id: `PED-${Math.floor(Math.random() * 9000 + 1000)}`,
      customerName: newOrderCustomer,
      items: newOrderCart,
      total: total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      payment: { method: 'pix' }, // Default for manual entry
      address: { 
        label: 'Balcão', 
        street: 'Retirada no Local', 
        number: 'S/N', 
        neighborhood: '', 
        city: 'Loja Física', 
        state: '', 
        zipCode: '' 
      }
    };

    await dbOrders.add(newOrder);
    
    // Dispara evento global
    const event = new CustomEvent('PLATFORM_NEW_ORDER', { detail: newOrder });
    window.dispatchEvent(event);

    setIsCreateModalOpen(false);
    setNewOrderCustomer('');
    setNewOrderCart([]);
    loadOrders();
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    if (!matchesSearch) return false;
    
    if (filter === 'active') return ['pending', 'preparing', 'shipping'].includes(o.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(o.status);
    return true;
  });

  const cartTotal = newOrderCart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);

  const closeDetail = () => {
    setSelectedOrder(null);
    if (onModalClose) onModalClose();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 uppercase tracking-tight text-stroke-sm">Monitor de Comandas</h1>
          <p className="text-sm text-stone-500 font-medium">Acompanhamento em tempo real do fluxo operacional.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex p-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm">
            {(['active', 'completed', 'all'] as const).map((f) => (
                <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-stone-400'}`}
                >
                    {f === 'active' ? 'Ativos' : f === 'completed' ? 'Finalizados' : 'Todos'}
                </button>
            ))}
          </div>

          <div className="relative flex-1 sm:flex-none min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-bold outline-none shadow-sm focus:border-orange-500 transition-all"
            />
          </div>

          <button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="flex items-center gap-2 bg-stone-950 dark:bg-stone-800 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-stone-900 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-stone-950/20"
          >
            <PlusCircle size={18} /> Novo Pedido
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOrders.map((order) => {
            const StatusIcon = statusColors[order.status].icon;
            const nextStatus = getNextStatus(order.status);
            
            return (
                <div 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer"
                >
                    <div className="p-5 border-b border-stone-50 dark:border-stone-800 flex items-center justify-between">
                        <span className="text-[10px] font-black text-stone-400">{order.id}</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${statusColors[order.status].bg} ${statusColors[order.status].text}`}>
                            <StatusIcon size={12} />
                            {statusLabels[order.status]}
                        </div>
                    </div>

                    <div className="p-6 flex-1 space-y-4">
                        <h3 className="text-base font-black text-stone-800 dark:text-stone-100 uppercase truncate leading-tight group-hover:text-orange-500 transition-colors">{order.customerName}</h3>
                        <div className="space-y-1.5">
                            {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-stone-500">
                                    <span className="truncate">{item.quantity}x {item.menuItem.name} <span className="text-[9px] bg-stone-100 dark:bg-stone-800 px-1 rounded text-stone-400 ml-1">{item.menuItem.size}</span></span>
                                </div>
                            ))}
                            {order.items.length > 2 && <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">+ {order.items.length - 2} itens</p>}
                        </div>
                        <div className="pt-2 flex items-baseline justify-between">
                            <span className="text-xl font-black text-stone-900 dark:text-white">R$ {order.total.toFixed(2)}</span>
                            <span className="text-[9px] font-black text-stone-400 uppercase">{order.payment.method}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-stone-50 dark:bg-stone-800/30 flex gap-2" onClick={e => e.stopPropagation()}>
                        {nextStatus ? (
                            <button 
                                onClick={() => updateStatus(order.id, nextStatus)}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/10 hover:bg-orange-600 transition-all"
                            >
                                {getActionButtonLabel(order.status)}
                            </button>
                        ) : (
                            <div className="flex-1 py-3 text-center text-stone-300 text-[10px] font-black uppercase tracking-widest border border-stone-200 dark:border-stone-700 rounded-xl">
                                Finalizado
                            </div>
                        )}
                        <button 
                            onClick={() => updateStatus(order.id, 'cancelled')}
                            className="p-3 bg-white dark:bg-stone-800 text-stone-400 hover:text-red-500 rounded-xl transition-all border border-stone-100 dark:border-stone-700 shadow-sm"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO DE PEDIDO (PDV) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-stone-100 dark:bg-stone-950 w-full max-w-6xl h-[85vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-300 border border-stone-200 dark:border-stone-800">
            
            {/* ESQUERDA: CATÁLOGO */}
            <div className="flex-1 flex flex-col bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800">
              <div className="p-6 border-b border-stone-100 dark:border-stone-800">
                <h2 className="text-xl font-black uppercase text-stone-800 dark:text-white mb-4">Catálogo de Produtos</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {INITIAL_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${selectedCategory === cat.name ? 'bg-orange-500 text-white shadow-lg' : 'bg-stone-50 dark:bg-stone-800 text-stone-500'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  <button onClick={() => setSelectedCategory('Todos')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${selectedCategory === 'Todos' ? 'bg-orange-500 text-white' : 'bg-stone-50 dark:bg-stone-800 text-stone-500'}`}>Todos</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuCatalog.filter(i => selectedCategory === 'Todos' || i.category === selectedCategory).map(item => (
                    <div key={item.id} className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-3xl border border-stone-100 dark:border-stone-800 flex flex-col group hover:border-orange-500/50 transition-all">
                      <div className="h-24 w-full bg-white dark:bg-stone-800 rounded-2xl mb-3 overflow-hidden">
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="text-xs font-black text-stone-800 dark:text-white uppercase line-clamp-1">{item.name}</h3>
                      <p className="text-[10px] text-stone-400 font-bold mb-3">{item.category}</p>
                      
                      <div className="mt-auto space-y-2">
                        <div className="text-sm font-black text-stone-900 dark:text-white">R$ {item.price.toFixed(2)}</div>
                        <div className="grid grid-cols-3 gap-1">
                          {(['P', 'M', 'G'] as const).map(size => (
                            <button 
                              key={size}
                              onClick={() => addToCart(item, size)}
                              className="py-1.5 bg-white dark:bg-stone-800 rounded-lg text-[10px] font-bold text-stone-500 hover:bg-orange-500 hover:text-white transition-colors border border-stone-200 dark:border-stone-700"
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DIREITA: CARRINHO / CHECKOUT */}
            <div className="w-full md:w-[400px] flex flex-col bg-stone-50 dark:bg-stone-950">
              <div className="p-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex justify-between items-center">
                <h2 className="text-lg font-black uppercase text-stone-800 dark:text-white">Novo Pedido</h2>
                <button onClick={() => setIsCreateModalOpen(false)}><X className="text-stone-400 hover:text-red-500" /></button>
              </div>

              <div className="p-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 z-10">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Cliente</label>
                <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 focus-within:border-orange-500 transition-colors">
                  <User size={16} className="text-stone-400" />
                  <input 
                    value={newOrderCustomer}
                    onChange={(e) => setNewOrderCustomer(e.target.value)}
                    placeholder="Nome do cliente..." 
                    className="bg-transparent text-sm font-bold outline-none w-full dark:text-white"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {newOrderCart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-50 space-y-4">
                    <ShoppingBag size={48} />
                    <p className="text-xs font-black uppercase">Carrinho vazio</p>
                  </div>
                ) : (
                  newOrderCart.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex justify-between items-center animate-in slide-in-from-right-4 duration-300">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-800 dark:text-white uppercase max-w-[140px] truncate">{item.menuItem.name}</span>
                          <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[9px] font-black">{item.menuItem.size}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-bold">R$ {item.menuItem.price.toFixed(2)} un.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 rounded-lg p-1">
                          <button onClick={() => item.quantity > 1 ? updateCartQuantity(idx, -1) : removeFromCart(idx)} className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded"><Minus size={12} /></button>
                          <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(idx, 1)} className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded"><Plus size={12} /></button>
                        </div>
                        <div className="text-xs font-black w-16 text-right">R$ {(item.menuItem.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-stone-400 uppercase">Total do Pedido</span>
                  <span className="text-2xl font-black text-stone-800 dark:text-white">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCreateOrder}
                  disabled={newOrderCart.length === 0 || !newOrderCustomer}
                  className="w-full py-4 bg-stone-900 dark:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirmar Pedido
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DO PEDIDO (VISUALIZAÇÃO) */}
      {selectedOrder && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500 border border-white/10">
                
                {/* Header do Modal */}
                <div className="p-8 border-b border-stone-50 dark:border-stone-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur z-10">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-3xl ${statusColors[selectedOrder.status].bg} ${statusColors[selectedOrder.status].text}`}>
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-stone-800 dark:text-white">{selectedOrder.id}</h2>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={closeDetail} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-red-500 transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    
                    {/* Status e Valor */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Status Atual</label>
                            <div className={`p-5 rounded-2xl font-black text-xs uppercase flex items-center gap-2 ${statusColors[selectedOrder.status].bg} ${statusColors[selectedOrder.status].text}`}>
                                {React.createElement(statusColors[selectedOrder.status].icon, { size: 16 })}
                                {statusLabels[selectedOrder.status]}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Total Geral</label>
                            <div className="p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl font-black text-xl text-stone-900 dark:text-white">
                                R$ {selectedOrder.total.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Cliente e Endereço */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                                <User size={14} className="text-orange-500" /> Cliente
                            </h4>
                            <div className="p-5 bg-stone-50 dark:bg-stone-800/50 rounded-3xl space-y-2">
                                <p className="text-sm font-black text-stone-800 dark:text-white uppercase">{selectedOrder.customerName}</p>
                                <div className="flex items-center gap-2 text-stone-400 text-xs">
                                    <CreditCard size={14} />
                                    <span className="font-bold uppercase tracking-wider">{selectedOrder.payment.method}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                                <MapPin size={14} className="text-orange-500" /> Entrega
                            </h4>
                            <div className="p-5 bg-stone-50 dark:bg-stone-800/50 rounded-3xl">
                                <p className="text-[11px] font-bold text-stone-800 dark:text-stone-200 leading-relaxed">
                                    {selectedOrder.address.street}, {selectedOrder.address.number}<br/>
                                    {selectedOrder.address.neighborhood} - {selectedOrder.address.city}/{selectedOrder.address.state}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Itens */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                            <ShoppingBag size={14} className="text-orange-500" /> Itens do Pedido
                        </h4>
                        <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-100 dark:border-stone-800 rounded-[2rem] bg-white dark:bg-stone-950 overflow-hidden">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0">
                                            <img src={item.menuItem.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-stone-800 dark:text-white uppercase">
                                                {item.quantity}x {item.menuItem.name}
                                                <span className="ml-2 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[9px] text-stone-500">{item.menuItem.size}</span>
                                            </p>
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{item.menuItem.category}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-stone-900 dark:text-white">R$ {(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer do Modal */}
                <div className="p-8 border-t border-stone-50 dark:border-stone-800 bg-white dark:bg-stone-900 sticky bottom-0 flex gap-4">
                    <button 
                        onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                        className="flex-1 py-5 border border-stone-200 dark:border-stone-700 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-red-500 hover:border-red-500 transition-all"
                    >
                        Cancelar Pedido
                    </button>
                    {getNextStatus(selectedOrder.status) && (
                        <button 
                            onClick={() => updateStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                            className="flex-[2] py-5 bg-orange-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {getActionButtonLabel(selectedOrder.status)} <ChevronRight size={16} />
                            </span>
                        </button>
                    )}
                </div>

              </div>
          </div>
      )}
    </div>
  );
};

export default OrderTracker;
