
import React, { useState, useMemo, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, Info, Flame, Clock, Star, MessageSquareQuote, Check, ChevronDown, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';
import { MenuItem, ExtraItem } from '../types';

interface Props {
  item: MenuItem | null;
  initialData?: { removedIngredients: string[], selectedExtras: ExtraItem[], observations: string, quantity: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizations: { removedIngredients: string[], selectedExtras: ExtraItem[], observations: string, quantity: number }) => void;
}

const ItemDetailModal: React.FC<Props> = ({ item, initialData, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraItem[]>([]);
  const [observations, setObservations] = useState('');

  // Sincroniza estado com dados iniciais quando o modal abre para edição
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setQuantity(initialData.quantity);
        setRemovedIngredients(initialData.removedIngredients);
        setSelectedExtras(initialData.selectedExtras);
        setObservations(initialData.observations);
      } else {
        setQuantity(1);
        setRemovedIngredients([]);
        setSelectedExtras([]);
        setObservations('');
      }
    }
  }, [isOpen, initialData, item]);

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    const extrasTotal = selectedExtras.reduce((acc, curr) => acc + curr.price, 0);
    return (item.price + extrasTotal) * quantity;
  }, [item, selectedExtras, quantity]);

  if (!item) return null;

  const toggleIngredient = (ingredient: string) => {
    setRemovedIngredients(prev => 
      prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient) 
        : [...prev, ingredient]
    );
  };

  const toggleExtra = (extra: ExtraItem) => {
    setSelectedExtras(prev => 
      prev.some(e => e.name === extra.name)
        ? prev.filter(e => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  const handleAdd = () => {
    onAddToCart({ removedIngredients, selectedExtras, observations, quantity });
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-end justify-center transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className={`relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-t-[3.5rem] shadow-2xl transition-all duration-500 transform flex flex-col max-h-[92vh] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Superior: Imagem e Botão Fechar */}
        <div className="relative h-60 md:h-72 shrink-0">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-black/20" />
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/30 rounded-full" />
          
          <button onClick={onClose} className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-xl transition-all z-20">
            <X size={24} strokeWidth={2.5} />
          </button>

          {/* Badges Flutuantes na Imagem */}
          <div className="absolute bottom-6 left-8 flex gap-3">
             <div className="flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
                <Star size={14} className="text-orange-500 fill-orange-500" />
                <span className="text-xs font-black">{item.rating}</span>
             </div>
             <div className="flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
                <Clock size={14} className="text-orange-500" />
                <span className="text-xs font-black uppercase">{item.preparationTime}</span>
             </div>
          </div>
        </div>

        {/* Conteúdo Scrollable */}
        <div className="overflow-y-auto px-8 py-6 space-y-10 hide-scrollbar pb-40">
          
          {/* Header Texto */}
          <div>
            <div className="flex justify-between items-start gap-4 mb-3">
              <h2 className="text-3xl font-black tracking-tighter leading-tight flex-1">{item.name}</h2>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-orange-600">R$ {item.price.toFixed(2)}</p>
                {item.originalPrice && <p className="text-xs font-bold text-zinc-400 line-through">R$ {item.originalPrice.toFixed(2)}</p>}
              </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Seção: Retirar Ingredientes */}
          {item.ingredients && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 orange-gradient rounded-full" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Personalizar (Retirar)</h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-300 uppercase">Opcional</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {item.ingredients.map((ing) => (
                  <button
                    key={ing}
                    onClick={() => toggleIngredient(ing)}
                    className={`group px-5 py-4 rounded-[1.5rem] border-2 transition-all flex items-center justify-between
                      ${removedIngredients.includes(ing) 
                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' 
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                  >
                    <span className="text-[11px] font-bold truncate pr-2">{ing}</span>
                    {removedIngredients.includes(ing) ? <XCircle size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seção: Adicionais (Extra) */}
          {item.extras && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 orange-gradient rounded-full" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Turbinar pedido</h3>
                </div>
                <span className="text-[10px] font-bold text-orange-500 uppercase">Extras</span>
              </div>
              <div className="space-y-3">
                {item.extras.map((extra) => {
                  const isSelected = selectedExtras.some(e => e.name === extra.name);
                  return (
                    <button
                      key={extra.name}
                      onClick={() => toggleExtra(extra)}
                      className={`w-full p-4 rounded-[1.5rem] border-2 transition-all flex items-center gap-4
                        ${isSelected 
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/5' 
                          : 'border-zinc-50 dark:border-zinc-800 bg-white dark:bg-zinc-900/40'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                        {isSelected ? <Check size={20} strokeWidth={3} /> : <Plus size={20} />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${isSelected ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-400'}`}>{extra.name}</p>
                        <p className="text-[11px] font-black text-orange-600">+ R$ {extra.price.toFixed(2)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seção: Observações */}
          <div className="space-y-5">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 orange-gradient rounded-full" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Alguma observação extra?</h3>
             </div>
             <div className="relative group">
                <textarea
                  placeholder="Ex: Ponto da carne mal passado, molho à parte..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-orange-500/30 rounded-[2rem] p-6 text-sm font-bold outline-none transition-all resize-none min-h-[140px]"
                />
                <div className="absolute bottom-6 right-6 text-zinc-300 group-focus-within:text-orange-500 transition-colors">
                  <MessageSquareQuote size={24} />
                </div>
             </div>
          </div>
        </div>

        {/* Footer: Fixado e Redesenhado */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-100 dark:border-zinc-800 z-50 flex items-center gap-4 md:gap-6">
          
          {/* Seletor de Quantidade */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] p-1.5 border border-zinc-200 dark:border-zinc-800 shrink-0">
             <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${quantity <= 1 ? 'text-zinc-300 dark:text-zinc-800 pointer-events-none' : 'text-zinc-500 hover:text-red-500'}`}
             >
               <MinusCircle size={24} strokeWidth={2.5} />
             </button>
             <span className="w-10 text-center font-black text-lg">{quantity}</span>
             <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 shadow-sm text-orange-500 hover:scale-105 active:scale-95 transition-all"
             >
               <PlusCircle size={24} strokeWidth={2.5} />
             </button>
          </div>

          {/* Botão de Compra - Largo e Responsivo */}
          <button 
            onClick={handleAdd}
            className="flex-1 py-5 md:py-6 orange-gradient text-white rounded-[2.2rem] font-black flex items-center justify-between px-6 md:px-8 shadow-2xl shadow-orange-500/30 active:scale-95 transition-all overflow-hidden relative group"
          >
            <div className="flex items-center gap-2">
              {initialData ? <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" /> : <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />}
              <span className="uppercase tracking-widest text-[10px] md:text-[12px] whitespace-nowrap">
                {initialData ? 'Atualizar' : 'Adicionar'}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-white/20 mx-1 md:mx-2" />
            <span className="text-[12px] md:text-base whitespace-nowrap font-black">R$ {totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;

function XCircle({ size }: { size: number }) {
  return <X size={size} strokeWidth={4} />;
}
