import React, { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { MenuItem, PizzaFlavor, PizzaPricingStrategy, PizzaTypeConfig } from '../types';
import { dbMenu, dbPizzaFlavors, dbPizzaTypes } from '../services/dbService';
import { uploadImageToCloudinary } from '../services/cloudinaryUpload';

interface Props {
  pizzaBase?: MenuItem | null;
  categories: string[];
  onSaved: () => Promise<void> | void;
  onDirtyChange?: (dirty: boolean) => void;
}

interface QuickFlavorDraft {
  name: string;
  description: string;
  flavorType: 'Salgado' | 'Doce';
  category: 'Tradicional' | 'Especial' | 'Doce';
  imageUrl: string;
  active: boolean;
  ingredients: string[];
}


interface BorderDraft {
  name: string;
  borderType: 'Salgada' | 'Doce';
  extraPrice: string;
  active: boolean;
}

interface BorderOption {
  id: string;
  name: string;
  borderType: 'Salgada' | 'Doce';
  extraPrice: number;
  active: boolean;
}

const FIXED_PIZZA_IMAGE = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800';
const PIZZA_CATEGORY = 'Pizzas';

const EMPTY_QUICK_FLAVOR_DRAFT: QuickFlavorDraft = {
  name: '',
  description: '',
  flavorType: 'Salgado',
  category: 'Tradicional',
  imageUrl: '',
  active: true,
  ingredients: ['']
};

const EMPTY_BORDER_DRAFT: BorderDraft = {
  name: '',
  borderType: 'Salgada',
  extraPrice: '',
  active: true
};

const removeUndefinedDeep = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map((item) => removeUndefinedDeep(item)) as T;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, removeUndefinedDeep(v)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
};

const slugify = (value: string) => value
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const formatCurrencyBRL = (value: number): string => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(value);

const parseCurrencyInput = (value: string): number => {
  const sanitized = value.replace(/[^\d.,]/g, '').trim();
  if (!sanitized) return 0;

  const commaIndex = sanitized.lastIndexOf(',');
  const dotIndex = sanitized.lastIndexOf('.');
  const separatorIndex = Math.max(commaIndex, dotIndex);

  if (separatorIndex === -1) {
    return Number(sanitized.replace(/\D/g, '')) || 0;
  }

  const integerPart = sanitized.slice(0, separatorIndex).replace(/\D/g, '');
  const decimalPart = sanitized.slice(separatorIndex + 1).replace(/\D/g, '').slice(0, 2);
  return Number(`${integerPart || '0'}.${decimalPart}`) || 0;
};

const sanitizeIntegerInput = (value: string) => value.replace(/\D/g, '');

