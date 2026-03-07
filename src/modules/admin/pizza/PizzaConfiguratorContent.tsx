import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Search, Trash2, X } from 'lucide-react';
import { MenuItem, PizzaFlavor, PizzaPricingStrategy, PizzaSizeOption } from '../types';
import { dbMenu, dbPizzaFlavors } from '../services/dbService';
import { uploadImageToCloudinary } from '../services/cloudinaryUpload';

interface Props {
  pizzaBase?: MenuItem | null;
  categories: string[];
  onSaved: () => Promise<void> | void;
  onDirtyChange?: (dirty: boolean) => void;
}

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

interface QuickFlavorDraft {
  name: string;
  flavorType: 'Salgado' | 'Doce';
  imageUrl: string;
  extraPrice: string;
  active: boolean;
  ingredients: string[];
}

const EMPTY_QUICK_FLAVOR_DRAFT: QuickFlavorDraft = {
  name: '',
  flavorType: 'Salgado',
  imageUrl: '',
  extraPrice: '',
  active: true,
  ingredients: ['']
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
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  const [flavorQuery, setFlavorQuery] = useState('');
  const [flavorTypeFilter, setFlavorTypeFilter] = useState<'Todos' | 'Salgados' | 'Doces'>('Todos');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isSavingQuickFlavor, setIsSavingQuickFlavor] = useState(false);
  const [quickFlavorDraft, setQuickFlavorDraft] = useState<QuickFlavorDraft>(EMPTY_QUICK_FLAVOR_DRAFT);
  const [quickFlavorMessage, setQuickFlavorMessage] = useState<string | null>(null);
  const [quickFlavorError, setQuickFlavorError] = useState<string | null>(null);
  const [quickFlavorImageFile, setQuickFlavorImageFile] = useState<File | null>(null);
  const [quickFlavorImagePreview, setQuickFlavorImagePreview] = useState('');
  const [quickFlavorImageUploadError, setQuickFlavorImageUploadError] = useState<string | null>(null);
  const [isUploadingQuickFlavorImage, setIsUploadingQuickFlavorImage] = useState(false);
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
      allowedFlavorIds: pizzaBase?.allowedFlavorIds || []
    };

    setName(snapshot.name);
    setDescription(snapshot.description);
    setImageUrl(snapshot.imageUrl);
    setImagePublicId(snapshot.imagePublicId);
    setSizes(snapshot.sizes);
    setSelectedFlavorIds(snapshot.allowedFlavorIds);
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
      sizes,
      allowedFlavorIds: selectedFlavorIds
    });
    onDirtyChange?.(snapshot !== initialSnapshot);
  }, [name, description, imageUrl, imagePublicId, sizes, selectedFlavorIds, initialSnapshot, onDirtyChange]);

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalImagePreview(URL.createObjectURL(file));
    setImageUploadError(null);
    setSelectedImageFile(file);
    event.target.value = '';
  };

  const handleQuickFlavorImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setQuickFlavorImagePreview(URL.createObjectURL(file));
    setQuickFlavorImageUploadError(null);
    setQuickFlavorImageFile(file);
    event.target.value = '';
  };

  const resetQuickFlavorForm = () => {
    setQuickFlavorDraft(EMPTY_QUICK_FLAVOR_DRAFT);
    setQuickFlavorImageFile(null);
    setQuickFlavorImagePreview('');
    setQuickFlavorImageUploadError(null);
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
      if (flavor.active === false) return false;
      const type = flavor.flavorType === 'Doce' ? 'Doces' : 'Salgados';
      const matchType = flavorTypeFilter === 'Todos' || flavorTypeFilter === type;
      const matchName = !normalizedQuery || flavor.name.toLowerCase().includes(normalizedQuery);
      return matchType && matchName;
    });
  }, [pizzaFlavors, flavorQuery, flavorTypeFilter]);

  const toggleFlavorSelection = (flavorId: string) => {
    setSelectedFlavorIds((prev) => prev.includes(flavorId)
      ? prev.filter((id) => id !== flavorId)
      : [...prev, flavorId]);
  };

  const normalizeExtraPrice = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleAddIngredientField = () => {
    setQuickFlavorDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, ''] }));
  };

  const handleRemoveIngredientField = (index: number) => {
    setQuickFlavorDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.length <= 1 ? [''] : prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleIngredientChange = (index: number, value: string) => {
    setQuickFlavorDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => (i === index ? value : ingredient))
    }));
  };

  const handleSaveQuickFlavor = async () => {
    const normalizedName = quickFlavorDraft.name.trim();
    if (!normalizedName) {
      setQuickFlavorError('Não é possível salvar sem o nome do sabor.');
      return;
    }

    if (!quickFlavorDraft.flavorType) {
      setQuickFlavorError('Selecione o tipo do sabor.');
      return;
    }

    if (pizzaFlavors.some((flavor) => flavor.name.trim().toLowerCase() === normalizedName.toLowerCase())) {
      setQuickFlavorError('Já existe um sabor global com esse nome.');
      return;
    }

    const normalizedExtraPrice = normalizeExtraPrice(quickFlavorDraft.extraPrice);
    if (quickFlavorDraft.extraPrice.trim() && normalizedExtraPrice === null) {
      setQuickFlavorError('Preço extra inválido.');
      return;
    }

    const normalizedIngredients = quickFlavorDraft.ingredients
      .map((ingredient) => ingredient.trim())
      .filter(Boolean)
      .filter((ingredient, index, list) => list.findIndex((item) => item.toLowerCase() === ingredient.toLowerCase()) === index)
      .map((ingredient, index) => ({ id: `flavor-ingredient-${Date.now()}-${index}`, name: ingredient }));

    if (!normalizedIngredients.length) {
      setQuickFlavorError('Adicione ao menos 1 ingrediente para esse sabor.');
      return;
    }

    setIsSavingQuickFlavor(true);
    setQuickFlavorError(null);
    setQuickFlavorMessage(null);

    try {
      let resolvedFlavorImageUrl = quickFlavorDraft.imageUrl || '';
      if (quickFlavorImageFile) {
        setIsUploadingQuickFlavorImage(true);
        setQuickFlavorImageUploadError(null);
        try {
          const uploaded = await uploadImageToCloudinary(quickFlavorImageFile);
          resolvedFlavorImageUrl = uploaded.secureUrl;
        } catch (error) {
          setQuickFlavorImageUploadError(error instanceof Error ? error.message : 'Não foi possível enviar a imagem do sabor.');
          return;
        } finally {
          setIsUploadingQuickFlavorImage(false);
        }
      }

      const flavorId = `pizza-flavor-${Date.now()}`;
      await dbPizzaFlavors.save({
        id: flavorId,
        name: normalizedName,
        flavorType: quickFlavorDraft.flavorType,
        imageUrl: resolvedFlavorImageUrl || undefined,
        extraPrice: normalizedExtraPrice,
        active: quickFlavorDraft.active,
        tags: [],
        ingredients: normalizedIngredients,
        priceDeltaBySize: null
      });

      const updatedFlavors = await dbPizzaFlavors.getAll();
      setPizzaFlavors(updatedFlavors);
      setSelectedFlavorIds((prev) => (prev.includes(flavorId) ? prev : [...prev, flavorId]));
      resetQuickFlavorForm();
      setQuickFlavorMessage('Sabor criado com sucesso e vinculado à pizza.');
      setIsQuickCreateOpen(false);
    } catch (error) {
      setQuickFlavorError(error instanceof Error ? error.message : 'Não foi possível salvar o sabor agora.');
    } finally {
      setIsSavingQuickFlavor(false);
    }
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
        allowedFlavorIds: selectedFlavorIds,
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
                  <input value={size.label} onChange={(e) => updateSize(index, 'label', e.target.value)} placeholder="Ex: Grande" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Preço base</label>
                  <input type="number" min={0} step="0.01" value={size.basePrice} onChange={(e) => updateSize(index, 'basePrice', e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Fatias</label>
                  <input type="number" min={1} value={size.slices ?? ''} onChange={(e) => updateSize(index, 'slices', e.target.value)} placeholder="Opcional" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Máximo de sabores</label>
                  <select value={size.maxFlavors} onChange={(e) => updateSize(index, 'maxFlavors', e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700">
                    {MAX_FLAVOR_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} {option === 1 ? 'sabor' : 'sabores'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addSize} className="px-4 py-2 rounded-xl border border-dashed border-stone-300 text-xs font-black uppercase text-stone-500 hover:border-orange-500 hover:text-orange-500 transition-all">
            + Adicionar tamanho
          </button>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black">Sabores vinculados</h3>
              <p className="text-xs text-stone-500">Selecione os sabores disponíveis para esta pizza ou cadastre um novo sabor rapidamente.</p>
            </div>
            <button onClick={() => {
              setIsQuickCreateOpen((prev) => !prev);
              setQuickFlavorError(null);
              setQuickFlavorMessage(null);
              setQuickFlavorImageUploadError(null);
            }} className="px-3 py-2 rounded-xl border border-orange-200 text-orange-600 text-xs font-black uppercase inline-flex items-center gap-1 hover:bg-orange-50 dark:hover:bg-orange-500/10">
              <Plus size={12} /> {isQuickCreateOpen ? 'Fechar' : 'Novo sabor'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input value={flavorQuery} onChange={(e) => setFlavorQuery(e.target.value)} placeholder="Buscar sabor" className="w-full bg-stone-50 dark:bg-stone-800 py-2.5 pl-9 pr-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm" />
            </div>
            <select value={flavorTypeFilter} onChange={(e) => setFlavorTypeFilter(e.target.value as 'Todos' | 'Salgados' | 'Doces')} className="w-full bg-stone-50 dark:bg-stone-800 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm">
              <option value="Todos">Todos os tipos</option>
              <option value="Salgados">Salgados</option>
              <option value="Doces">Doces</option>
            </select>
          </div>

          {isQuickCreateOpen && (
            <div className="rounded-2xl border border-orange-200 dark:border-orange-500/40 p-4 space-y-3 bg-orange-50/50 dark:bg-orange-500/5">
              <h4 className="text-xs font-black uppercase text-orange-700 dark:text-orange-300">Cadastrar novo sabor</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input value={quickFlavorDraft.name} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ex: Calabresa" className="w-full bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm" />

                <select value={quickFlavorDraft.flavorType} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, flavorType: e.target.value as 'Salgado' | 'Doce' }))} className="w-full bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm">
                  <option value="Salgado">Salgado</option>
                  <option value="Doce">Doce</option>
                </select>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-500">Imagem do sabor</label>
                  <label className="w-full bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm cursor-pointer inline-flex items-center justify-between">
                    <span className="truncate">{quickFlavorImageFile?.name || 'Selecionar imagem (opcional)'}</span>
                    <input type="file" accept="image/*" onChange={handleQuickFlavorImageChange} className="hidden" />
                  </label>
                  {(quickFlavorImagePreview || quickFlavorDraft.imageUrl) && (
                    <img src={quickFlavorImagePreview || quickFlavorDraft.imageUrl} alt="Prévia do sabor" className="w-16 h-16 rounded-xl object-cover border border-stone-200" />
                  )}
                </div>

                <input type="number" min={0} step="0.01" value={quickFlavorDraft.extraPrice} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, extraPrice: e.target.value }))} placeholder="Preço extra (opcional)" className="w-full bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm" />

                <label className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 inline-flex items-center justify-between text-sm text-stone-600 dark:text-stone-300">
                  Ativo
                  <input type="checkbox" checked={quickFlavorDraft.active} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, active: e.target.checked }))} />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase text-stone-500">Ingredientes</p>
                {quickFlavorDraft.ingredients.map((ingredient, index) => (
                  <div key={`quick-ingredient-${index}`} className="flex items-center gap-2">
                    <input value={ingredient} onChange={(e) => handleIngredientChange(index, e.target.value)} placeholder="Ex: Mussarela" className="flex-1 bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm" />
                    <button onClick={() => handleRemoveIngredientField(index)} className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-red-500" title="Remover ingrediente">
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <button onClick={handleAddIngredientField} className="text-xs font-black text-orange-600 hover:text-orange-500">+ Adicionar ingrediente</button>
              </div>

              {isUploadingQuickFlavorImage && <p className="text-xs text-orange-500">Enviando imagem do sabor...</p>}
              {quickFlavorImageUploadError && <p className="text-xs text-red-500">{quickFlavorImageUploadError}</p>}
              {quickFlavorError && <p className="text-xs text-red-500">{quickFlavorError}</p>}
              {quickFlavorMessage && <p className="text-xs text-green-600">{quickFlavorMessage}</p>}

              <div className="flex items-center justify-end gap-2">
                <button onClick={() => {
                  setIsQuickCreateOpen(false);
                  resetQuickFlavorForm();
                  setQuickFlavorError(null);
                  setQuickFlavorMessage(null);
                }} className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-black uppercase text-stone-500">Cancelar</button>
                <button onClick={handleSaveQuickFlavor} disabled={isSavingQuickFlavor || isUploadingQuickFlavorImage} className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase disabled:opacity-50">{isSavingQuickFlavor || isUploadingQuickFlavorImage ? 'Salvando...' : 'Salvar sabor'}</button>
              </div>
            </div>
          )}

          {filteredFlavors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 p-4 text-center space-y-2">
              <p className="text-sm font-black text-stone-600">{pizzaFlavors.length === 0 ? 'Nenhum sabor cadastrado' : 'Nenhum sabor encontrado'}</p>
              <p className="text-xs text-stone-500">{pizzaFlavors.length === 0 ? 'Cadastre o primeiro sabor para começar.' : 'Tente outro filtro ou cadastre um novo sabor.'}</p>
              <button onClick={() => setIsQuickCreateOpen(true)} className="text-xs font-black text-orange-600">Abrir cadastro rápido</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredFlavors.map((flavor) => {
                const isSelected = selectedFlavorIds.includes(flavor.id);
                const typeLabel = flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado';
                const ingredientPreview = (flavor.ingredients || []).slice(0, 3).map((ingredient) => ingredient.name).join(', ');
                return (
                  <button key={flavor.id} onClick={() => toggleFlavorSelection(flavor.id)} className={`rounded-2xl border p-3 text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shrink-0">
                        {flavor.imageUrl ? (
                          <img src={flavor.imageUrl} alt={flavor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-black uppercase text-stone-400">Sem foto</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-stone-800 dark:text-stone-100 truncate">{flavor.name}</p>
                        <p className="text-[11px] text-stone-500">{typeLabel} {typeof flavor.extraPrice === 'number' ? `• +R$ ${flavor.extraPrice.toFixed(2)}` : ''}</p>
                        <p className="text-[11px] text-stone-400 truncate">{ingredientPreview || 'Sem ingredientes cadastrados'}</p>
                      </div>
                      {isSelected && <Check size={14} className="text-orange-500" />}
                    </div>
                  </button>
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
    </div>
  );
};

export default PizzaConfiguratorContent;
