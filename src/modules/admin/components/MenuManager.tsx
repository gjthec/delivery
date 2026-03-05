import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, ExtraItem, Coupon, PizzaFlavor, PizzaSizeOption, Ingredient } from '../types';
import { improveMenuItem } from '../services/aiService'; // Adjusted path
import { dbMenu, dbCatalog, dbCoupons, dbSettings, dbPizzaFlavors, dbIngredientsCatalog } from '../services/dbService'; // Adjusted path
import { 
  Plus, Edit2, Trash2, X, Sparkles, RefreshCw, 
  Image as ImageIcon, Tag, List, PlusCircle, MinusCircle, DollarSign,
  Check, ChevronDown, Settings, Save, Search, LayoutGrid, Filter, ArrowUpDown,
  TicketPercent, AlertTriangle, Bike
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '../mockData';

type SortOption = 'category' | 'price-asc' | 'price-desc' | 'name';

const MenuManager: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES.map(c => c.name));
  
  // New Global State for lists (to allow managing unused items)
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [globalIngredients, setGlobalIngredients] = useState<string[]>([]);

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', maxDiscountValue: '' });

  // Store Settings State
  const [deliveryFee, setDeliveryFee] = useState<string>('');
  const [pizzaFlavors, setPizzaFlavors] = useState<PizzaFlavor[]>([]);
  const [pizzaFlavorDraft, setPizzaFlavorDraft] = useState<PizzaFlavor>({ id: '', name: '', description: '', imageUrl: '', tags: [], ingredients: [], active: true, priceDeltaBySize: null });
  const [pizzaFlavorSearch, setPizzaFlavorSearch] = useState('');
  const [pizzaFlavorIngredientsInput, setPizzaFlavorIngredientsInput] = useState('');
  const [pizzaFlavorTagsInput, setPizzaFlavorTagsInput] = useState('');
  const [ingredientCatalog, setIngredientCatalog] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [wizardStep, setWizardStep] = useState(1);

  // View & Sort States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  // States para painel de gerenciamento global
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingGlobal, setEditingGlobal] = useState<{ type: 'category' | 'tag' | 'ingredient', original: string, current: string } | null>(null);
  const [settingsInput, setSettingsInput] = useState({ category: '', tag: '', ingredient: '' });

  // State para nova categoria (modal de item)
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    costPrice: '',
    originalPrice: '',
    description: '',
    imageUrl: '',
    size: 'M' as 'P' | 'M' | 'G',
    tags: [] as string[],
    ingredients: [] as string[],
    extras: [] as ExtraItem[],
    type: 'regular' as 'regular' | 'pizza',
    pricingStrategy: 'highestFlavor' as 'highestFlavor' | 'averageFlavor' | 'fixedBySize',
    sizes: [] as PizzaSizeOption[]
  });

  const [newTag, setNewTag] = useState('');
  const [newIngredient, setNewIngredient] = useState('');
  const [newExtra, setNewExtra] = useState({ name: '', price: '' });

  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'default' } | null>(null);
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);

  const openAlert = (message: string, title: string = 'Atenção') => {
    setAlertModal({ title, message });
  };

  const openConfirm = (payload: { title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'default' }) => {
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
      setConfirmModal(payload);
    });
  };

  const closeConfirm = (result: boolean) => {
    if (confirmResolver.current) {
      confirmResolver.current(result);
      confirmResolver.current = null;
    }
    setConfirmModal(null);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const menuData = await loadMenu();
      await Promise.all([
        loadCatalogs(menuData),
        loadCoupons(),
        loadSettings(),
        loadPizzaFlavors(),
        loadIngredientCatalog()
      ]);
    };

    loadInitialData();
  }, []);

  // Garante que o form inicie com uma categoria válida
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
        setFormData(p => ({ ...p, category: categories[0] }));
    }
  }, [categories]);

  const uniqueSorted = (values: string[]) => Array.from(
    new Map(values.map(value => [value.trim().toLowerCase(), value.trim()])).values()
  ).filter(Boolean).sort((a, b) => a.localeCompare(b));

  const loadMenu = async (): Promise<MenuItem[]> => {
    const data = await dbMenu.getAll();
    setMenuItems(data);
    return data;
  };

  const loadCatalogs = async (menuData: MenuItem[]) => {
    const [catalogCategories, catalogTags, catalogIngredients] = await Promise.all([
      dbCatalog.getAll('category'),
      dbCatalog.getAll('tag'),
      dbCatalog.getAll('ingredient')
    ]);

    setCategories(uniqueSorted([
      ...INITIAL_CATEGORIES.map(c => c.name),
      ...catalogCategories,
      ...menuData.map(i => i.category)
    ]));

    setGlobalTags(uniqueSorted([
      ...catalogTags,
      ...menuData.flatMap(i => i.tags)
    ]));

    setGlobalIngredients(uniqueSorted([
      ...catalogIngredients,
      ...menuData.flatMap(i => i.ingredients)
    ]));
  };

  const loadCoupons = async () => {
    const data = await dbCoupons.getAll();
    setCoupons(data);
  };


  const loadPizzaFlavors = async () => {
    const data = await dbPizzaFlavors.getAll();
    setPizzaFlavors(data);
  };

  const loadIngredientCatalog = async () => {
    const data = await dbIngredientsCatalog.getAll();
    setIngredientCatalog(data);
  };

  const loadSettings = async () => {
    const settings = await dbSettings.get();
    setDeliveryFee(settings.deliveryFee.toString());
  };

  const handleSaveDeliveryFee = async () => {
      const fee = parseFloat(deliveryFee);
      if (isNaN(fee) || fee < 0) {
          openAlert("Informe um valor válido para a taxa de entrega.");
          return;
      }
      await dbSettings.save({ deliveryFee: fee });
      openAlert("Taxa de entrega atualizada com sucesso!", "Sucesso");
  };


  // --- COUPONS LOGIC ---
  const handleAddCoupon = async () => {
    if (!newCoupon.code.trim() || !newCoupon.discount) {
        openAlert("Preencha o código e a porcentagem.");
        return;
    }
    const discount = parseFloat(newCoupon.discount);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
        openAlert("Porcentagem deve ser entre 0 e 100.");
        return;
    }

    const maxDiscountValue = newCoupon.maxDiscountValue.trim() ? parseFloat(newCoupon.maxDiscountValue) : undefined;
    if (maxDiscountValue !== undefined && (isNaN(maxDiscountValue) || maxDiscountValue <= 0)) {
        openAlert("O valor máximo de desconto deve ser maior que 0.");
        return;
    }

    if (coupons.some(c => c.code === newCoupon.code.toUpperCase())) {
        openAlert("Este código de cupom já existe.");
        return;
    }

    const normalizedCode = newCoupon.code.toUpperCase().trim();
    const coupon: Coupon = {
        id: normalizedCode,
        code: normalizedCode,
        discountPercentage: discount,
        maxDiscountValue,
        active: true
    };

    await dbCoupons.save(coupon);
    await loadCoupons();
    setNewCoupon({ code: '', discount: '', maxDiscountValue: '' });
  };

  const handleDeleteCoupon = async (id: string) => {
      const confirmed = await openConfirm({
        title: 'Remover cupom',
        message: 'Tem certeza que deseja remover este cupom?',
        confirmLabel: 'Remover',
        variant: 'danger'
      });
      if (!confirmed) return;

      await dbCoupons.delete(id);
      await loadCoupons();
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    await dbCoupons.save({ ...coupon, active: !coupon.active });
    await loadCoupons();
  };

  // --- FILTERING & SORTING LOGIC ---
  const getProcessedItems = () => {
    // 1. Filter
    let items = menuItems.filter(item => 
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       item.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategoryFilter === 'Todos' || item.category === selectedCategoryFilter)
    );

    // 2. Sort
    if (sortBy === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Note: 'category' sort is handled by the rendering logic (grouping)
    
    return items;
  };

  const processedItems = getProcessedItems();

  const handleEdit = (item: MenuItem) => {
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      costPrice: item.costPrice?.toString() || '',
      originalPrice: item.originalPrice?.toString() || '',
      description: item.description,
      imageUrl: item.imageUrl,
      size: item.size,
      tags: [...item.tags],
      ingredients: [...item.ingredients],
      extras: [...item.extras],
      type: item.type || 'regular',
      pricingStrategy: item.pricingStrategy || 'highestFlavor',
      sizes: item.sizes || []
    });
    setEditingId(item.id);
    setWizardStep(item.type === 'pizza' ? 1 : 1);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await openConfirm({
      title: 'Excluir prato',
      message: 'Deseja realmente excluir este prato permanentemente?',
      confirmLabel: 'Excluir',
      variant: 'danger'
    });
    if (!confirmed) return;

    await dbMenu.delete(id);
    loadMenu();
  };

  const handleSave = async () => {
    if (!formData.name || (!formData.price && formData.type !== 'pizza')) {
      openAlert("Por favor, preencha nome e preço.");
      return;
    }

    if (formData.type === 'pizza') {
      if (formData.sizes.length === 0) {
        openAlert('Adicione ao menos um tamanho para a pizza.');
        return;
      }

      const invalidSize = formData.sizes.find((size) => size.basePrice < 0 || size.maxFlavors < 1);
      if (invalidSize) {
        openAlert('Revise os tamanhos: preço base deve ser >= 0 e máximo de sabores >= 1.');
        return;
      }
    }

    const payload: MenuItem = {
      id: editingId || `b-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      price: formData.type === 'pizza' ? (formData.sizes[0]?.basePrice || 0) : parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      description: formData.description,
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800',
      rating: 5.0,
      preparationTime: '20 min',
      size: formData.size,
      tags: formData.tags,
      ingredients: formData.ingredients,
      extras: formData.extras,
      type: formData.type,
      pricingStrategy: formData.pricingStrategy,
      sizes: formData.type === 'pizza' ? formData.sizes : []
    };

    await Promise.all([
      dbCatalog.save('category', payload.category),
      ...payload.tags.map(tag => dbCatalog.save('tag', tag)),
      ...payload.ingredients.map(ingredient => dbCatalog.save('ingredient', ingredient))
    ]);

    await dbMenu.save(payload);
    setIsModalOpen(false);
    const menuData = await loadMenu();
    await loadCatalogs(menuData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[0] || 'Burgers',
      price: '',
      costPrice: '',
      originalPrice: '',
      description: '',
      imageUrl: '',
      size: 'M',
      tags: [],
      ingredients: [],
      extras: [],
      type: 'regular',
      pricingStrategy: 'highestFlavor',
      sizes: []
    });
    setEditingId(null);
    setWizardStep(1);
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
        const name = newCategoryName.trim();
        await dbCatalog.save('category', name);
        setCategories(prev => uniqueSorted([...prev, name]));
        setFormData(prev => ({ ...prev, category: name }));
        setNewCategoryName('');
        setIsAddingCategory(false);
    }
  };

  const handleAIOptimize = async () => {
    if (!formData.name) return;
    setIsGeneratingDescription(true);
    try {
      const result = await improveMenuItem({ ...formData, id: editingId || 'temp', price: parseFloat(formData.price || '0'), rating: 5, preparationTime: '20min' } as any);
      setFormData(prev => ({ 
        ...prev, 
        name: result.newName,
        description: result.descriptionLong,
        tags: Array.from(new Set([...prev.tags, ...result.tags]))
      }));
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Helper functions for lists
  const addTag = (value: string = newTag) => { 
    if (value.trim() && !formData.tags.includes(value.trim())) { 
      setFormData(p => ({ ...p, tags: [...p.tags, value.trim()] })); 
      setNewTag(''); 
    } 
  };
  const removeTag = (index: number) => { setFormData(p => ({ ...p, tags: p.tags.filter((_, i) => i !== index) })); };
  
  const addIngredient = (value: string = newIngredient) => { 
    if (value.trim() && !formData.ingredients.includes(value.trim())) { 
      setFormData(p => ({ ...p, ingredients: [...p.ingredients, value.trim()] })); 
      setNewIngredient(''); 
    } 
  };
  const removeIngredient = (index: number) => { setFormData(p => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== index) })); };

  const addExtra = () => { 
    if (newExtra.name.trim() && newExtra.price) { 
      setFormData(p => ({ ...p, extras: [...p.extras, { name: newExtra.name.trim(), price: parseFloat(newExtra.price) }] })); 
      setNewExtra({ name: '', price: '' }); 
    } 
  };
  const removeExtra = (index: number) => { setFormData(p => ({ ...p, extras: p.extras.filter((_, i) => i !== index) })); };

  const addPizzaSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { id: `S${prev.sizes.length + 1}`, label: `Tamanho ${prev.sizes.length + 1}`, basePrice: 0, maxFlavors: 2, slices: null }]
    }));
  };

  const updatePizzaSize = (index: number, field: keyof PizzaSizeOption, value: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => {
        if (i !== index) return size;

        if (field === 'basePrice') return { ...size, basePrice: Math.max(0, Number(value) || 0) };
        if (field === 'maxFlavors') return { ...size, maxFlavors: Math.max(1, Number(value) || 1) };
        if (field === 'slices') return { ...size, slices: value ? Math.max(1, Number(value) || 1) : null };

        return { ...size, [field]: value };
      })
    }));
  };

  const savePizzaFlavor = async () => {
    if (!pizzaFlavorDraft.name.trim()) return;

    const parsedDeltas = (pizzaFlavorDraft.priceDeltaBySize && Object.keys(pizzaFlavorDraft.priceDeltaBySize).length > 0)
      ? pizzaFlavorDraft.priceDeltaBySize
      : null;

    const id = pizzaFlavorDraft.id || `flavor-${Date.now()}`;
    await dbPizzaFlavors.save({
      ...pizzaFlavorDraft,
      id,
      tags: pizzaFlavorDraft.tags || [],
      ingredients: (pizzaFlavorDraft.ingredients || []).filter((ingredient) => ingredient.id && ingredient.name),
      active: pizzaFlavorDraft.active !== false,
      priceDeltaBySize: parsedDeltas
    });

    setPizzaFlavorDraft({ id: '', name: '', description: '', imageUrl: '', tags: [], ingredients: [], active: true, priceDeltaBySize: null });
    setIngredientSearch('');
    setPizzaFlavorIngredientsInput('');
    setPizzaFlavorTagsInput('');
    loadPizzaFlavors();
  };

  const filteredPizzaFlavors = pizzaFlavors.filter((flavor) => {
    const query = pizzaFlavorSearch.trim().toLowerCase();
    if (!query) return true;
    return flavor.name.toLowerCase().includes(query)
      || flavor.tags.some((tag) => tag.toLowerCase().includes(query));
  });


  const createIngredientInline = async (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;

    const existing = ingredientCatalog.find((ingredient) => ingredient.name.toLowerCase() === normalized.toLowerCase());
    if (existing) {
      if (!pizzaFlavorDraft.ingredients.some((ingredient) => ingredient.id === existing.id)) {
        setPizzaFlavorDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, { id: existing.id, name: existing.name }] }));
      }
      return;
    }

    const ingredient: Ingredient = {
      id: `ingredient-${Date.now()}`,
      name: normalized,
      active: true,
      tags: [],
      allergens: null
    };

    await dbIngredientsCatalog.save(ingredient);
    await loadIngredientCatalog();
    setPizzaFlavorDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, { id: ingredient.id, name: ingredient.name }] }));
  };

  const toggleIngredientOnFlavor = (ingredient: Ingredient) => {
    setPizzaFlavorDraft((prev) => {
      const exists = prev.ingredients.some((item) => item.id === ingredient.id);
      return {
        ...prev,
        ingredients: exists
          ? prev.ingredients.filter((item) => item.id !== ingredient.id)
          : [...prev.ingredients, { id: ingredient.id, name: ingredient.name }]
      };
    });
  };

  // --- GERENCIAMENTO GLOBAL ---

  const getUsageCount = (type: 'category' | 'tag' | 'ingredient', value: string) => {
    if (type === 'category') return menuItems.filter(i => i.category === value).length;
    if (type === 'tag') return menuItems.filter(i => i.tags.includes(value)).length;
    return menuItems.filter(i => i.ingredients.includes(value)).length;
  };

  const startEditingGlobal = (type: 'category' | 'tag' | 'ingredient', value: string) => {
    setEditingGlobal({ type, original: value, current: value });
  };

  const handleAddGlobalItem = async (type: 'category' | 'tag' | 'ingredient') => {
     const val = settingsInput[type].trim();
     if(!val) return;
     
     if (type === 'category') {
         if(categories.some(c => c.toLowerCase() === val.toLowerCase())) return openAlert('Categoria já existe');
         await dbCatalog.save(type, val);
         setCategories(p => uniqueSorted([...p, val]));
     } else if (type === 'tag') {
         if(globalTags.some(c => c.toLowerCase() === val.toLowerCase())) return openAlert('Tag já existe');
         await dbCatalog.save(type, val);
         setGlobalTags(p => uniqueSorted([...p, val]));
     } else {
         if(globalIngredients.some(c => c.toLowerCase() === val.toLowerCase())) return openAlert('Ingrediente já existe');
         await dbCatalog.save(type, val);
         setGlobalIngredients(p => uniqueSorted([...p, val]));
     }
     setSettingsInput(p => ({...p, [type]: ''}));
  };

  const saveEditingGlobal = async () => {
    if (!editingGlobal || !editingGlobal.current.trim()) return;
    const { type, original, current } = editingGlobal;
    if (current === original) { setEditingGlobal(null); return; }

    if (type === 'category') {
        if (categories.some(c => c.toLowerCase() === current.toLowerCase())) { openAlert('Categoria já existe!'); return; }
        await dbCatalog.rename(type, original, current);
        const updatedItems = menuItems.map(i => i.category === original ? { ...i, category: current } : i);
        await Promise.all(updatedItems
          .filter(item => item.category === current)
          .map(item => dbMenu.save(item)));

        setCategories(prev => uniqueSorted(prev.map(c => c === original ? current : c)));
        setMenuItems(updatedItems);
    } else if (type === 'tag') {
        if (globalTags.some(t => t.toLowerCase() === current.toLowerCase())) { openAlert('Tag já existe!'); return; }
        await dbCatalog.rename(type, original, current);
        const updatedItems = menuItems.map(i => ({ ...i, tags: i.tags.map(t => t === original ? current : t) }));
        await Promise.all(updatedItems
          .filter(item => item.tags.includes(current))
          .map(item => dbMenu.save(item)));

        setGlobalTags(prev => uniqueSorted(prev.map(t => t === original ? current : t)));
        setMenuItems(updatedItems);
    } else {
        if (globalIngredients.some(i => i.toLowerCase() === current.toLowerCase())) { openAlert('Ingrediente já existe!'); return; }
        await dbCatalog.rename(type, original, current);
        const updatedItems = menuItems.map(i => ({ ...i, ingredients: i.ingredients.map(ing => ing === original ? current : ing) }));
        await Promise.all(updatedItems
          .filter(item => item.ingredients.includes(current))
          .map(item => dbMenu.save(item)));

        setGlobalIngredients(prev => uniqueSorted(prev.map(i => i === original ? current : i)));
        setMenuItems(updatedItems);
    }
    setEditingGlobal(null);
  };

  const deleteGlobal = async (type: 'category' | 'tag' | 'ingredient', value: string) => {
    const count = getUsageCount(type, value);
    const confirmed = await openConfirm({
      title: 'Excluir item global',
      message: `Excluir "${value}"? Isso afetará ${count} itens.`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    });
    if (!confirmed) return;
    await dbCatalog.delete(type, value);

    if (type === 'category') {
        setCategories(prev => prev.filter(c => c !== value));
        if (selectedCategoryFilter === value) {
          setSelectedCategoryFilter('Todos');
        }
    } else if (type === 'tag') {
        const updatedItems = menuItems.map(i => ({ ...i, tags: i.tags.filter(t => t !== value) }));
        await Promise.all(updatedItems
          .filter(item => item.tags.length !== menuItems.find(menuItem => menuItem.id === item.id)?.tags.length)
          .map(item => dbMenu.save(item)));

        setGlobalTags(prev => prev.filter(t => t !== value));
        setMenuItems(updatedItems);
    } else {
        const updatedItems = menuItems.map(i => ({ ...i, ingredients: i.ingredients.filter(ing => ing !== value) }));
        await Promise.all(updatedItems
          .filter(item => item.ingredients.length !== menuItems.find(menuItem => menuItem.id === item.id)?.ingredients.length)
          .map(item => dbMenu.save(item)));

        setGlobalIngredients(prev => prev.filter(i => i !== value));
        setMenuItems(updatedItems);
    }
  };

  const renderGlobalList = (type: 'category' | 'tag' | 'ingredient', list: string[], icon: React.ElementType, title: string, placeholder: string) => (
    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 flex flex-col h-full">
        <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest mb-4 flex items-center gap-2">
            {React.createElement(icon, { size: 14, className: "text-orange-500" })} {title}
        </h3>
        
        {/* ADD FORM */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input 
                value={settingsInput[type]}
                onChange={e => setSettingsInput(p => ({...p, [type]: e.target.value}))}
                onKeyDown={e => e.key === 'Enter' && handleAddGlobalItem(type)}
                placeholder={placeholder}
                className="flex-1 bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold dark:text-white outline-none focus:border-orange-500 transition-all shadow-sm min-w-0"
            />
            <button 
                onClick={() => handleAddGlobalItem(type)}
                className="bg-stone-900 dark:bg-stone-700 text-white p-3 rounded-xl hover:bg-orange-500 transition-colors shadow-lg shadow-stone-900/10 shrink-0"
                title="Adicionar"
            >
                <Plus size={18} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 max-h-[400px]">
            {list.map(item => (
                <div key={item} className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 group hover:border-orange-200 dark:hover:border-stone-700 transition-colors">
                    {editingGlobal?.original === item && editingGlobal.type === type ? (
                        <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
                            <input 
                                autoFocus
                                value={editingGlobal.current}
                                onChange={e => setEditingGlobal({ ...editingGlobal, current: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && saveEditingGlobal()}
                                className="flex-1 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 rounded-lg text-sm font-bold dark:text-white outline-none border border-orange-500"
                            />
                            <button onClick={saveEditingGlobal} className="p-2 bg-green-500 text-white rounded-lg hover:scale-105"><Check size={14}/></button>
                            <button onClick={() => setEditingGlobal(null)} className="p-2 bg-red-500 text-white rounded-lg hover:scale-105"><X size={14}/></button>
                        </div>
                    ) : (
                        <>
      
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Ingredientes (chips/autocomplete)</p>
                        <div className="flex flex-wrap gap-2">
                          {pizzaFlavorDraft.ingredients.map((ingredient) => (
                            <button key={ingredient.id} onClick={() => setPizzaFlavorDraft((prev) => ({ ...prev, ingredients: prev.ingredients.filter((item) => item.id !== ingredient.id) }))} className="px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-black uppercase">
                              {ingredient.name} ✕
                            </button>
                          ))}
                        </div>
                        <input value={ingredientSearch} onChange={(e) => setIngredientSearch(e.target.value)} placeholder="Buscar ingrediente ou criar novo" className="w-full bg-stone-50 dark:bg-stone-800 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold" />
                        <div className="max-h-28 overflow-y-auto grid grid-cols-2 gap-2">
                          {ingredientCatalog
                            .filter((ingredient) => ingredient.active)
                            .filter((ingredient) => !ingredientSearch.trim() || ingredient.name.toLowerCase().includes(ingredientSearch.trim().toLowerCase()))
                            .slice(0, 12)
                            .map((ingredient) => (
                              <button key={ingredient.id} onClick={() => toggleIngredientOnFlavor(ingredient)} className={`text-left px-2 py-1 rounded-lg border text-[11px] font-bold ${pizzaFlavorDraft.ingredients.some((item) => item.id === ingredient.id) ? 'border-orange-500 text-orange-600' : 'border-stone-200 text-stone-500'}`}>
                                {ingredient.name}
                              </button>
                            ))}
                        </div>
                        {!!ingredientSearch.trim() && !ingredientCatalog.some((ingredient) => ingredient.name.toLowerCase() === ingredientSearch.trim().toLowerCase()) && (
                          <button onClick={() => createIngredientInline(ingredientSearch)} className="text-[10px] font-black uppercase text-orange-500">Criar ingrediente "{ingredientSearch.trim()}"</button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-stone-700 dark:text-stone-300">{item}</span>
                                {getUsageCount(type, item) > 0 && (
                                  <span className="text-[10px] font-black bg-stone-100 dark:bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full" title="Itens utilizando este registro">{getUsageCount(type, item)}</span>
                                )}
                            </div>
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditingGlobal(type, item)} className="p-2 text-stone-400 hover:text-orange-500 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors"><Edit2 size={14}/></button>
                                <button onClick={() => deleteGlobal(type, item)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors"><Trash2 size={14}/></button>
                            </div>
                        </>
                    )}
                </div>
            ))}
            {list.length === 0 && <div className="text-center text-stone-400 text-xs py-10 italic">Nenhum registro encontrado.</div>}
        </div>
    </div>
  );

  const renderItemsContainer = (items: MenuItem[]) => {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 p-5 group shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                <div className="relative h-44 rounded-[1.5rem] overflow-hidden mb-5">
                <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                <div className="absolute top-3 left-3 flex gap-1">
                    {item.tags.slice(0, 2).map(t => (
                    <span key={t} className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-black uppercase text-orange-600">{t}</span>
                    ))}
                </div>
                <div className="absolute bottom-3 right-3">
                    <span className="bg-stone-900 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase">{item.size}</span>
                </div>
                </div>
                <div className="space-y-1 mb-4">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{item.category}</span>
                <h3 className="font-black text-stone-800 dark:text-stone-100 uppercase text-xs truncate leading-tight">{item.name}</h3>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-stone-50 dark:border-stone-800">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-stone-900 dark:text-white">R$ {item.price.toFixed(2)}</span>
                    {item.originalPrice && (
                    <span className="text-[10px] text-stone-400 line-through">R$ {item.originalPrice.toFixed(2)}</span>
                    )}
                </div>
                <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
                </div>
            </div>
            ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
          {items.map(item => (
              <div key={item.id} className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-4 w-full min-w-0 flex flex-col xl:flex-row items-start xl:items-center gap-4 md:gap-6 hover:shadow-lg transition-all group">
                  <div className="w-full sm:w-24 xl:w-20 h-32 sm:h-24 xl:h-20 shrink-0 rounded-2xl overflow-hidden relative">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                        <div className="absolute bottom-0 right-0 bg-stone-900/80 text-white text-[8px] px-1.5 py-0.5 rounded-tl-lg font-bold">{item.size}</div>
                  </div>
                  
                  <div className="w-full min-w-0 xl:flex-1 xl:w-auto">
                      <div className="flex flex-wrap items-center gap-2 mb-1 min-w-0">
                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest border border-orange-100 dark:border-orange-900/30 px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-900/10 max-w-full truncate">{item.category}</span>
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                  {item.tags.slice(0, 3).map(t => <span key={t} className="text-[9px] text-stone-400 font-bold bg-stone-50 dark:bg-stone-800 px-1.5 rounded-md max-w-[90px] truncate">{t}</span>)}
                              </div>
                            )}
                      </div>
                      <h3 className="font-black text-stone-800 dark:text-stone-100 uppercase text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-stone-400 hidden md:block line-clamp-2 break-words">{item.description}</p>
                      {/* Mobile Description */}
                       <p className="text-xs text-stone-400 line-clamp-2 md:hidden mt-1">{item.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between w-full xl:w-auto xl:flex-nowrap xl:flex-col xl:items-end gap-2 xl:gap-1 xl:px-4 xl:border-l xl:border-r border-stone-100 dark:border-stone-800">
                      <div className="flex flex-col items-start xl:items-end">
                          <span className="text-sm font-black text-stone-900 dark:text-white">R$ {item.price.toFixed(2)}</span>
                          {item.originalPrice && (
                              <span className="text-[10px] text-stone-400 line-through">R$ {item.originalPrice.toFixed(2)}</span>
                          )}
                      </div>
                      {/* Mobile Actions in the bottom row */}
                      <div className="flex gap-2 xl:hidden">
                        <button onClick={() => handleEdit(item)} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                  </div>

                  <div className="hidden xl:flex gap-2 pl-2 shrink-0">
                      <button onClick={() => handleEdit(item)} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
              </div>
          ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 uppercase tracking-tight">Gestão de Cardápio</h1>
          <p className="text-sm text-stone-500 font-medium">Cadastre, edite e otimize seus produtos com inteligência.</p>
        </div>
        <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3 w-full xl:w-auto">
          {/* SORT DROPDOWN */}
           <div className="relative group w-full md:w-auto">
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="w-full md:w-auto appearance-none bg-white dark:bg-stone-900 pl-10 pr-8 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 text-sm font-bold text-stone-600 dark:text-stone-300 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-sm min-w-[180px]"
              >
                 <option value="category">Agrupar por Categoria</option>
                 <option value="price-asc">Preço: Menor - Maior</option>
                 <option value="price-desc">Preço: Maior - Menor</option>
                 <option value="name">Nome: A-Z</option>
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
           </div>

          {/* View Toggle */}
          <div className="flex bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm self-start md:self-auto">
             <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-stone-100 dark:bg-stone-800 text-orange-500 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                title="Visualização em Grade"
             >
                <LayoutGrid size={18} />
             </button>
             <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-stone-100 dark:bg-stone-800 text-orange-500 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                title="Visualização em Lista"
             >
                <List size={18} />
             </button>
          </div>

          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all w-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          </div>

          <div className="flex gap-2 w-full xl:w-auto mt-2 xl:mt-0 flex-wrap sm:flex-nowrap">
             <button 
                onClick={() => setIsCouponsOpen(true)}
                className="flex-1 xl:flex-initial flex items-center justify-center gap-2 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-800 px-5 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-stone-50 dark:hover:bg-stone-800 transition-all hover:text-orange-500 shadow-sm whitespace-nowrap"
                title="Gerenciar Cupons de Desconto"
             >
                <TicketPercent size={18} /> <span className="hidden sm:inline">Cupons</span>
             </button>
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex-1 xl:flex-initial flex items-center justify-center gap-2 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-800 px-5 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-stone-50 dark:hover:bg-stone-800 transition-all hover:text-orange-500 shadow-sm whitespace-nowrap"
                title="Gerenciar Categorias, Tags e Ingredientes"
             >
                <Settings size={18} /> <span className="hidden sm:inline">Global</span>
             </button>
             <button 
               onClick={() => { resetForm(); setIsModalOpen(true); }} 
               className="flex-1 xl:flex-initial flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
             >
               <Plus size={18} /> <span className="inline">Novo</span>
             </button>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER CHIPS */}
      <div className="flex md:flex-wrap overflow-x-auto md:overflow-visible custom-scrollbar pb-2 gap-2 -mx-2 px-2">
         {['Todos', ...categories].map(cat => (
             <button
               key={cat}
               onClick={() => setSelectedCategoryFilter(cat)}
               className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all border shrink-0 ${
                   selectedCategoryFilter === cat 
                   ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                   : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-orange-200 dark:hover:border-stone-700'
               }`}
             >
                 {cat}
             </button>
         ))}
      </div>

      {/* CONTENT AREA */}
      {processedItems.length === 0 ? (
          <div className="text-center py-20">
              <p className="text-stone-400 font-medium">Nenhum item encontrado.</p>
          </div>
      ) : sortBy === 'category' ? (
        /* GROUPED VIEW */
        <div className="space-y-12">
           {categories
               .filter(cat => selectedCategoryFilter === 'Todos' || cat === selectedCategoryFilter)
               .map(cat => {
                   const itemsInCategory = processedItems.filter(i => i.category === cat);
                   if (itemsInCategory.length === 0) return null;
                   
                   return (
                       <div key={cat} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="flex items-center gap-4">
                               <h2 className="text-xl font-black uppercase tracking-tight text-stone-800 dark:text-stone-200 pl-2 border-l-4 border-orange-500">
                                   {cat}
                               </h2>
                               <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800"></div>
                               <span className="text-xs font-bold text-stone-400">{itemsInCategory.length} itens</span>
                           </div>
                           {renderItemsContainer(itemsInCategory)}
                       </div>
                   );
               })
           }
           {/* Catch-all for items with undefined/unknown categories if any (safety check) */}
           {processedItems.some(i => !categories.includes(i.category)) && (
               <div className="space-y-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-stone-400 pl-2 border-l-4 border-stone-300">Outros</h2>
                  {renderItemsContainer(processedItems.filter(i => !categories.includes(i.category)))}
               </div>
           )}
        </div>
      ) : (
        /* FLAT SORTED VIEW */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderItemsContainer(processedItems)}
        </div>
      )}

      {/* MODAL PRINCIPAL (NOVO/EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-2 sm:p-4">
           {/* Modal Container: Agora flex flex-col com overflow hidden para que o header e footer fiquem fixos */}
           <div className="bg-white dark:bg-stone-900 rounded-[2rem] lg:rounded-[3rem] w-full max-w-5xl max-h-[90vh] flex flex-col border border-stone-200 dark:border-stone-800 relative shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              
              {/* Header: Fixo no topo */}
              <div className="flex justify-between items-center p-6 lg:px-12 lg:pt-12 lg:pb-6 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 z-10">
                <div>
                  <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-stone-800 dark:text-white">Ficha Técnica do Prato</h2>
                  <p className="text-sm text-stone-400 font-medium">{editingId ? 'Editando prato existente' : 'Criando novo prato para o cardápio'}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 lg:p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-red-500 transition-all"><X size={20} className="lg:w-6 lg:h-6"/></button>
              </div>

              {/* Scrollable Content: Apenas o formulário rola */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:px-12 space-y-10">
                {formData.type === 'pizza' && (
                  <div className="rounded-3xl border border-orange-100 dark:border-orange-900/30 p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Configurador de Pizza</p>
                    <div className="flex gap-2 flex-wrap">
                      {[{ id: 1, label: '1. Tamanhos' }, { id: 2, label: '2. Preço' }, { id: 3, label: '3. Sabores' }].map((step) => (
                        <button key={step.id} onClick={() => setWizardStep(step.id)} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border ${wizardStep === step.id ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500'}`}>{step.label}</button>
                      ))}
                    </div>
                    <div className="text-[11px] text-stone-500 font-bold">
                      {wizardStep === 1 && 'Defina tamanhos, preço base e máximo de sabores por tamanho. Preview ao vivo abaixo.'}
                      {wizardStep === 2 && 'Escolha estratégia de preço da pizza (default: highestFlavor).'}
                      {wizardStep === 3 && 'Cadastre sabores, ingredientes e deltas por tamanho no bloco de sabores.'}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Coluna 1: Básico e Descrição */}
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                        <List size={14} className="text-orange-500" /> Informações Básicas
                      </h3>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Nome do Prato</label>
                        <input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold outline-none focus:border-orange-500 dark:text-white" placeholder="Ex: Burger Supremo" />
                      </div>

                      <div className="space-y-2"> 
                        <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Tipo do Item</label>
                        <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value as 'regular' | 'pizza' }))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold outline-none focus:border-orange-500 dark:text-white">
                          <option value="regular">Produto comum</option>
                          <option value="pizza">Pizza configurável</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`space-y-2 ${isAddingCategory ? 'sm:col-span-2' : ''}`}>
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Categoria</label>
                          {isAddingCategory ? (
                              <div className="flex gap-2 h-[58px] animate-in fade-in slide-in-from-left-2 duration-200">
                                  <input 
                                      autoFocus
                                      value={newCategoryName}
                                      onChange={(e) => setNewCategoryName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCategory();
                                        if (e.key === 'Escape') setIsAddingCategory(false);
                                      }}
                                      className="flex-1 h-full bg-stone-50 dark:bg-stone-800 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold outline-none focus:border-orange-500 text-stone-800 dark:text-white placeholder:text-stone-400 min-w-0"
                                      placeholder="Nova Categoria..."
                                  />
                                  <button 
                                    onClick={handleAddCategory} 
                                    className="h-full aspect-square bg-green-500 text-white rounded-2xl flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 shrink-0"
                                    title="Confirmar"
                                  >
                                    <Check size={20}/>
                                  </button>
                                  <button 
                                    onClick={() => setIsAddingCategory(false)} 
                                    className="h-full aspect-square bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shrink-0"
                                    title="Cancelar"
                                  >
                                    <X size={20}/>
                                  </button>
                              </div>
                          ) : (
                              <div className="flex gap-2 h-[58px]">
                                  <div className="relative flex-1 h-full">
                                    <select 
                                        value={formData.category} 
                                        onChange={e => setFormData(p => ({...p, category: e.target.value}))} 
                                        className="w-full h-full bg-stone-50 dark:bg-stone-800 pl-4 pr-10 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold outline-none focus:border-orange-500 appearance-none text-stone-800 dark:text-white cursor-pointer"
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
                                  </div>
                                  <button 
                                      onClick={() => setIsAddingCategory(true)}
                                      className="aspect-square h-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-stone-700 rounded-2xl transition-all flex items-center justify-center border border-transparent hover:border-orange-200 dark:hover:border-stone-600"
                                      title="Nova Categoria"
                                  >
                                      <Plus size={20} />
                                  </button>
                              </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Tamanho</label>
                          <div className="flex bg-stone-50 dark:bg-stone-800 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700 h-[58px]">
                              {(['P', 'M', 'G'] as const).map(size => (
                                  <button
                                      key={size}
                                      onClick={() => setFormData(p => ({...p, size}))}
                                      className={`flex-1 rounded-xl text-xs font-black transition-all ${formData.size === size ? 'bg-orange-500 text-white shadow-md' : 'text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
                                  >
                                      {size}
                                  </button>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-500 ml-2">URL da Imagem</label>
                        <div className="relative">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                          <input value={formData.imageUrl} onChange={e => setFormData(p => ({...p, imageUrl: e.target.value}))} className="w-full bg-stone-50 dark:bg-stone-800 pl-12 pr-4 py-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold outline-none focus:border-orange-500 dark:text-white" placeholder="https://..." />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                        <DollarSign size={14} className="text-orange-500" /> Engenharia de Preços
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Preço de Venda</label>
                          <input type="number" value={formData.price} onChange={e => setFormData(p => ({...p, price: e.target.value}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-black text-orange-600" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Custo Unitário</label>
                          <input type="number" value={formData.costPrice} onChange={e => setFormData(p => ({...p, costPrice: e.target.value}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Preço Original</label>
                          <input type="number" value={formData.originalPrice} onChange={e => setFormData(p => ({...p, originalPrice: e.target.value}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white" />
                        </div>
                      </div>
                    </div>

                    {formData.type === 'pizza' && (wizardStep === 1 || wizardStep === 2) && (
                      <div className="space-y-4 border border-orange-100 dark:border-orange-900/30 rounded-3xl p-4">
                        <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">Configuração de Pizza</h3>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Estratégia de preço</label>
                          <select value={formData.pricingStrategy} onChange={e => setFormData(p => ({ ...p, pricingStrategy: e.target.value as 'highestFlavor' | 'averageFlavor' | 'fixedBySize' }))} className="w-full bg-stone-50 dark:bg-stone-800 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold">
                            <option value="highestFlavor">highestFlavor (padrão)</option>
                            <option value="averageFlavor">averageFlavor</option>
                            <option value="fixedBySize">fixedBySize</option>
                          </select>
                        </div>
                        <button type="button" onClick={addPizzaSize} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase">Adicionar tamanho</button>
                        <div className="space-y-2">
                          {formData.sizes.map((pizzaSize, index) => (
                            <div key={`${pizzaSize.id}-${index}`} className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                              <input value={pizzaSize.id} onChange={(e) => updatePizzaSize(index, 'id', e.target.value)} placeholder="ID" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold" />
                              <input value={pizzaSize.label} onChange={(e) => updatePizzaSize(index, 'label', e.target.value)} placeholder="Nome" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold" />
                              <input type="number" min={0} value={pizzaSize.basePrice} onChange={(e) => updatePizzaSize(index, 'basePrice', e.target.value)} placeholder="Preço base" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold" />
                              <input type="number" min={1} value={pizzaSize.maxFlavors} onChange={(e) => updatePizzaSize(index, 'maxFlavors', e.target.value)} placeholder="Máx sabores" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold" />
                              <input type="number" min={1} value={pizzaSize.slices ?? ''} onChange={(e) => updatePizzaSize(index, 'slices', e.target.value)} placeholder="Fatias" className="bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-stone-500 ml-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                        Descrição Persuasiva
                        <button onClick={handleAIOptimize} disabled={isGeneratingDescription} className="text-orange-500 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-[9px] font-black bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                          {isGeneratingDescription ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={12}/>} OTIMIZAR COM IA
                        </button>
                      </label>
                      <textarea rows={6} value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="w-full bg-stone-50 dark:bg-stone-800 p-6 rounded-3xl border border-stone-200 dark:border-stone-700 font-medium text-sm leading-relaxed outline-none focus:border-orange-500 dark:text-white" placeholder="Descreva o sabor, a textura e os segredos deste prato..." />
                    </div>
                  </div>

                  {/* Coluna 2: Listas (Ingredientes, Tags, Extras) */}
                  <div className="space-y-8 bg-stone-50/50 dark:bg-stone-800/30 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-stone-100 dark:border-stone-800">
                    {/* Tags */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                        <Tag size={14} className="text-orange-500" /> Selos e Tags
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                           list="global-tags-list"
                           value={newTag} 
                           onChange={e => setNewTag(e.target.value)} 
                           onKeyDown={e => e.key === 'Enter' && addTag()} 
                           className="flex-1 bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold dark:text-white min-w-0" 
                           placeholder="Ex: Mais Vendido" 
                        />
                        <datalist id="global-tags-list">
                            {globalTags.map(t => <option key={t} value={t} />)}
                        </datalist>
                        <button onClick={() => addTag()} className="p-2 bg-orange-500 text-white rounded-xl flex justify-center items-center"><Plus size={18} /></button>
                      </div>

                      {/* Sugestões de Tags Globais */}
                      {globalTags.filter(t => !formData.tags.includes(t)).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                              {globalTags.filter(t => !formData.tags.includes(t)).slice(0, 8).map(t => (
                                  <button 
                                    key={t}
                                    onClick={() => addTag(t)}
                                    className="text-[9px] font-bold uppercase text-stone-400 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded-lg hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center gap-1"
                                  >
                                     <Plus size={8} /> {t}
                                  </button>
                              ))}
                          </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, i) => (
                          <span key={i} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 group dark:text-white">
                            {tag} <X size={12} className="cursor-pointer text-stone-300 hover:text-red-500" onClick={() => removeTag(i)} />
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Ingredientes */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                        <List size={14} className="text-orange-500" /> Composição (Ingredientes)
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                            list="global-ingredients-list"
                            value={newIngredient} 
                            onChange={e => setNewIngredient(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && addIngredient()} 
                            className="flex-1 bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold dark:text-white min-w-0" 
                            placeholder="Ex: Alface Americana" 
                        />
                        <datalist id="global-ingredients-list">
                            {globalIngredients.map(i => <option key={i} value={i} />)}
                        </datalist>
                        <button onClick={() => addIngredient()} className="p-2 bg-orange-500 text-white rounded-xl"><Plus size={18} /></button>
                      </div>

                       {/* Sugestões de Ingredientes Globais */}
                       {globalIngredients.filter(i => !formData.ingredients.includes(i)).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                              {globalIngredients.filter(i => !formData.ingredients.includes(i)).slice(0, 8).map(ing => (
                                  <button 
                                    key={ing}
                                    onClick={() => addIngredient(ing)}
                                    className="text-[9px] font-bold uppercase text-stone-400 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded-lg hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center gap-1"
                                  >
                                     <Plus size={8} /> {ing}
                                  </button>
                              ))}
                          </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {formData.ingredients.map((ing, i) => (
                          <div key={i} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center dark:text-white">
                            {ing} <Trash2 size={12} className="cursor-pointer text-stone-300 hover:text-red-500" onClick={() => removeIngredient(i)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Adicionais */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                        <PlusCircle size={14} className="text-orange-500" /> Opcionais e Adicionais
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input value={newExtra.name} onChange={e => setNewExtra(p => ({...p, name: e.target.value}))} className="flex-[2] min-w-0 bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold dark:text-white" placeholder="Item" />
                        <input type="number" value={newExtra.price} onChange={e => setNewExtra(p => ({...p, price: e.target.value}))} className="flex-1 min-w-0 bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold dark:text-white" placeholder="R$" />
                        <button onClick={addExtra} className="p-2 bg-orange-500 text-white rounded-xl shrink-0 flex justify-center items-center"><Plus size={18} /></button>
                      </div>
                      <div className="space-y-2">
                        {formData.extras.map((extra, i) => (
                          <div key={i} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 px-4 py-2 rounded-xl text-xs font-bold flex justify-between items-center dark:text-white">
                            <span>{extra.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-orange-500">R$ {extra.price.toFixed(2)}</span>
                              <Trash2 size={12} className="cursor-pointer text-stone-300 hover:text-red-500" onClick={() => removeExtra(i)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: Fixo no fundo */}
              <div className="flex flex-col sm:flex-row gap-4 p-6 lg:p-12 lg:pt-6 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 z-10">
                 <button onClick={() => setIsModalOpen(false)} className="w-full sm:flex-1 py-4 sm:py-5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-3xl font-black uppercase tracking-widest text-[10px]">Descartar Alterações</button>
                 <button onClick={handleSave} className="w-full sm:flex-[2] py-4 sm:py-5 bg-orange-500 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                   {editingId ? 'Confirmar Atualização' : 'Salvar Novo Prato no Cardápio'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO GLOBAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-2 sm:p-4">
           <div className="bg-white dark:bg-stone-900 rounded-[2rem] lg:rounded-[3rem] w-full max-w-6xl max-h-[90vh] flex flex-col border border-stone-200 dark:border-stone-800 relative shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
               <div className="flex justify-between items-center p-6 lg:px-12 lg:pt-12 lg:pb-6 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 z-10">
                <div>
                  <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-stone-800 dark:text-white">Gerenciamento Global</h2>
                  <p className="text-xs lg:text-sm text-stone-400 font-medium">Cadastre e gerencie categorias, tags e ingredientes de todo o cardápio.</p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 lg:p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-red-500 transition-all"><X size={20} className="lg:w-6 lg:h-6"/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:px-12">
                  {/* CONFIGURAÇÃO DE TAXA DE ENTREGA */}
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-4 lg:p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-orange-100 dark:border-orange-900/20">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl">
                              <Bike size={24} />
                          </div>
                          <div>
                              <h3 className="font-black text-lg text-stone-800 dark:text-white uppercase tracking-tight">Taxa de Entrega</h3>
                              <p className="text-sm text-stone-500 font-medium">Defina o valor padrão para entregas da loja.</p>
                          </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                          <input 
                              type="number" 
                              value={deliveryFee} 
                              onChange={e => setDeliveryFee(e.target.value)}
                              className="bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-lg font-black text-stone-800 dark:text-white outline-none focus:border-orange-500 w-full md:w-32 text-center"
                              placeholder="0.00"
                          />
                          <button 
                             onClick={handleSaveDeliveryFee}
                             className="bg-orange-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 whitespace-nowrap flex-1 md:flex-initial"
                          >
                             Salvar
                          </button>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 mb-6 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Sabores de Pizza</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={pizzaFlavorDraft.name} onChange={(e) => setPizzaFlavorDraft((prev) => ({ ...prev, name: e.target.value }))} className="bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold" placeholder="Nome do sabor" />
                        <input value={pizzaFlavorDraft.description || ''} onChange={(e) => setPizzaFlavorDraft((prev) => ({ ...prev, description: e.target.value }))} className="bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 font-medium" placeholder="Descrição" />
                        <input value={pizzaFlavorTagsInput} onChange={(e) => setPizzaFlavorTagsInput(e.target.value)} onBlur={() => setPizzaFlavorDraft((prev) => ({ ...prev, tags: pizzaFlavorTagsInput.split(',').map((v) => v.trim()).filter(Boolean) }))} className="bg-stone-50 dark:bg-stone-800 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 font-medium" placeholder="Tags (separadas por vírgula)" />
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setPizzaFlavorDraft((prev) => ({ ...prev, active: !prev.active }))} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${pizzaFlavorDraft.active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>{pizzaFlavorDraft.active ? 'Ativo' : 'Inativo'}</button>
                        <button onClick={savePizzaFlavor} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-black uppercase text-[10px]">Salvar sabor</button>
                        <input value={pizzaFlavorSearch} onChange={(e) => setPizzaFlavorSearch(e.target.value)} placeholder="Buscar sabor/tag" className="ml-auto bg-stone-50 dark:bg-stone-800 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold" />
                      </div>
                      <div className="max-h-52 overflow-y-auto space-y-2">
                        {filteredPizzaFlavors.map((flavor) => (
                          <button key={flavor.id} onClick={() => {
                            setPizzaFlavorDraft(flavor);
                            setPizzaFlavorIngredientsInput((flavor.ingredients || []).map((ingredient) => ingredient.name).join(', '));
                            setPizzaFlavorTagsInput((flavor.tags || []).join(', '));
                          }} className="w-full text-left rounded-2xl border border-stone-200 dark:border-stone-700 p-3 hover:border-orange-300 transition-colors">
                            <p className="text-xs font-black text-stone-700 dark:text-stone-100">{flavor.name} {!flavor.active ? '(inativo)' : ''}</p>
                            <p className="text-[11px] text-stone-500 truncate">Ingredientes: {(flavor.ingredients || []).join(', ') || '—'}</p>
                          </button>
                        ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">
                      {renderGlobalList('category', categories, List, 'Categorias', 'Nova Categoria')}
                      {renderGlobalList('tag', globalTags, Tag, 'Selos e Tags', 'Novo Selo/Tag')}
                      {renderGlobalList('ingredient', globalIngredients, List, 'Ingredientes', 'Novo Ingrediente')}
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL DE CUPONS */}
      {isCouponsOpen && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-2 sm:p-4">
           <div className="bg-white dark:bg-stone-900 rounded-[2rem] lg:rounded-[3rem] w-full max-w-2xl max-h-[80vh] flex flex-col border border-stone-200 dark:border-stone-800 relative shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
               <div className="flex justify-between items-center p-6 lg:p-8 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 z-10">
                <div>
                  <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-stone-800 dark:text-white">Cupons de Desconto</h2>
                  <p className="text-xs lg:text-sm text-stone-400 font-medium">Crie e gerencie códigos promocionais.</p>
                </div>
                <button onClick={() => setIsCouponsOpen(false)} className="p-2 lg:p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-red-500 transition-all"><X size={20} className="lg:w-6 lg:h-6"/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                  {/* Form de Adicionar */}
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-4 lg:p-6 rounded-3xl border border-stone-100 dark:border-stone-800 mb-8">
                      <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest mb-4">Novo Cupom</h3>
                      <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-[2] space-y-1">
                              <label className="text-[10px] font-bold uppercase text-stone-500 ml-2">Código (Ex: WELCOME10)</label>
                              <input 
                                value={newCoupon.code}
                                onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                className="w-full bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white outline-none focus:border-orange-500"
                                placeholder="CÓDIGO"
                              />
                          </div>
                          <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-bold uppercase text-stone-500 ml-2">Desconto (%)</label>
                              <input 
                                type="number"
                                value={newCoupon.discount}
                                onChange={e => setNewCoupon(p => ({ ...p, discount: e.target.value }))}
                                className="w-full bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white outline-none focus:border-orange-500"
                                placeholder="%"
                              />
                          </div>
                          <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-bold uppercase text-stone-500 ml-2">Máx. (R$)</label>
                              <input 
                                type="number"
                                value={newCoupon.maxDiscountValue}
                                onChange={e => setNewCoupon(p => ({ ...p, maxDiscountValue: e.target.value }))}
                                className="w-full bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white outline-none focus:border-orange-500"
                                placeholder="Opcional"
                              />
                          </div>
                          <div className="flex items-end">
                            <button 
                                onClick={handleAddCoupon}
                                className="h-[50px] w-full sm:w-[50px] aspect-square bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center"
                            >
                                <Plus size={24} />
                            </button>
                          </div>
                      </div>
                  </div>

                  {/* Lista de Cupons */}
                  <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest ml-2 mb-2">Cupons ({coupons.filter(c => c.active).length} ativos)</h3>
                      {coupons.map(coupon => (
                          <div key={coupon.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm hover:border-orange-200 dark:hover:border-stone-700 transition-all gap-4">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                  <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-stone-800 flex items-center justify-center text-orange-500">
                                      <TicketPercent size={24} />
                                  </div>
                                  <div>
                                      <h4 className="font-black text-lg text-stone-800 dark:text-white tracking-tight break-all">{coupon.code}</h4>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md w-fit">{coupon.discountPercentage}% OFF</p>
                                        {coupon.maxDiscountValue !== undefined && (
                                          <p className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md w-fit">Até R$ {coupon.maxDiscountValue.toFixed(2)}</p>
                                        )}
                                        <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${coupon.active ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-stone-500 bg-stone-100 dark:bg-stone-800'}`}>
                                          {coupon.active ? 'Ativo' : 'Inativo'}
                                        </p>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => handleToggleCouponActive(coupon)}
                                  className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-black uppercase rounded-xl transition-colors ${coupon.active ? 'text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300' : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'}`}
                                >
                                  {coupon.active ? 'Desativar' : 'Ativar'}
                                </button>
                                <button 
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                  className="p-3 text-stone-400 hover:text-red-500 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                              </div>
                          </div>
                      ))}
                      {coupons.length === 0 && (
                          <div className="text-center py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl">
                              <TicketPercent size={48} className="mx-auto text-stone-300 mb-4" />
                              <p className="text-stone-400 font-medium">Nenhum cupom cadastrado ainda.</p>
                          </div>
                      )}
                  </div>
              </div>
           </div>
        </div>
      )}

      {alertModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-black text-lg text-stone-800 dark:text-white">{alertModal.title}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-300 mt-1">{alertModal.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setAlertModal(null)}
                className="px-5 py-2 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${confirmModal.variant === 'danger' ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-500'}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-black text-lg text-stone-800 dark:text-white">{confirmModal.title}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-300 mt-1">{confirmModal.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => closeConfirm(true)}
                className={`px-5 py-2 rounded-xl text-white font-bold transition-colors ${confirmModal.variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {confirmModal.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
