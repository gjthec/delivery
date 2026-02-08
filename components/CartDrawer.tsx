
import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { MenuItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, items, onRemove, onClear }) => {
  const total = items.reduce((acc, item) => acc + item.price, 0);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed bottom-0 right-0 h-[85vh] md:h-full w-full md:w-[420px] bg-white dark:bg-zinc-950 z-[70] shadow-2xl transition-transform duration-500 ease-out transform bottom-sheet md:rounded-none ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:translate-y-0'}`}>
        <div className="flex flex-col h-full">
          {/* Drag Handle for Mobile */}
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mt-4 mb-2 md:hidden" />

          {/* Header */}
          <div className="p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Cesta de Pedidos</h2>
              <p className="text-gray-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">{items.length} {items.length === 1 ? 'item' : 'itens'} selecionados</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-gray-50 dark:bg-zinc-900 flex items-center justify-center rounded-full text-zinc-400">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-10">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center">
                  <ShoppingBag size={48} className="dark:text-zinc-100" />
                </div>
                <p className="font-bold text-gray-500 dark:text-zinc-400 italic">Sua cesta está vazia...<br/>A IA pode te ajudar!</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-4 items-center group animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1">TAM. {item.size}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-black text-orange-600">R${item.price.toFixed(2)}</span>
                      <button 
                        onClick={() => onRemove(index)}
                        className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer sticky bottom */}
          {items.length > 0 && (
            <div className="p-6 bg-white dark:bg-zinc-950 border-t border-gray-50 dark:border-zinc-800 pb-10 md:pb-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Total do Pedido</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">R$ {total.toFixed(2)}</span>
              </div>
              
              <button className="w-full py-5 orange-gradient text-white rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-orange-100 dark:shadow-orange-950/20 hover:shadow-orange-200 active:scale-[0.98] transition-all">
                CONFIRMAR E PAGAR <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
