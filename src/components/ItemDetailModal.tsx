import React, { useEffect, useMemo, useState } from 'react';
import { X, MinusCircle, PlusCircle, ShoppingBag, RefreshCw, ChevronDown } from 'lucide-react';
import { ExtraItem, MenuItem, OrderItemPizza, PizzaFlavor } from '../types';
import { computePizzaPrice, getPizzaSize } from '../modules/customer/utils/pizza-pricing.util';

interface Props {
  item: MenuItem | null;
  pizzaFlavors?: PizzaFlavor[];
  initialData?: {
    removedIngredients: string[];
    selectedExtras: ExtraItem[];
    observations: string;
    quantity: number;
    pizzaConfig?: Omit<OrderItemPizza, 'quantity' | 'notes'>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizations: {
    removedIngredients: string[];
    selectedExtras: ExtraItem[];
    observations: string;
    quantity: number;
    pizzaConfig?: Omit<OrderItemPizza, 'quantity' | 'notes'>;
  }) => void;
}

const ItemDetailModal: React.FC<Props> = ({ item, pizzaFlavors = [], initialData, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraItem[]>([]);
  const [observations, setObservations] = useState('');

  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [flavorCountSelected, setFlavorCountSelected] = useState(1);
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  const [flavorSearch, setFlavorSearch] = useState('');
  const [pizzaWarning, setPizzaWarning] = useState('');
  const [showIngredients, setShowIngredients] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    setQuantity(initialData?.quantity || 1);
    setRemovedIngredients(initialData?.removedIngredients || []);
    setSelectedExtras(initialData?.selectedExtras || []);
    setObservations(initialData?.observations || '');

    const initialPizza = initialData?.pizzaConfig;
    setSelectedSizeId(initialPizza?.sizeId || '');
    const initialFlavors = initialPizza?.flavors?.map((f) => f.id) || [];
    setSelectedFlavorIds(initialFlavors);
    setFlavorCountSelected(Math.max(1, initialPizza?.flavorCountSelected || initialFlavors.length || 1));
    setFlavorSearch('');
    setPizzaWarning('');
    setShowIngredients({});
  }, [isOpen, initialData, item]);

  const isPizza = item?.type === 'pizza';
  const selectedSize = item && selectedSizeId ? getPizzaSize(item, selectedSizeId) : null;
  const maxFlavorsAllowed = selectedSize?.maxFlavors || 1;

  const availablePizzaFlavors = useMemo(() => {
    const q = flavorSearch.trim().toLowerCase();
    return pizzaFlavors
      .filter((f) => f.active)
      .filter((f) => !q || f.name.toLowerCase().includes(q) || f.tags.some((tag) => tag.toLowerCase().includes(q)));
  }, [pizzaFlavors, flavorSearch]);

  const selectedFlavors = useMemo(() => {
    return selectedFlavorIds
      .map((id) => pizzaFlavors.find((flavor) => flavor.id === id))
      .filter((flavor): flavor is PizzaFlavor => Boolean(flavor));
  }, [selectedFlavorIds, pizzaFlavors]);

  const pizzaUnitPrice = useMemo(() => {
    if (!item || !isPizza || !selectedSizeId || selectedFlavors.length === 0) return item?.price || 0;
    return computePizzaPrice({ baseItem: item, sizeId: selectedSizeId, selectedFlavors });
  }, [item, isPizza, selectedSizeId, selectedFlavors]);

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    if (isPizza) return pizzaUnitPrice * quantity;
    const extrasTotal = selectedExtras.reduce((acc, curr) => acc + curr.price, 0);
    return (item.price + extrasTotal) * quantity;
  }, [item, selectedExtras, quantity, isPizza, pizzaUnitPrice]);

  if (!item) return null;

  const updateFlavorSlot = (slotIndex: number, flavorId: string) => {
    setSelectedFlavorIds((prev) => {
      const next = [...prev];
      const duplicateIndex = next.findIndex((id, idx) => id === flavorId && idx !== slotIndex);
      if (duplicateIndex >= 0) {
        setPizzaWarning('Não é permitido repetir sabores.');
        return prev;
      }

      next[slotIndex] = flavorId;
      setPizzaWarning('');
      return next.slice(0, flavorCountSelected);
    });
  };

  const handleSizeChange = (sizeId: string) => {
    if (!item) return;
    const nextSize = getPizzaSize(item, sizeId);
    if (!nextSize) return;

    setSelectedSizeId(sizeId);
    setFlavorCountSelected((prev) => {
      if (prev <= nextSize.maxFlavors) return prev;
      setPizzaWarning(`Quantidade de sabores ajustada para ${nextSize.maxFlavors} ao trocar o tamanho.`);
      return nextSize.maxFlavors;
    });
    setSelectedFlavorIds((prev) => prev.slice(0, nextSize.maxFlavors));
  };

  const handleFlavorCountChange = (count: number) => {
    const bounded = Math.max(1, Math.min(count, maxFlavorsAllowed));
    setFlavorCountSelected(bounded);
    setSelectedFlavorIds((prev) => prev.slice(0, bounded));
  };


  const toggleIngredient = (ingredient: string) => {
    setRemovedIngredients((prev) => prev.includes(ingredient)
      ? prev.filter((current) => current !== ingredient)
      : [...prev, ingredient]);
  };

  const toggleExtra = (extra: ExtraItem) => {
    setSelectedExtras((prev) => prev.some((current) => current.name === extra.name)
      ? prev.filter((current) => current.name !== extra.name)
      : [...prev, extra]);
  };

  const isPizzaReady = Boolean(selectedSizeId)
    && selectedFlavorIds.length === flavorCountSelected
    && selectedFlavorIds.every(Boolean);

  const canAddPizza = !isPizza || isPizzaReady;

  const handleAdd = () => {
    if (isPizza && item && selectedSize) {
      const pizzaConfig: Omit<OrderItemPizza, 'quantity' | 'notes'> = {
        kind: 'pizza',
        pizzaBaseId: item.id,
        pizzaName: item.name,
        sizeId: selectedSize.id,
        sizeLabel: selectedSize.label,
        maxFlavors: selectedSize.maxFlavors,
        flavorCountSelected,
        pricingStrategyUsed: item.pricingStrategy || 'highestFlavor',
        flavors: selectedFlavors.map((flavor) => ({
          id: flavor.id,
          name: flavor.name,
          ingredients: flavor.ingredients || [],
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

  const consolidatedIngredients = Array.from(new Set(selectedFlavors.flatMap((f) => f.ingredients || [])));

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
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Etapa 1: Tamanho</h3>
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
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Etapa 2: Quantidade de sabores</h3>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: maxFlavorsAllowed }, (_, idx) => idx + 1).map((count) => (
                    <button
                      key={count}
                      onClick={() => handleFlavorCountChange(count)}
                      className={`px-4 py-2 rounded-xl border-2 text-xs font-black ${flavorCountSelected === count ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}
                    >
                      {count} sabor{count > 1 ? 'es' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Etapa 3: Escolher sabores</h3>
                <input
                  value={flavorSearch}
                  onChange={(e) => setFlavorSearch(e.target.value)}
                  placeholder="Buscar sabor por nome/tag"
                  className="w-full mb-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-3 text-sm"
                />

                <div className="space-y-3">
                  {Array.from({ length: flavorCountSelected }, (_, slotIndex) => {
                    const selectedFlavorId = selectedFlavorIds[slotIndex] || '';
                    const selectedFlavor = pizzaFlavors.find((f) => f.id === selectedFlavorId);
                    return (
                      <div key={`slot-${slotIndex}`} className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sabor {slotIndex + 1}</label>
                        <select
                          value={selectedFlavorId}
                          onChange={(e) => updateFlavorSlot(slotIndex, e.target.value)}
                          className="w-full mt-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 text-sm"
                        >
                          <option value="">Selecione um sabor</option>
                          {availablePizzaFlavors.map((flavor) => (
                            <option key={flavor.id} value={flavor.id}>{flavor.name}</option>
                          ))}
                        </select>

                        {selectedFlavor && (
                          <button
                            type="button"
                            onClick={() => setShowIngredients((prev) => ({ ...prev, [selectedFlavor.id]: !prev[selectedFlavor.id] }))}
                            className="mt-2 text-[11px] font-bold text-zinc-500 flex items-center gap-1"
                          >
                            Ingredientes do sabor <ChevronDown size={12} className={showIngredients[selectedFlavor.id] ? 'rotate-180' : ''} />
                          </button>
                        )}
                        {selectedFlavor && showIngredients[selectedFlavor.id] && (
                          <p className="text-[11px] text-zinc-500 mt-1">{selectedFlavor.ingredients?.join(', ') || 'Sem ingredientes informados.'}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {pizzaWarning && <p className="text-xs text-orange-600 font-bold mt-2">{pizzaWarning}</p>}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Resumo</p>
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mt-1">{selectedSize ? `${selectedSize.label} • ${selectedFlavors.map((f) => f.name).join(', ')}` : 'Selecione o tamanho e sabores'}</p>
                {consolidatedIngredients.length > 0 && (
                  <p className="text-[11px] text-zinc-500 mt-1">Ingredientes: {consolidatedIngredients.join(', ')}</p>
                )}
              </div>
            </>
          )}

          {!isPizza && (
            <>
              {item.ingredients && item.ingredients.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Retirar ingredientes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {item.ingredients.map((ingredient) => (
                      <button key={ingredient} onClick={() => toggleIngredient(ingredient)} className={`px-3 py-2 rounded-xl border text-xs font-bold ${removedIngredients.includes(ingredient) ? 'border-orange-500 text-orange-600' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>{ingredient}</button>
                    ))}
                  </div>
                </div>
              )}

              {item.extras && item.extras.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Adicionais</h3>
                  <div className="space-y-2">
                    {item.extras.map((extra) => (
                      <button key={extra.name} onClick={() => toggleExtra(extra)} className={`w-full p-3 rounded-xl border text-left text-sm font-bold flex justify-between ${selectedExtras.some((current) => current.name === extra.name) ? 'border-orange-500 text-orange-600' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>
                        <span>{extra.name}</span>
                        <span>+ R$ {extra.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
