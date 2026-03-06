import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { MenuItem, PizzaFlavor, PizzaPricingStrategy, PizzaSizeOption } from '../types';
import { dbMenu, dbPizzaFlavors } from '../services/dbService';
import { FieldLabel } from '../components/FieldHelp';

interface Props {
  pizzaBase?: MenuItem | null;
  categories: string[];
  onSaved: () => Promise<void> | void;
  onDirtyChange?: (dirty: boolean) => void;
}

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

const defaultSize = (): PizzaSizeOption => ({
  id: `SIZE-${Date.now()}`,
  label: 'Média',
  basePrice: 0,
  maxFlavors: 2,
  slices: null
});

const MAX_FLAVOR_OPTIONS = [1, 2, 3, 4] as const;

const PizzaConfiguratorContent: React.FC<Props> = ({ pizzaBase, categories, onSaved, onDirtyChange }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sizes, setSizes] = useState<PizzaSizeOption[]>([defaultSize()]);
  const [maxFlavorsAllowed, setMaxFlavorsAllowed] = useState(2);

  const [flavors, setFlavors] = useState<PizzaFlavor[]>([]);
  const [flavorSearch, setFlavorSearch] = useState('');
  const [flavorNameInput, setFlavorNameInput] = useState('');
  const [editingFlavorId, setEditingFlavorId] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState('');

  const loadFlavors = async () => {
    const flavorsData = await dbPizzaFlavors.getAll();
    setFlavors(flavorsData);
  };

  useEffect(() => {
    const existingSizes = pizzaBase?.sizes?.length ? pizzaBase.sizes : [defaultSize()];
    const initialMaxFlavors = Math.max(1, Math.min(4, existingSizes[0]?.maxFlavors || 2));
    const normalizedSizes = existingSizes.map((size) => ({
      ...size,
      maxFlavors: initialMaxFlavors
    }));

    const baseSnapshot = {
      name: pizzaBase?.name || 'Pizza da Casa',
      category: pizzaBase?.category || categories[0] || 'Pizzas',
      description: pizzaBase?.description || '',
      imageUrl: pizzaBase?.imageUrl || '',
      sizes: normalizedSizes,
      maxFlavorsAllowed: initialMaxFlavors,
      flavorNameInput: '',
      editingFlavorId: null
    };

    setName(baseSnapshot.name);
    setCategory(baseSnapshot.category);
    setDescription(baseSnapshot.description);
    setImageUrl(baseSnapshot.imageUrl);
    setSizes(baseSnapshot.sizes);
    setMaxFlavorsAllowed(baseSnapshot.maxFlavorsAllowed);
    setFlavorNameInput('');
    setEditingFlavorId(null);
    setFlavorSearch('');
    setInitialSnapshot(JSON.stringify(baseSnapshot));
    loadFlavors();
  }, [pizzaBase, categories]);

  const filteredFlavors = useMemo(() => {
    const query = flavorSearch.trim().toLowerCase();
    if (!query) return flavors;
    return flavors.filter((flavor) => flavor.name.toLowerCase().includes(query));
  }, [flavors, flavorSearch]);

  const canSavePizza = sizes.length > 0 && sizes.every((size) => size.label.trim() && size.basePrice >= 0);

  useEffect(() => {
    if (!initialSnapshot) return;
    const snapshot = JSON.stringify({
      name,
      category,
      description,
      imageUrl,
      sizes,
      maxFlavorsAllowed,
      flavorNameInput,
      editingFlavorId
    });
    onDirtyChange?.(snapshot !== initialSnapshot);
  }, [name, category, description, imageUrl, sizes, maxFlavorsAllowed, flavorNameInput, editingFlavorId, initialSnapshot, onDirtyChange]);

  const addSize = () => {
    setSizes((prev) => [
      ...prev,
      { ...defaultSize(), maxFlavors: maxFlavorsAllowed }
    ]);
  };

  const removeSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: 'label' | 'basePrice', value: string) => {
    setSizes((prev) => prev.map((size, i) => {
      if (i !== index) return size;
      if (field === 'basePrice') {
        return { ...size, basePrice: Number(value) || 0, maxFlavors: maxFlavorsAllowed };
      }
      return { ...size, label: value, maxFlavors: maxFlavorsAllowed };
    }));
  };

  const handleMaxFlavorsChange = (value: number) => {
    setMaxFlavorsAllowed(value);
    setSizes((prev) => prev.map((size) => ({ ...size, maxFlavors: value })));
  };

  const startCreateFlavor = () => {
    setEditingFlavorId(null);
    setFlavorNameInput('');
  };

  const startEditFlavor = (flavor: PizzaFlavor) => {
    setEditingFlavorId(flavor.id);
    setFlavorNameInput(flavor.name);
  };

  const persistFlavor = async () => {
    const normalizedName = flavorNameInput.trim();
    if (!normalizedName) return;

    if (editingFlavorId) {
      const existing = flavors.find((flavor) => flavor.id === editingFlavorId);
      if (!existing) return;

      await dbPizzaFlavors.save(removeUndefinedDeep({
        ...existing,
        name: normalizedName,
        active: existing.active !== false,
        tags: existing.tags || [],
        ingredients: existing.ingredients || [],
        priceDeltaBySize: existing.priceDeltaBySize || null
      }));
    } else {
      await dbPizzaFlavors.save(removeUndefinedDeep({
        id: `flavor-${Date.now()}`,
        name: normalizedName,
        description: null,
        imageUrl: null,
        active: true,
        tags: [],
        ingredients: [],
        priceDeltaBySize: null
      }));
    }

    await loadFlavors();
    setFlavorNameInput('');
    setEditingFlavorId(null);
  };

  const removeFlavor = async (flavorId: string) => {
    await dbPizzaFlavors.delete(flavorId);
    await loadFlavors();
    if (editingFlavorId === flavorId) {
      setEditingFlavorId(null);
      setFlavorNameInput('');
    }
  };

  const handleSavePizza = async () => {
    if (!name.trim() || !canSavePizza) return;

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
        pricingStrategy: 'highestFlavor' as PizzaPricingStrategy,
        sizes: sizes.map((size) => ({
          id: size.id || `size-${Date.now()}`,
          label: size.label || 'Tamanho',
          basePrice: Number(size.basePrice || 0),
          maxFlavors: maxFlavorsAllowed,
          slices: null
        }))
      });

      await dbMenu.save(payload);
      await onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-0 relative">
      <div className="flex-1 overflow-y-auto p-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-800/40 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500 mb-1">Cadastro simples de pizza</p>
            <p className="text-xs text-stone-600 dark:text-stone-300">Preencha somente o necessário: tamanhos, sabores e limite de sabores por pizza.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel title="Nome (Pizza Base)" help="Nome do produto exibido no cardápio." helper="Nome que o cliente verá no cardápio." />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da pizza" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
            </div>
            <div className="space-y-2">
              <FieldLabel title="Categoria" help="Seção onde a pizza aparece no cardápio." helper="Ex.: Pizzas." />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700">
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <FieldLabel title="URL da imagem" help="Link da foto da pizza." helper="Opcional." />
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL da imagem" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
            </div>
            <div className="space-y-2">
              <FieldLabel title="Descrição" help="Texto curto para ajudar o cliente." helper="Opcional." />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black">Tamanhos da pizza</h3>
            {sizes.map((size, index) => (
              <div key={`${size.id}-${index}`} className="rounded-2xl border border-stone-200 dark:border-stone-700 p-3 grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-center">
                <input value={size.label} onChange={(e) => updateSize(index, 'label', e.target.value)} placeholder="Nome do tamanho" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl text-xs" />
                <input type="number" min={0} value={size.basePrice} onChange={(e) => updateSize(index, 'basePrice', e.target.value)} placeholder="Preço" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl text-xs" />
                <button onClick={() => removeSize(index)} className="p-2 rounded-xl border border-red-200 text-red-500 flex items-center justify-center" title="Remover tamanho">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={addSize} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase flex items-center gap-2">
              <Plus size={14} /> Adicionar tamanho
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-black">Máximo de sabores por pizza</h3>
            <p className="text-xs text-stone-500">Defina quantos sabores o cliente pode escolher em uma pizza.</p>
            <select value={maxFlavorsAllowed} onChange={(e) => handleMaxFlavorsChange(Number(e.target.value))} className="w-full sm:w-72 bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-sm font-bold">
              {MAX_FLAVOR_OPTIONS.map((option) => (
                <option key={option} value={option}>{option} {option === 1 ? 'sabor' : 'sabores'}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black">Sabores</h3>
            <div className="flex gap-2">
              <input value={flavorSearch} onChange={(e) => setFlavorSearch(e.target.value)} placeholder="Buscar sabor" className="flex-1 bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200" />
              <button onClick={startCreateFlavor} className="px-4 py-3 rounded-2xl bg-stone-100 text-xs font-black uppercase">Novo sabor</button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {filteredFlavors.map((flavor) => (
                <div key={flavor.id} className="w-full p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                  <p className="font-black text-xs">{flavor.name}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEditFlavor(flavor)} className="px-2 py-1 rounded-lg bg-stone-100 text-[10px] font-black uppercase">Editar</button>
                    <button onClick={() => removeFlavor(flavor.id)} className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase">Remover</button>
                  </div>
                </div>
              ))}
              {filteredFlavors.length === 0 && (
                <p className="text-xs text-stone-500">Nenhum sabor encontrado.</p>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 p-3 space-y-2">
              <p className="text-xs font-black">{editingFlavorId ? 'Editar sabor' : 'Adicionar sabor'}</p>
              <input value={flavorNameInput} onChange={(e) => setFlavorNameInput(e.target.value)} placeholder="Nome do sabor" className="w-full bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded-xl" />
              <button onClick={persistFlavor} className="w-full p-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase">Salvar sabor</button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-orange-200 dark:border-orange-800 p-5 bg-orange-50/40 dark:bg-orange-950/10 lg:sticky lg:top-0 h-fit space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Resumo</p>
          <p className="text-[11px] text-stone-500">Configuração simples para facilitar o cadastro e o pedido da pizza.</p>
          <div className="space-y-2">
            {sizes.map((size) => (
              <div key={size.id} className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200">
                <p className="text-xs font-black">{size.label || 'Tamanho'}</p>
                <p className="text-[11px] text-stone-500">R$ {Number(size.basePrice || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-stone-600">Máximo de sabores por pizza: {maxFlavorsAllowed}</p>
          <p className="text-sm font-black text-orange-600">A partir de R$ {Number(sizes[0]?.basePrice || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="px-6 lg:px-12 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3 bg-white dark:bg-stone-900">
        <button onClick={handleSavePizza} disabled={isSaving || !canSavePizza} className="px-5 py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase disabled:opacity-50 flex items-center gap-2">
          {isSaving ? 'Salvando...' : <>Salvar Pizza <Check size={14} /></>}
        </button>
      </div>
    </div>
  );
};

export default PizzaConfiguratorContent;
