import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Pizza, Plus, Trash2, X } from 'lucide-react';
import { MenuItem, PizzaFlavor, Ingredient, PizzaPricingStrategy, PizzaSizeOption } from '../types';
import { dbMenu, dbPizzaFlavors, dbIngredientsCatalog } from '../services/dbService';

interface Props {
  open: boolean;
  onClose: () => void;
  pizzaBase?: MenuItem | null;
  categories: string[];
  onSaved: () => Promise<void> | void;
}

type StepId = 0 | 1 | 2;

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map((i) => removeUndefinedDeep(i)) as T;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, removeUndefinedDeep(v)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

const defaultSize = (): PizzaSizeOption => ({ id: `SIZE-${Date.now()}`, label: 'Média', basePrice: 0, maxFlavors: 2, slices: null });

const PizzaConfiguratorModal: React.FC<Props> = ({ open, onClose, pizzaBase, categories, onSaved }) => {
  const [step, setStep] = useState<StepId>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pricingStrategy, setPricingStrategy] = useState<PizzaPricingStrategy>('highestFlavor');
  const [sizes, setSizes] = useState<PizzaSizeOption[]>([defaultSize()]);

  const [flavors, setFlavors] = useState<PizzaFlavor[]>([]);
  const [ingredientsCatalog, setIngredientsCatalog] = useState<Ingredient[]>([]);
  const [flavorSearch, setFlavorSearch] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState<PizzaFlavor | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);

  const loadCatalogs = async () => {
    const [flavorsData, ingredientsData] = await Promise.all([
      dbPizzaFlavors.getAll(),
      dbIngredientsCatalog.getAll()
    ]);
    setFlavors(flavorsData);
    setIngredientsCatalog(ingredientsData);
  };

  useEffect(() => {
    if (!open) return;

    setStep(0);
    setName(pizzaBase?.name || 'Pizza da Casa');
    setCategory(pizzaBase?.category || categories[0] || 'Pizzas');
    setDescription(pizzaBase?.description || '');
    setImageUrl(pizzaBase?.imageUrl || '');
    setPricingStrategy((pizzaBase?.pricingStrategy as PizzaPricingStrategy) || 'highestFlavor');
    setSizes(pizzaBase?.sizes?.length ? pizzaBase.sizes : [defaultSize()]);
    setSelectedFlavor(null);
    setFlavorSearch('');
    setIngredientSearch('');
    loadCatalogs();
  }, [open, pizzaBase, categories]);

  const filteredFlavors = useMemo(() => {
    const q = flavorSearch.trim().toLowerCase();
    if (!q) return flavors;
    return flavors.filter((f) => f.name.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q)));
  }, [flavorSearch, flavors]);

  const previewSize = sizes[0];
  const canAdvanceStep1 = sizes.length > 0 && sizes.every((s) => s.label.trim() && s.basePrice >= 0 && s.maxFlavors >= 1);

  const persistFlavor = async () => {
    if (!selectedFlavor?.name?.trim()) return;
    const id = selectedFlavor.id || `flavor-${Date.now()}`;

    await dbPizzaFlavors.save(removeUndefinedDeep({
      ...selectedFlavor,
      id,
      description: selectedFlavor.description || null,
      imageUrl: selectedFlavor.imageUrl || null,
      tags: selectedFlavor.tags || [],
      ingredients: selectedFlavor.ingredients || [],
      active: selectedFlavor.active !== false,
      priceDeltaBySize: selectedFlavor.priceDeltaBySize || null
    }));

    await loadCatalogs();
    setSelectedFlavor(null);
  };

  const createIngredientInline = async () => {
    const normalized = ingredientSearch.trim();
    if (!normalized) return;

    const existing = ingredientsCatalog.find((i) => i.name.toLowerCase() === normalized.toLowerCase());
    if (existing) {
      setSelectedFlavor((prev) => prev ? {
        ...prev,
        ingredients: prev.ingredients.some((i) => i.id === existing.id) ? prev.ingredients : [...prev.ingredients, { id: existing.id, name: existing.name }]
      } : prev);
      setIngredientSearch('');
      return;
    }

    const ingredient: Ingredient = { id: `ingredient-${Date.now()}`, name: normalized, active: true, tags: [], allergens: null };
    await dbIngredientsCatalog.save(ingredient);
    await loadCatalogs();
    setSelectedFlavor((prev) => prev ? { ...prev, ingredients: [...prev.ingredients, { id: ingredient.id, name: ingredient.name }] } : prev);
    setIngredientSearch('');
  };

  const handleSavePizza = async () => {
    if (!name.trim() || !canAdvanceStep1) return;

    setIsSaving(true);
    try {
      const id = pizzaBase?.id || `pizza-${Date.now()}`;
      const payload: MenuItem = removeUndefinedDeep({
        id,
        type: 'pizza',
        name,
        category,
        price: sizes[0]?.basePrice || 0,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800',
        rating: 5,
        preparationTime: '30 min',
        size: 'M',
        tags: ['pizza'],
        ingredients: [],
        extras: [],
        pricingStrategy,
        sizes: sizes.map((s) => ({
          id: s.id || `size-${Date.now()}`,
          label: s.label || 'Tamanho',
          basePrice: Number(s.basePrice || 0),
          maxFlavors: Math.max(1, Number(s.maxFlavors || 1)),
          slices: s.slices ?? null
        }))
      });

      await dbMenu.save(payload);
      await onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[230] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-7xl max-h-[94vh] bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2"><Pizza size={14} /> Configurador de Pizza</p>
            <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-white">{pizzaBase ? 'Editar Pizza Base' : 'Nova Pizza Base'}</h2>
            <p className="text-xs text-stone-500 font-semibold">Defina tamanhos, preço base e máximo de sabores por tamanho. Preview ao vivo abaixo.</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-5">
            <div className="flex gap-2 flex-wrap">
              {['Tamanhos', 'Preço', 'Sabores'].map((label, index) => (
                <button key={label} onClick={() => setStep(index as StepId)} className={`px-4 py-2 rounded-full text-xs font-black uppercase border ${step === index ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500'}`}>
                  {index + 1}. {label}
                </button>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da pizza" className="bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL da imagem" className="bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
                  <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" className="bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
                </div>

                <div className="space-y-2">
                  {sizes.map((size, index) => (
                    <div key={`${size.id}-${index}`} className="grid grid-cols-2 lg:grid-cols-5 gap-2 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
                      <input value={size.label} onChange={(e) => setSizes((prev) => prev.map((s, i) => i === index ? { ...s, label: e.target.value } : s))} placeholder="Label" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl text-xs" />
                      <input type="number" min={0} value={size.basePrice} onChange={(e) => setSizes((prev) => prev.map((s, i) => i === index ? { ...s, basePrice: Number(e.target.value) || 0 } : s))} placeholder="Preço" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl text-xs" />
                      <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800 p-2 rounded-xl">
                        <button onClick={() => setSizes((prev) => prev.map((s, i) => i === index ? { ...s, maxFlavors: Math.max(1, s.maxFlavors - 1) } : s))}>-</button>
                        <span className="text-xs font-black">{size.maxFlavors} sabores</span>
                        <button onClick={() => setSizes((prev) => prev.map((s, i) => i === index ? { ...s, maxFlavors: Math.min(4, s.maxFlavors + 1) } : s))}>+</button>
                      </div>
                      <input type="number" min={1} value={size.slices ?? ''} onChange={(e) => setSizes((prev) => prev.map((s, i) => i === index ? { ...s, slices: e.target.value ? Number(e.target.value) : null } : s))} placeholder="Fatias" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl text-xs" />
                      <button onClick={() => setConfirmRemoveIndex(index)} className="p-2 rounded-xl border border-red-200 text-red-500 flex items-center justify-center"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>

                <button onClick={() => setSizes((prev) => [...prev, defaultSize()])} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase flex items-center gap-2"><Plus size={14} /> Adicionar tamanho</button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {(['highestFlavor', 'averageFlavor', 'fixedBySize'] as PizzaPricingStrategy[]).map((strategy) => (
                  <button key={strategy} onClick={() => setPricingStrategy(strategy)} className={`w-full p-4 rounded-2xl border text-left ${pricingStrategy === strategy ? 'border-orange-500 bg-orange-50/50' : 'border-stone-200'}`}>
                    <p className="font-black text-sm">{strategy}</p>
                    <p className="text-xs text-stone-500">{strategy === 'highestFlavor' ? 'Base + maior delta entre sabores' : strategy === 'averageFlavor' ? 'Base + média dos deltas' : 'Preço fixo por tamanho'}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input value={flavorSearch} onChange={(e) => setFlavorSearch(e.target.value)} placeholder="Buscar sabor" className="flex-1 bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200" />
                  <button onClick={() => setSelectedFlavor({ id: '', name: '', description: '', imageUrl: '', active: true, tags: [], ingredients: [], priceDeltaBySize: null })} className="px-4 py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase">Novo sabor</button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2">
                  {filteredFlavors.map((flavor) => (
                    <button key={flavor.id} onClick={() => setSelectedFlavor(flavor)} className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-orange-400">
                      <p className="font-black text-xs">{flavor.name}</p>
                      <p className="text-[11px] text-stone-500">{flavor.ingredients.map((i) => i.name).join(', ') || 'Sem ingredientes'}</p>
                    </button>
                  ))}
                </div>

                {selectedFlavor && (
                  <div className="p-4 rounded-2xl border border-stone-200 space-y-2">
                    <input value={selectedFlavor.name} onChange={(e) => setSelectedFlavor((prev) => prev ? { ...prev, name: e.target.value } : prev)} placeholder="Nome do sabor" className="w-full bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded-xl" />
                    <input value={ingredientSearch} onChange={(e) => setIngredientSearch(e.target.value)} placeholder="Buscar ingrediente" className="w-full bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded-xl" />
                    <div className="flex flex-wrap gap-1">
                      {selectedFlavor.ingredients.map((ingredient) => (
                        <button key={ingredient.id} onClick={() => setSelectedFlavor((prev) => prev ? ({ ...prev, ingredients: prev.ingredients.filter((i) => i.id !== ingredient.id) }) : prev)} className="px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-black uppercase">{ingredient.name} ✕</button>
                      ))}
                    </div>
                    <div className="max-h-24 overflow-y-auto grid grid-cols-2 gap-1">
                      {ingredientsCatalog.filter((i) => i.active).filter((i) => !ingredientSearch.trim() || i.name.toLowerCase().includes(ingredientSearch.toLowerCase())).slice(0, 8).map((ingredient) => (
                        <button key={ingredient.id} onClick={() => setSelectedFlavor((prev) => prev ? ({ ...prev, ingredients: prev.ingredients.some((i) => i.id === ingredient.id) ? prev.ingredients : [...prev.ingredients, { id: ingredient.id, name: ingredient.name }] }) : prev)} className="text-left p-2 rounded-lg border border-stone-200 text-[11px] font-bold">{ingredient.name}</button>
                      ))}
                    </div>
                    <button onClick={createIngredientInline} className="text-[10px] font-black uppercase text-orange-500">Criar ingrediente</button>
                    <button onClick={persistFlavor} className="w-full p-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase">Salvar sabor</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-orange-200 dark:border-orange-800 p-5 bg-orange-50/40 dark:bg-orange-950/10 lg:sticky lg:top-0 h-fit space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Preview ao vivo</p>
            <div className="space-y-2">
              {sizes.map((size) => (
                <div key={size.id} className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200">
                  <p className="text-xs font-black">{size.label || 'Tamanho'}</p>
                  <p className="text-[11px] text-stone-500">R$ {Number(size.basePrice || 0).toFixed(2)} • até {size.maxFlavors} sabores</p>
                </div>
              ))}
            </div>
            <div className="w-40 h-40 mx-auto rounded-full border-4 border-stone-200" style={{ background: `conic-gradient(#f97316 0deg ${360 / Math.max(previewSize?.maxFlavors || 1, 1)}deg, #fb923c 0deg)` }} />
            <p className="text-xs font-semibold text-stone-600">Exemplo ({pricingStrategy}): pizza {previewSize?.label || '-'} com 2 sabores.</p>
            <p className="text-sm font-black text-orange-600">R$ {Number((previewSize?.basePrice || 0) + (pricingStrategy === 'averageFlavor' ? 2 : pricingStrategy === 'highestFlavor' ? 3 : 0)).toFixed(2)}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
          <button onClick={() => setStep((s) => Math.max(0, s - 1) as StepId)} className="px-4 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs font-black uppercase">Voltar</button>
          <div className="flex items-center gap-2">
            {step < 2 ? (
              <button onClick={() => setStep((s) => Math.min(2, s + 1) as StepId)} disabled={step === 0 && !canAdvanceStep1} className="px-4 py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase flex items-center gap-2 disabled:opacity-50">
                Próximo <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSavePizza} disabled={isSaving || !canAdvanceStep1} className="px-5 py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase disabled:opacity-50 flex items-center gap-2">
                {isSaving ? 'Salvando...' : <>Salvar Pizza <Check size={14} /></>}
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmRemoveIndex !== null && (
        <div className="fixed inset-0 z-[240] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 p-5 space-y-4">
            <h4 className="font-black">Remover tamanho</h4>
            <p className="text-sm text-stone-500">Deseja remover este tamanho da pizza?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmRemoveIndex(null)} className="px-4 py-2 rounded-xl bg-stone-100 text-xs font-black uppercase">Cancelar</button>
              <button onClick={() => { setSizes((prev) => prev.filter((_, i) => i !== confirmRemoveIndex)); setConfirmRemoveIndex(null); }} className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-black uppercase">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PizzaConfiguratorModal;
