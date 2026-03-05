import React, { useEffect, useMemo, useState } from 'react';
import { X, MinusCircle, PlusCircle, ShoppingBag, RefreshCw } from 'lucide-react';
import { ExtraItem, MenuItem, OrderItemPizza, PizzaFlavor } from '../types';
import { computePizzaPrice, getPizzaSize } from '../modules/customer/utils/pizza-pricing.util';

interface Props {
  item: MenuItem | null;
  pizzaFlavors?: PizzaFlavor[];
  initialData?: { removedIngredients: string[]; selectedExtras: ExtraItem[]; observations: string; quantity: number; pizzaConfig?: Omit<OrderItemPizza, 'quantity' | 'notes'> } | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizations: { removedIngredients: string[]; selectedExtras: ExtraItem[]; observations: string; quantity: number; pizzaConfig?: Omit<OrderItemPizza, 'quantity' | 'notes'> }) => void;
}

const ItemDetailModal: React.FC<Props> = ({ item, pizzaFlavors = [], initialData, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraItem[]>([]);
  const [observations, setObservations] = useState('');
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  const [pizzaWarning, setPizzaWarning] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setQuantity(initialData?.quantity || 1);
    setRemovedIngredients(initialData?.removedIngredients || []);
    setSelectedExtras(initialData?.selectedExtras || []);
    setObservations(initialData?.observations || '');
    setSelectedSizeId(initialData?.pizzaConfig?.sizeId || '');
    setSelectedFlavorIds(initialData?.pizzaConfig?.flavors?.map((f) => f.id) || []);
    setPizzaWarning('');
  }, [isOpen, initialData, item]);

  const isPizza = item?.type === 'pizza';
  const selectedSize = item && selectedSizeId ? getPizzaSize(item, selectedSizeId) : null;
  const availablePizzaFlavors = useMemo(() => pizzaFlavors.filter((f) => f.active), [pizzaFlavors]);
  const selectedFlavors = useMemo(
    () => availablePizzaFlavors.filter((flavor) => selectedFlavorIds.includes(flavor.id)),
    [availablePizzaFlavors, selectedFlavorIds]
  );

  const pizzaUnitPrice = useMemo(() => {
    if (!item || !isPizza || !selectedSizeId) return item?.price || 0;
    return computePizzaPrice({ baseItem: item, sizeId: selectedSizeId, selectedFlavors });
  }, [item, isPizza, selectedSizeId, selectedFlavors]);

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    if (isPizza) return pizzaUnitPrice * quantity;
    const extrasTotal = selectedExtras.reduce((acc, curr) => acc + curr.price, 0);
    return (item.price + extrasTotal) * quantity;
  }, [item, selectedExtras, quantity, isPizza, pizzaUnitPrice]);

  if (!item) return null;

  const toggleFlavor = (id: string) => {
    if (!selectedSize) return;

    setSelectedFlavorIds((prev) => {
      if (prev.includes(id)) return prev.filter((currentId) => currentId !== id);

      if (prev.length >= selectedSize.maxFlavors) {
        setPizzaWarning(`Máximo de ${selectedSize.maxFlavors} sabores para ${selectedSize.label}.`);
        return prev;
      }

      setPizzaWarning('');
      return [...prev, id];
    });
  };

  const handleSizeChange = (sizeId: string) => {
    if (!item) return;
    const nextSize = getPizzaSize(item, sizeId);
    if (!nextSize) return;

    setSelectedSizeId(sizeId);
    setSelectedFlavorIds((prev) => {
      if (prev.length <= nextSize.maxFlavors) return prev;
      setPizzaWarning(`Alguns sabores foram removidos: máximo ${nextSize.maxFlavors} para ${nextSize.label}.`);
      return prev.slice(0, nextSize.maxFlavors);
    });
  };

  const canAddPizza = !isPizza || (selectedSize && selectedFlavorIds.length === selectedSize.maxFlavors);

  const handleAdd = () => {
    if (isPizza && item && selectedSize) {
      const pizzaConfig: Omit<OrderItemPizza, 'quantity' | 'notes'> = {
        kind: 'pizza',
        pizzaBaseId: item.id,
        sizeId: selectedSize.id,
        sizeLabel: selectedSize.label,
        maxFlavors: selectedSize.maxFlavors,
        pricingStrategyUsed: item.pricingStrategy || 'highestFlavor',
        flavors: selectedFlavors.map((flavor) => ({
          id: flavor.id,
          name: flavor.name,
          priceDeltaApplied: flavor.priceDeltaBySize?.[selectedSize.id] || 0
        })),
        unitPriceComputed: pizzaUnitPrice
      };

      onAddToCart({ removedIngredients: [], selectedExtras: [], observations, quantity, pizzaConfig });
      onClose();
      return;
    }

    onAddToCart({ removedIngredients, selectedExtras, observations, quantity });
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-end justify-center transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-t-[3.5rem] shadow-2xl transition-all duration-500 transform flex flex-col max-h-[92vh] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="relative h-60 md:h-72 shrink-0">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-black/20" />
          <button onClick={onClose} className="absolute top-6 right-6 w-11 h-11 flex items-center justify-center rounded-2xl bg-white/20 text-white"><X size={24} /></button>
        </div>

        <div className="overflow-y-auto px-8 py-6 space-y-6 pb-40">
          <div className="flex justify-between items-start gap-4">
            <h2 className="text-3xl font-black tracking-tighter leading-tight flex-1">{item.name}</h2>
            <p className="text-2xl font-black text-orange-600">R$ {(isPizza ? pizzaUnitPrice : item.price).toFixed(2)}</p>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">{item.description}</p>

          {isPizza && (
            <>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Etapa A: Tamanho</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(item.sizes || []).map((size) => (
                    <button key={size.id} onClick={() => handleSizeChange(size.id)} className={`p-4 rounded-2xl border-2 text-left ${selectedSizeId === size.id ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
                      <p className="font-black">{size.label}</p>
                      <p className="text-xs text-zinc-500">até {size.maxFlavors} sabores • R$ {size.basePrice.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Etapa B: Sabores</h3>
                <div className="grid grid-cols-1 gap-3 max-h-56 overflow-y-auto">
                  {availablePizzaFlavors.map((flavor) => {
                    const selected = selectedFlavorIds.includes(flavor.id);
                    return (
                      <button key={flavor.id} onClick={() => toggleFlavor(flavor.id)} className={`p-3 rounded-2xl border-2 text-left ${selected ? 'border-orange-500' : 'border-zinc-200 dark:border-zinc-800'}`}>
                        <p className="font-bold">{flavor.name}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-2 text-zinc-500">Selecionados: {selectedFlavorIds.length}/{selectedSize?.maxFlavors || 0}</p>
                {pizzaWarning && <p className="text-xs text-orange-600 font-bold mt-1">{pizzaWarning}</p>}
              </div>
            </>
          )}

          <textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observações" className="w-full bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 text-sm" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-zinc-950/90 border-t border-zinc-100 dark:border-zinc-800 z-50 flex items-center gap-4">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] p-1.5 border border-zinc-200 dark:border-zinc-800 shrink-0">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center"><MinusCircle size={22} /></button>
            <span className="w-10 text-center font-black text-lg">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center"><PlusCircle size={22} /></button>
          </div>

          <button disabled={!canAddPizza} onClick={handleAdd} className="flex-1 py-5 orange-gradient text-white rounded-[2.2rem] font-black flex items-center justify-between px-6 disabled:opacity-50 disabled:cursor-not-allowed">
            <div className="flex items-center gap-2">
              {initialData ? <RefreshCw size={20} /> : <ShoppingBag size={20} />}
              <span className="uppercase tracking-widest text-[10px]">{initialData ? 'Atualizar' : 'Adicionar ao carrinho'}</span>
            </div>
            <span className="text-[12px] md:text-base font-black">R$ {totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
