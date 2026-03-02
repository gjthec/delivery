import React, { useEffect, useState } from 'react';
import { Loader2, ShoppingBag, X } from 'lucide-react';
import { FirebaseOrder, fetchOrdersByPhone } from '../services/firebaseService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const OrdersModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [phone, setPhone] = useState(() => localStorage.getItem('foodai-customer-phone') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isOpen && phone) {
      handleSearch();
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!phone.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    localStorage.setItem('foodai-customer-phone', phone);

    const fetchedOrders = await fetchOrdersByPhone(phone);
    setOrders(fetchedOrders || []);

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-end sm:items-center justify-center sm:px-6">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 sm:rounded-[3rem] rounded-t-[2.5rem] h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500">
        <div className="px-8 py-6 flex items-center justify-between shrink-0 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">Meus Pedidos</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Histórico de Compras</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-orange-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 hide-scrollbar">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2">Buscar histórico</h3>
            <div className="p-5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2 px-1">Telefone / WhatsApp</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Ex: (11) 99999-9999"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 focus:border-orange-500/50 rounded-2xl px-4 py-3 text-sm font-black outline-none transition-all"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !phone.trim()}
                    className="px-6 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                  </button>
                </div>
                <p className="text-[9px] text-zinc-400 mt-2 px-1">Informe seu telefone para consultar os pedidos anteriores.</p>
              </div>
            </div>
          </div>

          {hasSearched && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 px-2 flex items-center gap-2">
                <ShoppingBag size={14} />
                Últimos Pedidos
              </h3>

              {orders.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                  <p className="text-sm font-bold text-zinc-400">Nenhum pedido encontrado para este número.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <div key={order.id || idx} className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {order.status === 'pending' ? 'Pendente' : order.status}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-zinc-600 dark:text-zinc-300">
                              <span className="font-black text-zinc-900 dark:text-zinc-100 mr-2">{item.quantity}x</span>
                              {item.menuItem.name}
                            </span>
                            <span className="font-black text-zinc-900 dark:text-zinc-100">R$ {(item.menuItem.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total</span>
                        <span className="text-lg font-black text-orange-500">R$ {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersModal;