const PizzaConfiguratorContent: React.FC<Props> = ({ pizzaBase, categories: _categories, onSaved, onDirtyChange }) => {
  const [isSaving, setIsSaving] = useState(false);

  const [pizzaTypes, setPizzaTypes] = useState<PizzaTypeConfig[]>([]);
  const [sizeDraft, setSizeDraft] = useState({ typeName: '', slices: '8', maxFlavors: '2', isActive: true });
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);

  const [pizzaFlavors, setPizzaFlavors] = useState<PizzaFlavor[]>([]);
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
  const [flavorQuery, setFlavorQuery] = useState('');
  const [flavorTypeFilter, setFlavorTypeFilter] = useState<'Todos' | 'Salgados' | 'Doces'>('Todos');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isSavingQuickFlavor, setIsSavingQuickFlavor] = useState(false);
  const [editingFlavorId, setEditingFlavorId] = useState<string | null>(null);
  const [quickFlavorDraft, setQuickFlavorDraft] = useState<QuickFlavorDraft>(EMPTY_QUICK_FLAVOR_DRAFT);
  const [quickFlavorMessage, setQuickFlavorMessage] = useState<string | null>(null);
  const [quickFlavorError, setQuickFlavorError] = useState<string | null>(null);
  const [quickFlavorImageFile, setQuickFlavorImageFile] = useState<File | null>(null);
  const [quickFlavorImagePreview, setQuickFlavorImagePreview] = useState('');
  const [quickFlavorImageUploadError, setQuickFlavorImageUploadError] = useState<string | null>(null);
  const [isUploadingQuickFlavorImage, setIsUploadingQuickFlavorImage] = useState(false);

  const [borders, setBorders] = useState<BorderOption[]>([]);
  const [borderDraft, setBorderDraft] = useState<BorderDraft>(EMPTY_BORDER_DRAFT);
  const [editingBorderId, setEditingBorderId] = useState<string | null>(null);

  const [flavorPrices, setFlavorPrices] = useState<Record<string, Record<string, string>>>({});
  const [borderPrices, setBorderPrices] = useState<Record<string, Record<string, string>>>({});
  const [initialSnapshot, setInitialSnapshot] = useState('');

  const loadFlavors = async () => {
    const data = await dbPizzaFlavors.getAll();
    setPizzaFlavors(data);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const [typesData, flavorsData] = await Promise.all([dbPizzaTypes.listPizzaTypes(), dbPizzaFlavors.getAll()]);
      const inferredSizes = (pizzaBase?.sizes || []).map((size) => ({
        id: size.id,
        typeName: size.label,
        basePrice: 0,
        slices: Math.max(1, Number(size.slices || 1)),
        maxFlavors: Math.max(1, Math.min(4, Number(size.maxFlavors || 1))),
        isActive: true
      }));

      const mergedTypes = [...typesData];
      inferredSizes.forEach((legacySize) => {
        if (!mergedTypes.some((type) => type.id === legacySize.id)) {
          mergedTypes.push(legacySize);
        }
      });

      setPizzaTypes(mergedTypes);
      setPizzaFlavors(flavorsData);
      setSelectedFlavorIds(pizzaBase?.allowedFlavorIds || []);

      const initialBorders: BorderOption[] = (pizzaBase?.extras || []).map((extra, index) => ({
        id: `pizza-border-${index}-${slugify(extra.name || '') || Date.now()}` ,
        name: extra.name || '',
        borderType: 'Salgada',
        extraPrice: Math.max(0, Number(extra.price || 0)),
        active: true
      })).filter((border) => border.name);
      setBorders(initialBorders);

      const initialBorderPrices: Record<string, Record<string, string>> = {};
      initialBorders.forEach((border) => {
        initialBorderPrices[border.id] = {};
        mergedTypes.filter((type) => type.isActive !== false).forEach((size) => {
          initialBorderPrices[border.id][size.id] = String(border.extraPrice || 0);
        });
      });
      setBorderPrices(initialBorderPrices);

      const pricingSnapshot: Record<string, Record<string, string>> = {};
      flavorsData.forEach((flavor) => {
        pricingSnapshot[flavor.id] = {};
        Object.entries(flavor.priceDeltaBySize || {}).forEach(([sizeId, price]) => {
          pricingSnapshot[flavor.id][sizeId] = String(price);
        });
      });
      setFlavorPrices(pricingSnapshot);

      const snapshot = JSON.stringify({
        pizzaTypes: mergedTypes,
        allowedFlavorIds: pizzaBase?.allowedFlavorIds || [],
        flavorPrices: pricingSnapshot,
        borders: initialBorders,
        borderPrices: initialBorderPrices
      });
      setInitialSnapshot(snapshot);
    };

    bootstrap();
  }, [pizzaBase]);

  useEffect(() => {
    if (!initialSnapshot) return;
    const snapshot = JSON.stringify({
      pizzaTypes,
      allowedFlavorIds: selectedFlavorIds,
      flavorPrices,
      borders,
      borderPrices
    });
    onDirtyChange?.(snapshot !== initialSnapshot);
  }, [pizzaTypes, selectedFlavorIds, flavorPrices, borders, borderPrices, initialSnapshot, onDirtyChange]);

  const activeSizes = useMemo(() => pizzaTypes.filter((type) => type.isActive !== false), [pizzaTypes]);

  const filteredFlavors = useMemo(() => {
    const normalizedQuery = flavorQuery.trim().toLowerCase();
    return pizzaFlavors.filter((flavor) => {
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

  const resetQuickFlavorForm = () => {
    setEditingFlavorId(null);
    setQuickFlavorDraft(EMPTY_QUICK_FLAVOR_DRAFT);
    setQuickFlavorImageFile(null);
    setQuickFlavorImagePreview('');
    setQuickFlavorImageUploadError(null);
  };

  const handleQuickFlavorImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setQuickFlavorImagePreview(URL.createObjectURL(file));
    setQuickFlavorImageUploadError(null);
    setQuickFlavorImageFile(file);
    event.target.value = '';
  };

  const toDraftFromFlavor = (flavor: PizzaFlavor): QuickFlavorDraft => ({
    name: flavor.name || '',
    description: flavor.description || '',
    flavorType: flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado',
    category: flavor.category === 'Especial' || flavor.category === 'Doce' ? flavor.category : 'Tradicional',
    imageUrl: flavor.imageUrl || '',
    active: flavor.active !== false,
    ingredients: (flavor.ingredients || []).length ? flavor.ingredients.map((ingredient) => ingredient.name) : ['']
  });

  const handleEditFlavor = (flavor: PizzaFlavor) => {
    setEditingFlavorId(flavor.id);
    setQuickFlavorDraft(toDraftFromFlavor(flavor));
    setQuickFlavorImageFile(null);
    setQuickFlavorImagePreview(flavor.imageUrl || '');
    setQuickFlavorError(null);
    setQuickFlavorMessage(null);
    setIsQuickCreateOpen(true);
  };

  const handleToggleFlavorStatus = async (flavor: PizzaFlavor) => {
    await dbPizzaFlavors.toggleFlavorStatus(flavor.id, flavor.active === false);
    await loadFlavors();
  };

  const handleSaveQuickFlavor = async () => {
    const normalizedName = quickFlavorDraft.name.trim();
    if (!normalizedName) {
      setQuickFlavorError('Não é possível salvar sem o nome do sabor.');
      return;
    }

    if (pizzaFlavors.some((flavor) => flavor.id !== editingFlavorId && flavor.name.trim().toLowerCase() === normalizedName.toLowerCase())) {
      setQuickFlavorError('Já existe um sabor global com esse nome.');
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

      const flavorId = editingFlavorId || `pizza-flavor-${Date.now()}`;
      const createdAt = pizzaFlavors.find((flavor) => flavor.id === flavorId)?.createdAt || new Date().toISOString();
      const payload: PizzaFlavor = {
        id: flavorId,
        name: normalizedName,
        description: quickFlavorDraft.description.trim() || null,
        flavorType: quickFlavorDraft.flavorType,
        category: quickFlavorDraft.category,
        imageUrl: resolvedFlavorImageUrl || undefined,
        extraPrice: null,
        active: quickFlavorDraft.active,
        isActive: quickFlavorDraft.active,
        tags: [],
        ingredients: normalizedIngredients,
        createdAt,
        updatedAt: new Date().toISOString(),
        priceDeltaBySize: pizzaFlavors.find((flavor) => flavor.id === flavorId)?.priceDeltaBySize || null
      };

      if (editingFlavorId) {
        await dbPizzaFlavors.updateFlavor(payload);
      } else {
        await dbPizzaFlavors.createFlavor(payload);
      }

      const updatedFlavors = await dbPizzaFlavors.getAll();
      setPizzaFlavors(updatedFlavors);
      setSelectedFlavorIds((prev) => (prev.includes(flavorId) ? prev : [...prev, flavorId]));
      resetQuickFlavorForm();
      setQuickFlavorMessage(editingFlavorId ? 'Sabor atualizado com sucesso.' : 'Sabor criado com sucesso e vinculado à pizza.');
      setIsQuickCreateOpen(false);
    } catch (error) {
      setQuickFlavorError(error instanceof Error ? error.message : 'Não foi possível salvar o sabor agora.');
    } finally {
      setIsSavingQuickFlavor(false);
    }
  };

  const handleSaveSize = async () => {
    const normalizedName = sizeDraft.typeName.trim();
    if (!normalizedName) return;

    const sizeId = editingSizeId || `pizza-size-${slugify(normalizedName) || Date.now()}`;
    const payload: PizzaTypeConfig = {
      id: sizeId,
      typeName: normalizedName,
      basePrice: 0,
      slices: Math.max(1, Number(sizeDraft.slices || 1)),
      maxFlavors: Math.max(1, Math.min(4, Number(sizeDraft.maxFlavors || 1))),
      isActive: sizeDraft.isActive,
      updatedAt: new Date().toISOString()
    };

    await dbPizzaTypes.updatePizzaType(payload);
    const updated = await dbPizzaTypes.listPizzaTypes();
    setPizzaTypes(updated);
    setEditingSizeId(null);
    setSizeDraft({ typeName: '', slices: '8', maxFlavors: '2', isActive: true });
  };

  const handleEditSize = (size: PizzaTypeConfig) => {
    setEditingSizeId(size.id);
    setSizeDraft({
      typeName: size.typeName,
      slices: String(size.slices),
      maxFlavors: String(size.maxFlavors),
      isActive: size.isActive !== false
    });
  };

  const handleRemoveSize = async (sizeId: string) => {
    await dbPizzaTypes.togglePizzaTypeStatus(sizeId, false);
    const updated = await dbPizzaTypes.listPizzaTypes();
    setPizzaTypes(updated);
  };

  const updatePriceCell = (flavorId: string, sizeId: string, value: string) => {
    setFlavorPrices((prev) => ({
      ...prev,
      [flavorId]: {
        ...(prev[flavorId] || {}),
        [sizeId]: value.replace(/[^\d.,]/g, '')
      }
    }));
  };


  const handleSaveBorder = () => {
    const normalizedName = borderDraft.name.trim();
    if (!normalizedName) return;

    const borderId = editingBorderId || `pizza-border-${slugify(normalizedName) || Date.now()}`;
    const payload: BorderOption = {
      id: borderId,
      name: normalizedName,
      borderType: borderDraft.borderType,
      extraPrice: Math.max(0, parseCurrencyInput(borderDraft.extraPrice)),
      active: borderDraft.active
    };

    setBorders((prev) => {
      const idx = prev.findIndex((item) => item.id === borderId);
      if (idx >= 0) return prev.map((item) => item.id === borderId ? payload : item);
      return [...prev, payload];
    });

    setEditingBorderId(null);
    setBorderDraft(EMPTY_BORDER_DRAFT);
  };

  const handleEditBorder = (border: BorderOption) => {
    setEditingBorderId(border.id);
    setBorderDraft({
      name: border.name,
      borderType: border.borderType,
      extraPrice: String(border.extraPrice || 0),
      active: border.active
    });
  };

  const handleRemoveBorder = (borderId: string) => {
    setBorders((prev) => prev.map((border) => border.id === borderId ? { ...border, active: false } : border));
  };


  const updateBorderPriceCell = (borderId: string, sizeId: string, value: string) => {
    setBorderPrices((prev) => ({
      ...prev,
      [borderId]: {
        ...(prev[borderId] || {}),
        [sizeId]: value.replace(/[^\d.,]/g, '')
      }
    }));
  };

  const canSavePizza = activeSizes.length > 0 && selectedFlavorIds.length > 0;

  const handleSavePizza = async () => {
    if (!canSavePizza) return;
    setIsSaving(true);
    try {
      await Promise.all(pizzaTypes.map(async (size) => {
        await dbPizzaTypes.updatePizzaType({ ...size, basePrice: 0, updatedAt: new Date().toISOString() });
      }));

      const selectedFlavors = pizzaFlavors.filter((flavor) => selectedFlavorIds.includes(flavor.id));
      await Promise.all(selectedFlavors.map(async (flavor) => {
        const sizePrices = activeSizes.reduce<Record<string, number>>((acc, size) => {
          const rawValue = flavorPrices[flavor.id]?.[size.id] || '';
          if (!rawValue.trim()) return acc;
          acc[size.id] = parseCurrencyInput(rawValue);
          return acc;
        }, {});

        await dbPizzaFlavors.updateFlavor({
          ...flavor,
          priceDeltaBySize: sizePrices,
          updatedAt: new Date().toISOString()
        });
      }));

      const allPrices = selectedFlavors.flatMap((flavor) => activeSizes.map((size) => {
        const rawValue = flavorPrices[flavor.id]?.[size.id] || '';
        return rawValue.trim() ? parseCurrencyInput(rawValue) : null;
      }).filter((value): value is number => typeof value === 'number'));

      const payload: MenuItem = removeUndefinedDeep({
        id: pizzaBase?.id || `pizza-${Date.now()}`,
        type: 'pizza',
        name: pizzaBase?.name || 'Pizzas',
        pizzaType: activeSizes[0]?.typeName,
        category: PIZZA_CATEGORY,
        price: allPrices.length ? Math.min(...allPrices) : 0,
          imageUrl: FIXED_PIZZA_IMAGE,
        rating: 5,
        preparationTime: '30 min',
        size: 'M',
        tags: ['pizza'],
        ingredients: [],
        extras: borders.filter((border) => border.active).map((border) => {
          const prices = activeSizes.map((size) => {
            const raw = borderPrices[border.id]?.[size.id] || '';
            return raw.trim() ? parseCurrencyInput(raw) : null;
          }).filter((value): value is number => typeof value === 'number');
          return { type: 'pizza' as const, name: border.name, price: prices.length ? Math.min(...prices) : border.extraPrice };
        }),
        pricingStrategy: 'fixedBySize' as PizzaPricingStrategy,
        allowedFlavorIds: selectedFlavorIds,
        sizes: activeSizes.map((size) => ({
          id: size.id,
          label: size.typeName,
          basePrice: 0,
          maxFlavors: size.maxFlavors,
          slices: size.slices
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
        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-4">
          <div>
            <h3 className="text-sm font-black">Tamanhos</h3>
            <p className="text-xs text-stone-500 mt-1">Cadastre somente os tamanhos que a pizzaria vende e defina as regras de fatias e máximo de sabores.</p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800/50 p-3">
            <img src={FIXED_PIZZA_IMAGE} alt="Pizza padrão" className="w-20 h-20 rounded-xl object-cover border border-stone-200" />
            <div>
              <p className="text-xs font-black text-stone-600">Imagem padrão fixa</p>
              <p className="text-[11px] text-stone-500">Nesta etapa não existe upload de imagem. A capa da pizza usa uma imagem padrão.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            <input value={sizeDraft.typeName} onChange={(e) => setSizeDraft((prev) => ({ ...prev, typeName: e.target.value }))} placeholder="Nome do tamanho (ex: Broto)" className="sm:col-span-2 w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
            <input value={sizeDraft.slices} inputMode="numeric" onChange={(e) => setSizeDraft((prev) => ({ ...prev, slices: sanitizeIntegerInput(e.target.value) }))} placeholder="Fatias" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
            <input value={sizeDraft.maxFlavors} inputMode="numeric" onChange={(e) => setSizeDraft((prev) => ({ ...prev, maxFlavors: sanitizeIntegerInput(e.target.value) }))} placeholder="Máx. sabores" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
          </div>
          <div className="flex items-center gap-2">
            <label className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 inline-flex items-center justify-between gap-3 text-sm text-stone-600 dark:text-stone-300">
              Ativo
              <input type="checkbox" checked={sizeDraft.isActive} onChange={(e) => setSizeDraft((prev) => ({ ...prev, isActive: e.target.checked }))} />
            </label>
            <button type="button" onClick={handleSaveSize} className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase">{editingSizeId ? 'Atualizar tamanho' : 'Adicionar tamanho'}</button>
            {editingSizeId && <button type="button" onClick={() => { setEditingSizeId(null); setSizeDraft({ typeName: '', slices: '8', maxFlavors: '2', isActive: true }); }} className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-black uppercase text-stone-500">Cancelar</button>}
          </div>

          <div className="space-y-2">
            {pizzaTypes.length === 0 ? (
              <p className="text-xs text-stone-500">Nenhum tamanho cadastrado ainda.</p>
            ) : pizzaTypes.map((size) => (
              <div key={size.id} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{size.typeName} {size.isActive === false && <span className="text-[10px] text-red-500 uppercase">Inativo</span>}</p>
                  <p className="text-[11px] text-stone-500">{size.slices} fatias • até {size.maxFlavors} sabores • sem preço base</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleEditSize(size)} className="p-2 rounded-lg border border-stone-200 dark:border-stone-700"><Pencil size={14} /></button>
                  <button type="button" onClick={() => handleRemoveSize(size.id)} className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black">Sabores</h3>
              <p className="text-xs text-stone-500">Cadastre e selecione os sabores independentemente dos preços por tamanho.</p>
            </div>
            <button onClick={() => { setIsQuickCreateOpen((prev) => !prev); setQuickFlavorError(null); setQuickFlavorMessage(null); }} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-black uppercase text-stone-500 inline-flex items-center gap-1">
              <Plus size={13} /> Novo sabor
            </button>
          </div>

          <div className="grid sm:grid-cols-[1fr_auto] gap-2">
            <label className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700">
              <Search size={14} className="text-stone-400" />
              <input value={flavorQuery} onChange={(e) => setFlavorQuery(e.target.value)} placeholder="Buscar sabor" className="bg-transparent outline-none text-sm w-full" />
            </label>
            <select value={flavorTypeFilter} onChange={(e) => setFlavorTypeFilter(e.target.value as 'Todos' | 'Salgados' | 'Doces')} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm">
              <option value="Todos">Todos</option>
              <option value="Salgados">Salgados</option>
              <option value="Doces">Doces</option>
            </select>
          </div>

          {isQuickCreateOpen && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 dark:bg-stone-900 p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={quickFlavorDraft.name} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nome do sabor" className="w-full bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm" />
                <select value={quickFlavorDraft.flavorType} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, flavorType: e.target.value as 'Salgado' | 'Doce' }))} className="w-full bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm">
                  <option value="Salgado">Salgado</option>
                  <option value="Doce">Doce</option>
                </select>
                <select value={quickFlavorDraft.category} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, category: e.target.value as 'Tradicional' | 'Especial' | 'Doce' }))} className="w-full bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm">
                  <option value="Tradicional">Tradicional</option>
                  <option value="Especial">Especial</option>
                  <option value="Doce">Doce</option>
                </select>
                <label className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 inline-flex items-center justify-between text-sm text-stone-600 dark:text-stone-300">
                  Ativo
                  <input type="checkbox" checked={quickFlavorDraft.active} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, active: e.target.checked }))} />
                </label>
              </div>

              <textarea value={quickFlavorDraft.description} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descrição do sabor" className="w-full bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm" />

              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-500 inline-flex items-center justify-between">
                  <span className="truncate">{quickFlavorImageFile?.name || 'Selecionar imagem do sabor'}</span>
                  <input type="file" accept="image/*" onChange={handleQuickFlavorImageChange} className="hidden" />
                </label>
                {(quickFlavorImagePreview || quickFlavorDraft.imageUrl) && (
                  <img src={quickFlavorImagePreview || quickFlavorDraft.imageUrl} alt="Prévia do sabor" className="w-16 h-16 rounded-xl object-cover border border-stone-200" />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase text-stone-500">Ingredientes</p>
                {quickFlavorDraft.ingredients.map((ingredient, index) => (
                  <div key={`quick-ingredient-${index}`} className="flex items-center gap-2">
                    <input value={ingredient} onChange={(e) => setQuickFlavorDraft((prev) => ({ ...prev, ingredients: prev.ingredients.map((ing, i) => i === index ? e.target.value : ing) }))} placeholder="Ex: Mussarela" className="flex-1 bg-white dark:bg-stone-900 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm" />
                    <button onClick={() => setQuickFlavorDraft((prev) => ({ ...prev, ingredients: prev.ingredients.length <= 1 ? [''] : prev.ingredients.filter((_, i) => i !== index) }))} className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-red-500" title="Remover ingrediente">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setQuickFlavorDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, ''] }))} className="text-xs font-black text-orange-600 hover:text-orange-500">+ Adicionar ingrediente</button>
              </div>

              {isUploadingQuickFlavorImage && <p className="text-xs text-orange-500">Enviando imagem do sabor...</p>}
              {quickFlavorImageUploadError && <p className="text-xs text-red-500">{quickFlavorImageUploadError}</p>}
              {quickFlavorError && <p className="text-xs text-red-500">{quickFlavorError}</p>}
              {quickFlavorMessage && <p className="text-xs text-green-600">{quickFlavorMessage}</p>}

              <div className="flex items-center justify-end gap-2">
                <button onClick={() => { setIsQuickCreateOpen(false); resetQuickFlavorForm(); }} className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-black uppercase text-stone-500">Cancelar</button>
                <button onClick={handleSaveQuickFlavor} disabled={isSavingQuickFlavor || isUploadingQuickFlavorImage} className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase disabled:opacity-50">{isSavingQuickFlavor || isUploadingQuickFlavorImage ? 'Salvando...' : editingFlavorId ? 'Atualizar sabor' : 'Salvar sabor'}</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredFlavors.map((flavor) => {
              const isSelected = selectedFlavorIds.includes(flavor.id);
              const isInactive = flavor.active === false;
              const ingredientPreview = (flavor.ingredients || []).slice(0, 3).map((ingredient) => ingredient.name).join(', ');
              return (
                <div key={flavor.id} className={`rounded-2xl border p-3 text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900'} ${isInactive ? 'opacity-70' : ''}`}>
                  <button onClick={() => toggleFlavorSelection(flavor.id)} disabled={isInactive} className="w-full text-left disabled:cursor-not-allowed">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shrink-0">
                        {flavor.imageUrl ? <img src={flavor.imageUrl} alt={flavor.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] font-black uppercase text-stone-400">Sem foto</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-stone-800 dark:text-stone-100 truncate">{flavor.name}</p>
                        <p className="text-[11px] text-stone-500">{flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado'} • {flavor.category || 'Tradicional'}</p>
                        <p className="text-[11px] text-stone-400 truncate">{ingredientPreview || 'Sem ingredientes cadastrados'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isInactive && <span className="text-[10px] font-black uppercase text-red-500">Inativo</span>}
                        {isSelected && <Check size={14} className="text-orange-500" />}
                      </div>
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => handleEditFlavor(flavor)} className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-[10px] font-black uppercase text-stone-500">Editar</button>
                    <button type="button" onClick={() => handleToggleFlavorStatus(flavor)} className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-[10px] font-black uppercase text-stone-500">{isInactive ? 'Ativar' : 'Desativar'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

<section className="rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-black">Preço dos sabores por tamanho</h3>
            <p className="text-xs text-stone-500">Defina o preço por combinação de sabor + tamanho.</p>
          </div>

          {activeSizes.length === 0 || selectedFlavorIds.length === 0 ? (
            <p className="text-xs text-stone-500">Cadastre ao menos 1 tamanho ativo e selecione sabores para liberar a tabela dinâmica de preços.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 dark:bg-stone-800">
                  <tr>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-stone-500">Sabor</th>
                    {activeSizes.map((size) => (
                      <th key={size.id} className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-stone-500">{size.typeName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pizzaFlavors.filter((flavor) => selectedFlavorIds.includes(flavor.id)).map((flavor) => (
                    <tr key={flavor.id} className="border-t border-stone-200 dark:border-stone-700">
                      <td className="px-3 py-2 font-semibold">{flavor.name}</td>
                      {activeSizes.map((size) => {
                        const rawValue = flavorPrices[flavor.id]?.[size.id] || '';
                        return (
                          <td key={`${flavor.id}-${size.id}`} className="px-3 py-2">
                            <input
                              value={rawValue ? formatCurrencyBRL(parseCurrencyInput(rawValue)) : ''}
                              onChange={(e) => updatePriceCell(flavor.id, size.id, e.target.value)}
                              placeholder="R$ 0,00"
                              className="w-28 bg-white dark:bg-stone-900 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-black">Borda</h3>
            <p className="text-xs text-stone-500">Cadastre as bordas disponíveis, definindo tipo, preço extra e status.</p>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            <input value={borderDraft.name} onChange={(e) => setBorderDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nome da borda" className="sm:col-span-2 w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
            <select value={borderDraft.borderType} onChange={(e) => setBorderDraft((prev) => ({ ...prev, borderType: e.target.value as 'Salgada' | 'Doce' }))} className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700">
              <option value="Salgada">Salgada</option>
              <option value="Doce">Doce</option>
            </select>
            <input value={borderDraft.extraPrice ? formatCurrencyBRL(parseCurrencyInput(borderDraft.extraPrice)) : ''} onChange={(e) => setBorderDraft((prev) => ({ ...prev, extraPrice: e.target.value.replace(/[^\d.,]/g, '') }))} placeholder="Preço extra" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700" />
          </div>

          <div className="flex items-center gap-2">
            <label className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 inline-flex items-center justify-between gap-3 text-sm text-stone-600 dark:text-stone-300">
              Ativo
              <input type="checkbox" checked={borderDraft.active} onChange={(e) => setBorderDraft((prev) => ({ ...prev, active: e.target.checked }))} />
            </label>
            <button type="button" onClick={handleSaveBorder} className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase">{editingBorderId ? 'Atualizar borda' : 'Adicionar borda'}</button>
            {editingBorderId && <button type="button" onClick={() => { setEditingBorderId(null); setBorderDraft(EMPTY_BORDER_DRAFT); }} className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-black uppercase text-stone-500">Cancelar</button>}
          </div>

          <div className="space-y-2">
            {borders.length === 0 ? (
              <p className="text-xs text-stone-500">Nenhuma borda cadastrada ainda.</p>
            ) : borders.map((border) => (
              <div key={border.id} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{border.name} {border.active === false && <span className="text-[10px] text-red-500 uppercase">Inativo</span>}</p>
                  <p className="text-[11px] text-stone-500">{border.borderType} • {formatCurrencyBRL(border.extraPrice || 0)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleEditBorder(border)} className="p-2 rounded-lg border border-stone-200 dark:border-stone-700"><Pencil size={14} /></button>
                  <button type="button" onClick={() => handleRemoveBorder(border.id)} className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-black">Preço das bordas por tamanho</h3>
            <p className="text-xs text-stone-500">Defina o preço extra por combinação de borda + tamanho.</p>
          </div>

          {activeSizes.length === 0 || borders.length === 0 ? (
            <p className="text-xs text-stone-500">Cadastre ao menos 1 tamanho ativo e 1 borda para liberar a tabela dinâmica de preços.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 dark:bg-stone-800">
                  <tr>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-stone-500">Borda</th>
                    {activeSizes.map((size) => (
                      <th key={size.id} className="text-left px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-stone-500">{size.typeName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {borders.map((border) => (
                    <tr key={border.id} className="border-t border-stone-200 dark:border-stone-700">
                      <td className="px-3 py-2 font-semibold">{border.name}</td>
                      {activeSizes.map((size) => {
                        const rawValue = borderPrices[border.id]?.[size.id] || '';
                        return (
                          <td key={`${border.id}-${size.id}`} className="px-3 py-2">
                            <input
                              value={rawValue ? formatCurrencyBRL(parseCurrencyInput(rawValue)) : ''}
                              onChange={(e) => updateBorderPriceCell(border.id, size.id, e.target.value)}
                              placeholder="R$ 0,00"
                              className="w-28 bg-white dark:bg-stone-900 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        
      </div>

      <div className="px-6 lg:px-12 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end bg-white dark:bg-stone-900">
        <button onClick={handleSavePizza} disabled={isSaving || !canSavePizza} className="px-5 py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase disabled:opacity-50 flex items-center gap-2">
          {isSaving ? 'Salvando...' : <>Salvar Pizza <Check size={14} /></>}
        </button>
      </div>
    </div>
  );
};

export default PizzaConfiguratorContent;
