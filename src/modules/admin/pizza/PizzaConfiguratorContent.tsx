import React, { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { MenuItem, PizzaFlavor, PizzaPricingStrategy, PizzaSizeOption } from '../types';
import { dbMenu, dbPizzaFlavors } from '../services/dbService';
import { uploadImageToCloudinary } from '../services/cloudinaryUpload';

interface Props {
  pizzaBase?: MenuItem | null;
  categories: string[];
  onSaved: () => Promise<void> | void;
  onDirtyChange?: (dirty: boolean) => void;
}

type FlavorDraft = {
  id?: string;
  name: string;
  flavorType: 'Salgado' | 'Doce';
  extraPrice: string;
  active: boolean;
};

const EMPTY_FLAVOR_DRAFT: FlavorDraft = {
  name: '',
  flavorType: 'Salgado',
  extraPrice: '',
  active: true
};

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => removeUndefinedDeep(item)) as T;
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
const PIZZA_CATEGORY = 'Pizzas';

const normalizeExtraPrice = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const PizzaConfiguratorContent: React.FC<Props> = ({ pizzaBase, categories: _categories, onSaved, onDirtyChange }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [sizes, setSizes] = useState<PizzaSizeOption[]>([defaultSize()]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [pizzaFlavors, setPizzaFlavors] = useState<PizzaFlavor[]>([]);
  const [flavorQuery, setFlavorQuery] = useState('');
  const [flavorTypeFilter, setFlavorTypeFilter] = useState<'Todos' | 'Salgados' | 'Doces'>('Todos');
  const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false);
  const [flavorDraft, setFlavorDraft] = useState<FlavorDraft>(EMPTY_FLAVOR_DRAFT);
  const [flavorError, setFlavorError] = useState('');
  const [isSavingFlavor, setIsSavingFlavor] = useState(false);

  const [initialSnapshot, setInitialSnapshot] = useState('');

  const loadFlavors = async () => {
    const data = await dbPizzaFlavors.getAll();
    setPizzaFlavors(data);
  };

  useEffect(() => {
    const existingSizes = pizzaBase?.sizes?.length ? pizzaBase.sizes : [defaultSize()];
    const initialMaxFlavors = Math.max(1, Math.min(4, existingSizes[0]?.maxFlavors || 2));
    const normalizedSizes = existingSizes.map((size) => ({ ...size, maxFlavors: Math.max(1, Math.min(4, size.maxFlavors || initialMaxFlavors)), slices: size.slices ?? null }));

    const snapshot = {
      name: pizzaBase?.name || 'Pizza da Casa',
      category: PIZZA_CATEGORY,
      description: pizzaBase?.description || '',
      imageUrl: pizzaBase?.imageUrl || '',
      imagePublicId: pizzaBase?.imagePublicId || '',
      sizes: normalizedSizes,
    };

    setName(snapshot.name);
    setDescription(snapshot.description);
    setImageUrl(snapshot.imageUrl);
    setImagePublicId(snapshot.imagePublicId);
    setSizes(snapshot.sizes);
    setInitialSnapshot(JSON.stringify(snapshot));
    loadFlavors();
  }, [pizzaBase]);

  useEffect(() => {
    if (!initialSnapshot) return;
    const snapshot = JSON.stringify({
      name,
      category: PIZZA_CATEGORY,
      description,
      imageUrl,
      imagePublicId,
      sizes
    });
    onDirtyChange?.(snapshot !== initialSnapshot);
  }, [name, description, imageUrl, imagePublicId, sizes, initialSnapshot, onDirtyChange]);

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalImagePreview(URL.createObjectURL(file));
    setImageUploadError(null);
    setSelectedImageFile(file);
    event.target.value = '';
  };

  const canSavePizza = sizes.length > 0 && sizes.every((size) => size.label.trim() && size.basePrice >= 0);

  const addSize = () => {
    setSizes((prev) => [...prev, defaultSize()]);
  };

  const updateSize = (index: number, field: 'label' | 'basePrice' | 'slices' | 'maxFlavors', value: string) => {
    setSizes((prev) => prev.map((size, i) => {
      if (i !== index) return size;
      if (field === 'basePrice') return { ...size, basePrice: Math.max(0, Number(value) || 0) };
      if (field === 'maxFlavors') return { ...size, maxFlavors: Math.max(1, Math.min(4, Number(value) || 1)) };
      if (field === 'slices') return { ...size, slices: value ? Math.max(1, Number(value) || 1) : null };
      return { ...size, label: value };
    }));
  };

  const removeSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredFlavors = useMemo(() => {
    const normalizedQuery = flavorQuery.trim().toLowerCase();
    return pizzaFlavors.filter((flavor) => {
      const type = flavor.flavorType === 'Doce' ? 'Doces' : 'Salgados';
      const matchType = flavorTypeFilter === 'Todos' || flavorTypeFilter === type;
      const matchName = !normalizedQuery || flavor.name.toLowerCase().includes(normalizedQuery);
      return matchType && matchName;
    });
  }, [pizzaFlavors, flavorQuery, flavorTypeFilter]);

  const openFlavorModal = (flavor?: PizzaFlavor) => {
    if (!flavor) {
      setFlavorDraft(EMPTY_FLAVOR_DRAFT);
      setFlavorError('');
      setIsFlavorModalOpen(true);
      return;
    }

    setFlavorDraft({
      id: flavor.id,
      name: flavor.name,
      flavorType: flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado',
      extraPrice: typeof flavor.extraPrice === 'number' ? String(flavor.extraPrice) : '',
      active: flavor.active !== false
    });
    setFlavorError('');
    setIsFlavorModalOpen(true);
  };

  const closeFlavorModal = () => {
    if (isSavingFlavor) return;
    setIsFlavorModalOpen(false);
    setFlavorDraft(EMPTY_FLAVOR_DRAFT);
    setFlavorError('');
  };

  const handleSaveFlavor = async () => {
    const normalizedName = flavorDraft.name.trim();
    if (!normalizedName) {
      setFlavorError('Informe o nome do sabor.');
      return;
    }

    const duplicated = pizzaFlavors.find((flavor) => (
      flavor.id !== flavorDraft.id
      && flavor.name.trim().toLowerCase() === normalizedName.toLowerCase()
    ));

    if (duplicated) {
      setFlavorError('Já existe um sabor com esse nome.');
      return;
    }

    if (flavorDraft.extraPrice.trim() && normalizeExtraPrice(flavorDraft.extraPrice) === null) {
      setFlavorError('Preço extra inválido.');
      return;
    }

    setIsSavingFlavor(true);
    setFlavorError('');
    try {
      await dbPizzaFlavors.save({
        id: flavorDraft.id || `flavor-${Date.now()}`,
        name: normalizedName,
        flavorType: flavorDraft.flavorType,
        extraPrice: normalizeExtraPrice(flavorDraft.extraPrice),
        active: flavorDraft.active,
        tags: [],
        ingredients: [],
        priceDeltaBySize: null,
        description: null,
        imageUrl: null
      });

      await loadFlavors();
      closeFlavorModal();
    } finally {
      setIsSavingFlavor(false);
    }
  };

  const toggleFlavorStatus = async (flavor: PizzaFlavor) => {
    await dbPizzaFlavors.save({
      ...flavor,
      flavorType: flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado',
      extraPrice: typeof flavor.extraPrice === 'number' ? flavor.extraPrice : null,
      active: flavor.active === false,
      tags: flavor.tags || [],
      ingredients: flavor.ingredients || [],
      priceDeltaBySize: flavor.priceDeltaBySize || null
    });
    await loadFlavors();
  };

  const deleteFlavor = async (flavor: PizzaFlavor) => {
    const confirmed = window.confirm(`Deseja excluir o sabor "${flavor.name}"?`);
    if (!confirmed) return;
    await dbPizzaFlavors.delete(flavor.id);
    await loadFlavors();
  };

  const handleSavePizza = async () => {
    if (isUploadingImage) return;
    if (!name.trim() || !canSavePizza) return;

    setIsSaving(true);
    try {
      let resolvedImageUrl = imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800';
      let resolvedImagePublicId = imagePublicId || '';

      if (selectedImageFile) {
        setIsUploadingImage(true);
        setImageUploadError(null);
        try {
          const uploaded = await uploadImageToCloudinary(selectedImageFile);
          resolvedImageUrl = uploaded.secureUrl;
          resolvedImagePublicId = uploaded.publicId;
        } catch (error) {
          setImageUploadError(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.');
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      const payload: MenuItem = removeUndefinedDeep({
        id: pizzaBase?.id || `pizza-${Date.now()}`,
        type: 'pizza',
        name,
        category: PIZZA_CATEGORY,
        price: sizes[0]?.basePrice || 0,
        description,
        imageUrl: resolvedImageUrl,
        imagePublicId: resolvedImagePublicId || undefined,
        rating: 5,
        preparationTime: '30 min',
        size: 'M',
        tags: ['pizza'],
        ingredients: [],
        extras: [],
        pricingStrategy: 'fixedBySize' as PizzaPricingStrategy,
        sizes: sizes.map((size) => ({
          id: size.id || `size-${Date.now()}`,
          label: size.label || 'Tamanho',
          basePrice: Number(size.basePrice || 0),
          maxFlavors: Math.max(1, Math.min(4, Number(size.maxFlavors || 1))),
          slices: size.slices ?? null
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
      <div className="flex-1 overflow-y-auto p-6 lg:px-12 space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-black">Informações básicas</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da pizza (Ex: Pizza da Casa)" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold text-sm text-stone-600 dark:text-stone-300 cursor-pointer hover:border-orange-400 transition-all inline-flex items-center gap-2 w-fit">
                Selecionar imagem
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
              </label>
              {selectedImageFile && <span className="text-[11px] text-stone-500 font-bold truncate max-w-[180px]">{selectedImageFile.name}</span>}
              {isUploadingImage && <span className="text-[11px] text-orange-500 font-bold">Enviando imagem...</span>}
            </div>
            {imageUploadError && <p className="text-[11px] text-red-500">{imageUploadError}</p>}
            {(localImagePreview || imageUrl) && <img src={localImagePreview || imageUrl} alt="Prévia" className="w-20 h-20 rounded-xl object-cover border border-stone-200" />}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-black">Tamanhos da pizza</h3>
          {sizes.map((size, index) => (
            <div key={`${size.id}-${index}`} className="rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-4 bg-white dark:bg-stone-900">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400">Tamanho {index + 1}</p>
                <button onClick={() => removeSize(index)} className="p-2 rounded-lg border border-red-200 text-red-500 flex items-center justify-center" title="Remover tamanho">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Nome do tamanho</label>
                  <input value={size.label} onChange={(e) => updateSize(index, 'label', e.target.value)} placeholder="Ex: Pequena, Média, Grande, Gigante" className="w-full bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Preço</label>
                  <input type="number" min={0} step="0.01" value={size.basePrice} onChange={(e) => updateSize(index, 'basePrice', e.target.value)} placeholder="R$ 0,00" className="w-full bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Quantidade de fatias</label>
                  <input type="number" min={1} value={size.slices ?? ''} onChange={(e) => updateSize(index, 'slices', e.target.value)} placeholder="Ex: 4, 6, 8" className="w-full bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Máximo de sabores</label>
                  <select value={size.maxFlavors} onChange={(e) => updateSize(index, 'maxFlavors', e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold">
                    {MAX_FLAVOR_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} {option === 1 ? 'sabor' : 'sabores'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addSize} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase flex items-center gap-2">
            <Plus size={14} /> Adicionar tamanho de pizza
          </button>
        </section>

        <section className="space-y-3 border border-stone-200 dark:border-stone-700 rounded-3xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-black">Sabores disponíveis</h3>
              <p className="text-xs text-stone-500">Cadastre e gerencie os sabores que poderão ser escolhidos nas pizzas.</p>
            </div>
            <button onClick={() => openFlavorModal()} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-[11px] font-black uppercase flex items-center gap-1.5 w-fit">
              <Plus size={12} /> Novo sabor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input value={flavorQuery} onChange={(e) => setFlavorQuery(e.target.value)} placeholder="Buscar sabor" className="w-full bg-stone-50 dark:bg-stone-800 py-2.5 pl-9 pr-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm" />
            </div>
            <div className="flex bg-stone-50 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 w-fit">
              {(['Todos', 'Salgados', 'Doces'] as const).map((option) => (
                <button key={option} onClick={() => setFlavorTypeFilter(option)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${flavorTypeFilter === option ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'text-stone-500'}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          {filteredFlavors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-5 text-center">
              <p className="text-sm font-bold text-stone-600">Nenhum sabor cadastrado</p>
              <p className="text-xs text-stone-500 mt-1">Cadastre sabores como Calabresa, Portuguesa ou Chocolate para usar nas pizzas.</p>
              <button onClick={() => openFlavorModal()} className="mt-3 px-4 py-2 rounded-xl bg-orange-500 text-white text-[11px] font-black uppercase">Novo sabor</button>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredFlavors.map((flavor) => {
                const typeLabel = flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado';
                const extraPriceLabel = typeof flavor.extraPrice === 'number' ? `+R$ ${flavor.extraPrice.toFixed(2)}` : 'Sem adicional';
                const isActive = flavor.active !== false;

                return (
                  <div key={flavor.id} className="rounded-2xl border border-stone-200 dark:border-stone-700 p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-stone-800 dark:text-stone-100 truncate">{flavor.name}</p>
                      <p className="text-[11px] text-stone-500">{typeLabel} • {extraPriceLabel} • {isActive ? 'Ativo' : 'Inativo'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleFlavorStatus(flavor)} className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${isActive ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {isActive ? 'Ativo' : 'Inativo'}
                      </button>
                      <button onClick={() => openFlavorModal(flavor)} className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600" title="Editar sabor">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deleteFlavor(flavor)} className="p-2 rounded-lg bg-red-50 text-red-600" title="Excluir sabor">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="px-6 lg:px-12 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end bg-white dark:bg-stone-900">
        <button onClick={handleSavePizza} disabled={isSaving || !canSavePizza || isUploadingImage} className="px-5 py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase disabled:opacity-50 flex items-center gap-2">
          {isSaving ? 'Salvando...' : <>Salvar Pizza <Check size={14} /></>}
        </button>
      </div>

      {isFlavorModalOpen && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[230] flex items-center justify-center p-3">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-stone-800 dark:text-white">{flavorDraft.id ? 'Editar sabor' : 'Novo sabor'}</h3>
                <p className="text-xs text-stone-500">Cadastre um sabor para usar na montagem das pizzas.</p>
              </div>
              <button onClick={closeFlavorModal} className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Nome do sabor</label>
                <input value={flavorDraft.name} onChange={(e) => setFlavorDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ex: Calabresa" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500">Tipo</label>
                <div className="flex bg-stone-50 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
                  {(['Salgado', 'Doce'] as const).map((type) => (
                    <button key={type} onClick={() => setFlavorDraft((prev) => ({ ...prev, flavorType: type }))} className={`flex-1 px-3 py-2 rounded-lg text-xs font-black uppercase ${flavorDraft.flavorType === type ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'text-stone-500'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Preço extra</label>
                  <input type="number" min={0} step="0.01" value={flavorDraft.extraPrice} onChange={(e) => setFlavorDraft((prev) => ({ ...prev, extraPrice: e.target.value }))} placeholder="Opcional" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
                </div>
                <label className="flex items-end gap-2 text-sm font-bold text-stone-700 dark:text-stone-200 pb-3">
                  <input type="checkbox" checked={flavorDraft.active} onChange={(e) => setFlavorDraft((prev) => ({ ...prev, active: e.target.checked }))} />
                  Ativo
                </label>
              </div>

              {flavorError && <p className="text-sm text-red-500">{flavorError}</p>}
            </div>

            <div className="p-5 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
              <button onClick={closeFlavorModal} className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs font-black uppercase">Cancelar</button>
              <button onClick={handleSaveFlavor} disabled={isSavingFlavor} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase disabled:opacity-60">
                {isSavingFlavor ? 'Salvando...' : 'Salvar sabor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PizzaConfiguratorContent;
