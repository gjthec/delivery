import React, { useEffect, useMemo, useState } from 'react';
import { X, MinusCircle, PlusCircle, ShoppingBag, RefreshCw, ChevronDown, Check } from 'lucide-react';
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

const PIZZA_COLORS = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7'];

const ItemDetailModal: React.FC<Props> = ({ item, pizzaFlavors = [], initialData, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraItem[]>([]);
  const [observations, setObservations] = useState('');

  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [flavorCountSelected, setFlavorCountSelected] = useState(1);
  const [segmentFlavorIds, setSegmentFlavorIds] = useState<string[]>([]);
  const [pizzaWarning, setPizzaWarning] = useState('');
  const [showIngredientDetails, setShowIngredientDetails] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuantity(initialData?.quantity || 1);
    setRemovedIngredients(initialData?.removedIngredients || []);
    setSelectedExtras(initialData?.selectedExtras || []);
    setObservations(initialData?.observations || '');

    const pizzaConfig = initialData?.pizzaConfig;
    setSelectedSizeId(pizzaConfig?.sizeId || '');
    setFlavorCountSelected(Math.max(1, pizzaConfig?.flavorCountSelected || pizzaConfig?.segments?.length || 1));
    setSegmentFlavorIds((pizzaConfig?.segments || []).map((segment) => segment.flavorId));
    setPizzaWarning('');
    setShowIngredientDetails(false);
  }, [isOpen, initialData, item]);

  const isPizza = item?.type === 'pizza';
  const selectedSize = item && selectedSizeId ? getPizzaSize(item, selectedSizeId) : null;
  const maxFlavorsAllowed = selectedSize?.maxFlavors || 1;

  const availablePizzaFlavors = useMemo(() => {
    const allowedFlavorIds = item?.allowedFlavorIds || [];
    return pizzaFlavors
      .filter((flavor) => flavor.active)
      .filter((flavor) => allowedFlavorIds.length === 0 || allowedFlavorIds.includes(flavor.id));
  }, [pizzaFlavors, item?.allowedFlavorIds]);

  const selectedFlavors = useMemo(() => {
    return segmentFlavorIds
      .slice(0, flavorCountSelected)
      .map((flavorId) => pizzaFlavors.find((flavor) => flavor.id === flavorId))
      .filter((flavor): flavor is PizzaFlavor => Boolean(flavor));
  }, [segmentFlavorIds, flavorCountSelected, pizzaFlavors]);

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

  const handleFlavorCardToggle = (flavorId: string) => {
    setSegmentFlavorIds((prev) => {
      const bounded = prev.slice(0, flavorCountSelected);
      const existingIndex = bounded.findIndex((id) => id === flavorId);

      if (existingIndex >= 0) {
        const next = [...bounded];
        next.splice(existingIndex, 1);
        setPizzaWarning('');
        return next;
      }

      if (bounded.length >= flavorCountSelected) {
        setPizzaWarning(`Você já selecionou ${flavorCountSelected} de ${flavorCountSelected} sabores. Remova um para trocar.`);
        return prev;
      }

      setPizzaWarning('');
      return [...bounded, flavorId];
    });
  };

  const handleSizeChange = (sizeId: string) => {
    if (!item) return;
    const nextSize = getPizzaSize(item, sizeId);
    if (!nextSize) return;

    setSelectedSizeId(sizeId);
    setFlavorCountSelected((prev) => Math.min(prev, nextSize.maxFlavors));
    setSegmentFlavorIds((prev) => prev.slice(0, nextSize.maxFlavors));
  };

  const handleFlavorCountChange = (count: number) => {
    const bounded = Math.max(1, Math.min(count, maxFlavorsAllowed));
    setFlavorCountSelected(bounded);
    setSegmentFlavorIds((prev) => prev.slice(0, bounded));
    setPizzaWarning('');
  };

  const segments = Array.from({ length: flavorCountSelected }, (_, index) => ({
    index,
    flavorId: segmentFlavorIds[index] || '',
    flavor: pizzaFlavors.find((flavor) => flavor.id === segmentFlavorIds[index]) || null
  }));

  const pizzaConicStyle = {
    background: segments.length === 1
      ? PIZZA_COLORS[0]
      : `conic-gradient(${segments.map((segment, index) => `${PIZZA_COLORS[index % PIZZA_COLORS.length]} ${Math.round((index / segments.length) * 360)}deg ${Math.round(((index + 1) / segments.length) * 360)}deg`).join(', ')})`
  } as React.CSSProperties;

  const ingredientsSummary = Array.from(new Set(selectedFlavors.flatMap((flavor) => flavor.ingredients.map((ingredient) => ingredient.name))));
  const selectedCount = segmentFlavorIds.slice(0, flavorCountSelected).filter(Boolean).length;
  const isPizzaReady = Boolean(selectedSizeId)
    && segments.length === flavorCountSelected
    && segments.every((segment) => Boolean(segment.flavorId));

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
        segments: segments.map((segment) => ({
          index: segment.index,
          flavorId: segment.flavorId,
          flavorName: segment.flavor?.name || ''
        })),
        ingredientsSummary,
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
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Tamanho</h3>
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
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Quantidade de sabores</h3>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: maxFlavorsAllowed }, (_, i) => i + 1).map((count) => (
                    <button key={count} onClick={() => handleFlavorCountChange(count)} className={`px-4 py-2 rounded-xl border-2 text-xs font-black ${flavorCountSelected === count ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>
                      {count} sabor{count > 1 ? 'es' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-black">Escolha os sabores</h3>
                  <p className="text-xs text-zinc-500">Selecione os sabores da sua pizza.</p>
                  <p className="text-xs font-bold text-orange-600 mt-1">{selectedCount} de {flavorCountSelected} sabores selecionados</p>
                </div>

                {availablePizzaFlavors.length === 0 ? (
                  <p className="text-xs text-zinc-500">Nenhum sabor disponível para esta pizza no momento.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availablePizzaFlavors.map((flavor) => {
                      const isSelected = segmentFlavorIds.includes(flavor.id);
                      const ingredientPreview = flavor.ingredients.slice(0, 3).map((ingredient) => ingredient.name).join(', ');
                      const flavorType = flavor.flavorType || 'Salgado';
                      return (
                        <button
                          key={flavor.id}
                          onClick={() => handleFlavorCardToggle(flavor.id)}
                          disabled={!isSelected && selectedCount >= flavorCountSelected}
                          className={`rounded-2xl border p-3 text-left transition-all disabled:opacity-50 ${isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
                              {flavor.imageUrl ? (
                                <img src={flavor.imageUrl} alt={flavor.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full text-[9px] font-black text-zinc-400 flex items-center justify-center">Sem foto</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 truncate">{flavor.name}</p>
                                {isSelected && <Check size={14} className="text-orange-500" />}
                              </div>
                              <p className="text-[11px] text-zinc-500">{flavorType}{typeof flavor.extraPrice === 'number' ? ` • +R$ ${flavor.extraPrice.toFixed(2)}` : ''}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{ingredientPreview || 'Sem ingredientes cadastrados'}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Preview da pizza</p>
                  <div className="mx-auto w-44 h-44 rounded-full border-4 border-zinc-200 dark:border-zinc-700 relative" style={pizzaConicStyle}>
                    {segments.map((segment, index) => (
                      <span
                        key={segment.index}
                        className="absolute text-[10px] font-black px-2 py-1 rounded-full bg-white/90 text-zinc-700"
                        style={{ left: `${50 + 34 * Math.cos(((index + 0.5) / segments.length) * Math.PI * 2 - Math.PI / 2)}%`, top: `${50 + 34 * Math.sin(((index + 0.5) / segments.length) * Math.PI * 2 - Math.PI / 2)}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        {segment.flavor?.name || `Fatia ${index + 1}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Resumo</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mt-1">{selectedSize ? `${selectedSize.label} • ${segments.map((segment) => segment.flavor?.name || '---').join(' | ')}` : 'Selecione o tamanho e os sabores'}</p>
                  <button className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1" onClick={() => setShowIngredientDetails((prev) => !prev)}>
                    Ingredientes consolidados <ChevronDown size={12} className={showIngredientDetails ? 'rotate-180' : ''} />
                  </button>
                  {showIngredientDetails && <p className="text-[11px] text-zinc-500 mt-1">{ingredientsSummary.join(', ') || 'Nenhum ingrediente selecionado.'}</p>}
                </div>
              </div>

              {pizzaWarning && <p className="text-xs text-orange-600 font-bold">{pizzaWarning}</p>}
            </>
          )}

          {!isPizza && (
            <textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observações" className="w-full bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 text-sm" />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-zinc-950/90 border-t border-zinc-100 dark:border-zinc-800 z-50 flex items-center gap-4">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] p-1.5 border border-zinc-200 dark:border-zinc-800 shrink-0">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center"><MinusCircle size={22} /></button>
            <span className="w-10 text-center font-black text-lg">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center"><PlusCircle size={22} /></button>
          </div>

          <button disabled={isPizza ? !isPizzaReady : false} onClick={handleAdd} className="flex-1 py-5 orange-gradient text-white rounded-[2.2rem] font-black flex items-center justify-between px-6 disabled:opacity-50 disabled:cursor-not-allowed">
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
