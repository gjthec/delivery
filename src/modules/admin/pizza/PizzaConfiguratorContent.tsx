import React, { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
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

const PizzaConfiguratorContent: React.FC<Props> = ({ pizzaBase, categories: _categories, onSaved, onDirtyChange }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [sizes, setSizes] = useState<PizzaSizeOption[]>([defaultSize()]);
  const [maxFlavorsAllowed, setMaxFlavorsAllowed] = useState(2);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [flavors, setFlavors] = useState<PizzaFlavor[]>([]);
  const [flavorNameInput, setFlavorNameInput] = useState('');
  const [editingFlavorId, setEditingFlavorId] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState('');

  const loadFlavors = async () => {
    const data = await dbPizzaFlavors.getAll();
    setFlavors(data);
  };

  useEffect(() => {
    const existingSizes = pizzaBase?.sizes?.length ? pizzaBase.sizes : [defaultSize()];
    const initialMaxFlavors = Math.max(1, Math.min(4, existingSizes[0]?.maxFlavors || 2));
    const normalizedSizes = existingSizes.map((size) => ({ ...size, maxFlavors: initialMaxFlavors }));

    const snapshot = {
      name: pizzaBase?.name || 'Pizza da Casa',
      category: PIZZA_CATEGORY,
      description: pizzaBase?.description || '',
      imageUrl: pizzaBase?.imageUrl || '',
      imagePublicId: pizzaBase?.imagePublicId || '',
      sizes: normalizedSizes,
      maxFlavorsAllowed: initialMaxFlavors,
      flavorNameInput: '',
      editingFlavorId: null
    };

    setName(snapshot.name);
    setDescription(snapshot.description);
    setImageUrl(snapshot.imageUrl);
    setImagePublicId(snapshot.imagePublicId);
    setSizes(snapshot.sizes);
    setMaxFlavorsAllowed(snapshot.maxFlavorsAllowed);
    setFlavorNameInput('');
    setEditingFlavorId(null);
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
      maxFlavorsAllowed,
      flavorNameInput,
      editingFlavorId
    });
    onDirtyChange?.(snapshot !== initialSnapshot);
  }, [name, description, imageUrl, imagePublicId, sizes, maxFlavorsAllowed, flavorNameInput, editingFlavorId, initialSnapshot, onDirtyChange]);

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
    setSizes((prev) => [...prev, { ...defaultSize(), maxFlavors: maxFlavorsAllowed }]);
  };

  const updateSize = (index: number, field: 'label' | 'basePrice', value: string) => {
    setSizes((prev) => prev.map((size, i) => {
      if (i !== index) return size;
      if (field === 'basePrice') return { ...size, basePrice: Number(value) || 0, maxFlavors: maxFlavorsAllowed };
      return { ...size, label: value, maxFlavors: maxFlavorsAllowed };
    }));
  };

  const removeSize = (index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMaxFlavorsChange = (value: number) => {
    setMaxFlavorsAllowed(value);
    setSizes((prev) => prev.map((size) => ({ ...size, maxFlavors: value })));
  };

  const saveFlavor = async () => {
    const normalizedName = flavorNameInput.trim();
    if (!normalizedName) return;

    if (editingFlavorId) {
      const current = flavors.find((flavor) => flavor.id === editingFlavorId);
      if (!current) return;

      await dbPizzaFlavors.save(removeUndefinedDeep({
        ...current,
        name: normalizedName,
        active: current.active !== false,
        tags: current.tags || [],
        ingredients: current.ingredients || [],
        priceDeltaBySize: current.priceDeltaBySize || null
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

  const editFlavor = (flavor: PizzaFlavor) => {
    setEditingFlavorId(flavor.id);
    setFlavorNameInput(flavor.name);
  };

  const removeFlavor = async (flavorId: string) => {
    await dbPizzaFlavors.delete(flavorId);
    await loadFlavors();
    if (editingFlavorId === flavorId) {
      setFlavorNameInput('');
      setEditingFlavorId(null);
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
          <h3 className="text-sm font-black">Tamanhos</h3>
          {sizes.map((size, index) => (
            <div key={`${size.id}-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-center">
              <input value={size.label} onChange={(e) => updateSize(index, 'label', e.target.value)} placeholder="Pequena / Média / Grande" className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-200" />
              <input type="number" min={0} value={size.basePrice} onChange={(e) => updateSize(index, 'basePrice', e.target.value)} placeholder="Preço" className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-200" />
              <button onClick={() => removeSize(index)} className="p-3 rounded-xl border border-red-200 text-red-500 flex items-center justify-center" title="Remover tamanho">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={addSize} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase flex items-center gap-2">
            <Plus size={14} /> Adicionar tamanho
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-black">Sabores</h3>
          <select value={maxFlavorsAllowed} onChange={(e) => handleMaxFlavorsChange(Number(e.target.value))} className="w-full sm:w-72 bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-sm font-bold">
            {MAX_FLAVOR_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} {option === 1 ? 'sabor' : 'sabores'} (máximo por pizza)</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input value={flavorNameInput} onChange={(e) => setFlavorNameInput(e.target.value)} placeholder="Ex: Calabresa, Frango com Catupiry, Portuguesa" className="flex-1 bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200" />
            <button onClick={saveFlavor} className="px-4 py-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase">{editingFlavorId ? 'Salvar' : 'Adicionar'}</button>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto">
            {flavors.map((flavor) => (
              <div key={flavor.id} className="p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                <p className="font-black text-xs">{flavor.name}</p>
                <div className="flex gap-2">
                  <button onClick={() => editFlavor(flavor)} className="px-2 py-1 rounded-lg bg-stone-100 text-[10px] font-black uppercase">Editar</button>
                  <button onClick={() => removeFlavor(flavor.id)} className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-black uppercase">Remover</button>
                </div>
              </div>
            ))}
          </div>
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
