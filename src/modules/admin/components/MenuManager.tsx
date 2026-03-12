import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, ExtraItem, Coupon, PizzaFlavor, PizzaSizeOption } from '../types';
import { improveMenuItem } from '../services/aiService'; // Adjusted path
import { dbMenu, dbCatalog, dbCoupons, dbPizzaFlavors, dbSettings } from '../services/dbService'; // Adjusted path
import { 
  Plus, Edit2, Trash2, X, Sparkles, RefreshCw,
  Image as ImageIcon, Tag, List, PlusCircle, MinusCircle, DollarSign,
  Check, ChevronDown, Settings, Save, Search, LayoutGrid, Filter, ArrowUpDown,
  TicketPercent, AlertTriangle, Bike, Pizza
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '../mockData';
import PizzaConfiguratorContent from '../pizza/PizzaConfiguratorContent';
import { uploadImageToCloudinary } from '../services/cloudinaryUpload';

type SortOption = 'category' | 'price-asc' | 'price-desc' | 'name';

type GlobalEntityType = 'category' | 'tag' | 'ingredient' | 'pizzaFlavor';

type FlavorTypeFilter = 'Todos' | 'Salgado' | 'Doce';

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



type PizzaExtraEntry = {
  name: string;
  price: number;
  type?: string;
};


const MenuManager: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES.map(c => c.name));
  
  // New Global State for lists (to allow managing unused items)
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [globalIngredients, setGlobalIngredients] = useState<string[]>([]);
  const [globalPizzaFlavors, setGlobalPizzaFlavors] = useState<PizzaFlavor[]>([]);
  const [pizzaFlavorQuery, setPizzaFlavorQuery] = useState('');
  const [pizzaFlavorTypeFilter, setPizzaFlavorTypeFilter] = useState<FlavorTypeFilter>('Todos');

  // Coupons State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', maxDiscountValue: '' });

  // Store Settings State
  const [deliveryFee, setDeliveryFee] = useState<string>('');

  // View & Sort States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPizzaBase, setEditingPizzaBase] = useState<MenuItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItemType, setNewItemType] = useState<'normal' | 'pizza'>('normal');
  const [dirtyNormal, setDirtyNormal] = useState(false);
  const [dirtyPizza, setDirtyPizza] = useState(false);
  const [normalBaseline, setNormalBaseline] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  // States para painel de gerenciamento global
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingGlobal, setEditingGlobal] = useState<{ type: 'category' | 'tag' | 'ingredient', original: string, current: string } | null>(null);
  const [settingsInput, setSettingsInput] = useState({ category: '', tag: '', ingredient: '' });
  const [flavorDraft, setFlavorDraft] = useState<FlavorDraft>(EMPTY_FLAVOR_DRAFT);

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
    imagePublicId: '',
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'default' } | null>(null);
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToType, setShowScrollToType] = useState(false);
  const [detailsItem, setDetailsItem] = useState<MenuItem | null>(null);
  const [pizzaDetailsData, setPizzaDetailsData] = useState<{ selectedPizza: MenuItem | null }>({ selectedPizza: null });
  const [pizzaDetailsLoading, setPizzaDetailsLoading] = useState(false);
  const [pizzaDetailsError, setPizzaDetailsError] = useState<string | null>(null);
  const [originalCategory, setOriginalCategory] = useState<string | null>(null);
  const [originalItemId, setOriginalItemId] = useState<string | null>(null);

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


  const getNormalSnapshot = (data = formData) => JSON.stringify(data);

  useEffect(() => {
    if (!isModalOpen || newItemType !== 'normal' || !normalBaseline) return;
    setDirtyNormal(getNormalSnapshot() !== normalBaseline);
  }, [formData, isModalOpen, newItemType, normalBaseline]);


  const handleModalScroll = () => {
    const currentTop = modalBodyRef.current?.scrollTop || 0;
    setShowScrollToType(currentTop > 120);
  };

  const scrollToTypeSelector = () => {
    modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const menuData = await loadMenu();
      await Promise.all([
        loadCatalogs(menuData),
        loadPizzaFlavors(),
        loadCoupons(),
        loadSettings(),
      ]);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!detailsItem || detailsItem.type !== 'pizza') {
      setPizzaDetailsLoading(false);
      setPizzaDetailsError(null);
      setPizzaDetailsData({ selectedPizza: null });
      return;
    }

    setPizzaDetailsLoading(true);
    setPizzaDetailsError(null);

    const unsubscribe = dbMenu.subscribePizzaDetails(
      detailsItem.id,
      (payload) => {
        setPizzaDetailsData(payload);
        setPizzaDetailsLoading(false);
      },
      () => {
        setPizzaDetailsError('Não foi possível carregar os dados da pizza em tempo real.');
        setPizzaDetailsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [detailsItem]);

  // Garante que o form inicie com uma categoria válida
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
        setFormData(p => ({ ...p, category: categories[0] }));
    }
  }, [categories]);



  const uniqueSorted = (values: string[]) => Array.from(
    new Map(values.map(value => [value.trim().toLowerCase(), value.trim()])).values()
  ).filter(Boolean).sort((a, b) => a.localeCompare(b));


  const sanitizeDecimalInput = (value: string) => {
    const sanitized = value.replace(/[^\d.,]/g, '');
    const lastComma = sanitized.lastIndexOf(',');
    const lastDot = sanitized.lastIndexOf('.');
    const separatorIndex = Math.max(lastComma, lastDot);
    if (separatorIndex === -1) return sanitized.replace(/\D/g, '');
    const integerPart = sanitized.slice(0, separatorIndex).replace(/\D/g, '');
    const decimalPart = sanitized.slice(separatorIndex + 1).replace(/\D/g, '').slice(0, 2);
    return decimalPart ? `${integerPart || '0'}.${decimalPart}` : (integerPart || '0');
  };

  const sanitizeIntegerInput = (value: string) => value.replace(/\D/g, '');

  const loadMenu = async (): Promise<MenuItem[]> => {
    const data = await dbMenu.getAll();
    setMenuItems(data);
    return data;
  };


  const loadPizzaFlavors = async () => {
    const data = await dbPizzaFlavors.getAll();
    setGlobalPizzaFlavors(data.sort((a, b) => a.name.localeCompare(b.name)));
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

  const formatCurrencyBRL = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

  const isItemActive = (item: MenuItem) => (item as MenuItem & { active?: boolean }).active !== false;

  const getPizzaSizes = (item: MenuItem) => item.sizes || [];

  const getPizzaFlavorIds = (item: MenuItem) => item.allowedFlavorIds || [];

  const getPizzaBorders = (item: MenuItem) => {
    const rawItem = item as MenuItem & {
      borders?: Array<Record<string, any>>;
      borderOptions?: Array<Record<string, any>>;
      crustOptions?: Array<Record<string, any>>;
      allowedBorderIds?: string[];
    };

    const source = rawItem.borders || rawItem.borderOptions || rawItem.crustOptions || [];
    if (source.length > 0) return source;

    return (rawItem.allowedBorderIds || []).map((id) => ({ id, name: id }));
  };

  const getStartingPrice = (item: MenuItem) => {
    const sizes = getPizzaSizes(item);
    if (sizes.length === 0) return item.price;
    return Math.min(...sizes.map((size) => Number(size.basePrice || 0)));
  };

  const selectedPizzaDetails = pizzaDetailsData.selectedPizza || detailsItem;
  const selectedSizes = selectedPizzaDetails?.sizes || [];
  const selectedExtras = ((selectedPizzaDetails as MenuItem & { extras?: PizzaExtraEntry[] } | null)?.extras || []);
  const flavorExtras = selectedExtras.filter((extra) => extra && extra.name && extra.type === 'pizza');
  const borderExtras = selectedExtras.filter((extra) => extra && extra.name && extra.type === 'borda');
  const activeLabel = (selectedPizzaDetails as MenuItem & { active?: boolean } | null)?.active !== false ? 'Ativo' : 'Inativo';

  const resolveExtraPriceBySize = (extra: PizzaExtraEntry & Record<string, any>, size: PizzaSizeOption) => {
    const bySize = extra.priceBySize || extra.valuesBySize || extra.extraPriceBySize;
    if (bySize && typeof bySize === 'object') {
      const candidate = Number(bySize[size.id] ?? bySize[size.label]);
      if (Number.isFinite(candidate)) return candidate;
    }

    const value = Number(extra.price || 0);
    return Number.isFinite(value) ? value : 0;
  };

  const handleEdit = async (item: MenuItem) => {
    const persistedItem = await dbMenu.getById(item.id);
    const sourceItem = persistedItem || item;

    setOriginalCategory(sourceItem.category || null);
    setOriginalItemId(sourceItem.id || null);

    if (sourceItem.type === 'pizza') {
      setEditingPizzaBase(sourceItem);
      setNewItemType('pizza');
      setEditingId(sourceItem.id);
      setIsModalOpen(true);
      return;
    }

    setEditingPizzaBase(null);
    setNewItemType('normal');
    setFormData({
      name: sourceItem.name,
      category: sourceItem.category,
      price: sourceItem.price.toString(),
      costPrice: sourceItem.costPrice?.toString() || '',
      originalPrice: sourceItem.originalPrice?.toString() || '',
      description: sourceItem.description,
      imageUrl: sourceItem.imageUrl,
      imagePublicId: sourceItem.imagePublicId || '',
      size: sourceItem.size,
      tags: [...sourceItem.tags],
      ingredients: [...sourceItem.ingredients],
      extras: [...sourceItem.extras],
      type: sourceItem.type || 'regular',
      pricingStrategy: sourceItem.pricingStrategy || 'highestFlavor',
      sizes: sourceItem.sizes || []
    });
    setEditingId(sourceItem.id);
    setLocalImagePreview(sourceItem.imageUrl || '');
    setImageUploadError(null);
    setNormalBaseline(getNormalSnapshot({
      name: sourceItem.name,
      category: sourceItem.category,
      price: sourceItem.price.toString(),
      costPrice: sourceItem.costPrice?.toString() || '',
      originalPrice: sourceItem.originalPrice?.toString() || '',
      description: sourceItem.description,
      imageUrl: sourceItem.imageUrl,
      imagePublicId: sourceItem.imagePublicId || '',
      size: sourceItem.size,
      tags: [...sourceItem.tags],
      ingredients: [...sourceItem.ingredients],
      extras: [...sourceItem.extras],
      type: sourceItem.type || 'regular',
      pricingStrategy: sourceItem.pricingStrategy || 'highestFlavor',
      sizes: sourceItem.sizes || []
    }));
    setDirtyNormal(false);
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

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalImagePreview(URL.createObjectURL(file));
    setImageUploadError(null);
    setSelectedImageFile(file);
    event.target.value = '';
  };

  const handleSave = async () => {
    if (isUploadingImage) {
      openAlert('Aguarde o upload da imagem terminar para salvar.');
      return;
    }

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

    let imageUrl = formData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800';
    let imagePublicId = formData.imagePublicId || '';

    if (selectedImageFile) {
      setIsUploadingImage(true);
      setImageUploadError(null);
      try {
        const uploaded = await uploadImageToCloudinary(selectedImageFile);
        imageUrl = uploaded.secureUrl;
        imagePublicId = uploaded.publicId;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível enviar a imagem.';
        setImageUploadError(message);
        openAlert(message);
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    if (editingId && originalCategory && formData.category !== originalCategory) {
      console.error('[MenuManager] Tentativa bloqueada de alteração de categoria.', { editingId, originalCategory, submitted: formData.category });
      openAlert('Este campo não pode ser alterado após a criação.');
      return;
    }

    if (editingId && originalItemId && editingId !== originalItemId) {
      console.error('[MenuManager] Tentativa bloqueada de alteração de ID.', { editingId, originalItemId });
      openAlert('Não foi possível salvar: identificador inválido.');
      return;
    }

    const payload: MenuItem = {
      id: editingId || `b-${Date.now()}`,
      name: formData.name,
      category: editingId && originalCategory ? originalCategory : formData.category,
      price: formData.type === 'pizza' ? (formData.sizes[0]?.basePrice || 0) : parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      description: formData.description,
      imageUrl,
      imagePublicId: imagePublicId || undefined,
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
      imagePublicId: '',
      size: 'M',
      tags: [],
      ingredients: [],
      extras: [],
      type: 'regular',
      pricingStrategy: 'highestFlavor',
      sizes: []
    });
    setEditingId(null);
    setNewItemType('normal');
    setEditingPizzaBase(null);
    setDirtyNormal(false);
    setDirtyPizza(false);
    setNormalBaseline('');
    setOriginalCategory(null);
    setOriginalItemId(null);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setImageUploadError(null);
    setLocalImagePreview('');
    setSelectedImageFile(null);
  };

  const resetNormalFlow = () => {
    setFormData({
      name: '',
      category: categories[0] || 'Burgers',
      price: '',
      costPrice: '',
      originalPrice: '',
      description: '',
      imageUrl: '',
      imagePublicId: '',
      size: 'M',
      tags: [],
      ingredients: [],
      extras: [],
      type: 'regular',
      pricingStrategy: 'highestFlavor',
      sizes: []
    });
    setEditingId(null);
    setDirtyNormal(false);
    setNormalBaseline('');
    setImageUploadError(null);
    setLocalImagePreview('');
    setSelectedImageFile(null);
  };

  const resetPizzaFlow = () => {
    setEditingPizzaBase(null);
    setDirtyPizza(false);
  };

  const handleTypeSwitch = async (targetType: 'normal' | 'pizza') => {
    if (targetType === newItemType) return;

    const hasUnsavedChanges = newItemType === 'normal' ? dirtyNormal : dirtyPizza;
    if (hasUnsavedChanges) {
      const confirmed = await openConfirm({
        title: 'Descartar alterações?',
        message: 'Você tem alterações não salvas. Ao trocar o tipo, elas serão perdidas.',
        confirmLabel: 'Trocar tipo'
      });
      if (!confirmed) return;
    }

    if (newItemType === 'normal') resetNormalFlow();
    if (newItemType === 'pizza') resetPizzaFlow();

    setNewItemType(targetType);
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



  // --- GERENCIAMENTO GLOBAL ---

  const getUsageCount = (type: GlobalEntityType, value: string) => {
    if (type === 'category') return menuItems.filter((i) => i.category === value).length;
    if (type === 'tag') return menuItems.filter((i) => i.tags.includes(value)).length;
    if (type === 'ingredient') return menuItems.filter((i) => i.ingredients.includes(value)).length;
    const flavor = globalPizzaFlavors.find((item) => item.name === value);
    if (!flavor) return 0;
    return menuItems.filter((i) => i.type === 'pizza' && (i.allowedFlavorIds || []).includes(flavor.id)).length;
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


  const normalizeExtraPrice = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSavePizzaFlavor = async () => {
    const normalizedName = flavorDraft.name.trim();
    if (!normalizedName) {
      openAlert('Informe o nome do sabor.');
      return;
    }

    const hasDuplicatedName = globalPizzaFlavors.some((flavor) => (
      flavor.id !== flavorDraft.id && flavor.name.toLowerCase() === normalizedName.toLowerCase()
    ));
    if (hasDuplicatedName) {
      openAlert('Já existe um sabor com esse nome.');
      return;
    }

    if (flavorDraft.extraPrice.trim() && normalizeExtraPrice(flavorDraft.extraPrice) === null) {
      openAlert('Preço extra inválido.');
      return;
    }

    await dbPizzaFlavors.save({
      id: flavorDraft.id || `pizza-flavor-${Date.now()}`,
      name: normalizedName,
      flavorType: flavorDraft.flavorType,
      extraPrice: normalizeExtraPrice(flavorDraft.extraPrice),
      active: flavorDraft.active,
      tags: [],
      ingredients: [],
      priceDeltaBySize: null
    });

    setFlavorDraft(EMPTY_FLAVOR_DRAFT);
    await loadPizzaFlavors();
  };

  const handleEditPizzaFlavor = (flavor: PizzaFlavor) => {
    setFlavorDraft({
      id: flavor.id,
      name: flavor.name,
      flavorType: flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado',
      extraPrice: typeof flavor.extraPrice === 'number' ? String(flavor.extraPrice) : '',
      active: flavor.active !== false
    });
  };

  const handleDeletePizzaFlavor = async (flavor: PizzaFlavor) => {
    const confirmed = await openConfirm({
      title: 'Excluir sabor global',
      message: `Tem certeza que deseja excluir "${flavor.name}"?`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    });
    if (!confirmed) return;

    await dbPizzaFlavors.delete(flavor.id);

    const pizzasToUpdate = menuItems.filter((item) => item.type === 'pizza' && (item.allowedFlavorIds || []).includes(flavor.id));
    await Promise.all(pizzasToUpdate.map((item) => dbMenu.save({
      ...item,
      allowedFlavorIds: (item.allowedFlavorIds || []).filter((id) => id !== flavor.id)
    })));

    setMenuItems((prev) => prev.map((item) => item.type === 'pizza'
      ? { ...item, allowedFlavorIds: (item.allowedFlavorIds || []).filter((id) => id !== flavor.id) }
      : item));

    await loadPizzaFlavors();
  };

  const filteredPizzaFlavors = globalPizzaFlavors.filter((flavor) => {
    const matchName = !pizzaFlavorQuery.trim() || flavor.name.toLowerCase().includes(pizzaFlavorQuery.trim().toLowerCase());
    const normalizedType = flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado';
    const matchType = pizzaFlavorTypeFilter === 'Todos' || pizzaFlavorTypeFilter === normalizedType;
    return matchName && matchType;
  });

  const renderPizzaFlavorsGlobalList = () => (
    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-3xl p-6 border border-stone-100 dark:border-stone-800 flex flex-col h-full">
      <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest mb-4 flex items-center gap-2">
        <Pizza size={14} className="text-orange-500" /> Sabores de Pizza
      </h3>

      <div className="space-y-2 mb-4">
        <input
          value={flavorDraft.name}
          onChange={(e) => setFlavorDraft((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Nome do sabor"
          className="w-full bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={flavorDraft.flavorType}
            onChange={(e) => setFlavorDraft((prev) => ({ ...prev, flavorType: e.target.value as 'Salgado' | 'Doce' }))}
            className="bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold"
          >
            <option value="Salgado">Salgado</option>
            <option value="Doce">Doce</option>
          </select>
          <input
            type="text"
            inputMode="decimal"
            value={flavorDraft.extraPrice}
            onChange={(e) => setFlavorDraft((prev) => ({ ...prev, extraPrice: sanitizeDecimalInput(e.target.value) }))}
            placeholder="Preço extra"
            className="bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold"
          />
        </div>
        <label className="text-xs font-bold text-stone-600 flex items-center gap-2">
          <input
            type="checkbox"
            checked={flavorDraft.active}
            onChange={(e) => setFlavorDraft((prev) => ({ ...prev, active: e.target.checked }))}
          />
          Ativo
        </label>
        <div className="flex gap-2">
          <button onClick={handleSavePizzaFlavor} className="bg-stone-900 dark:bg-stone-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex-1">
            {flavorDraft.id ? 'Salvar edição' : 'Novo sabor'}
          </button>
          {flavorDraft.id && (
            <button onClick={() => setFlavorDraft(EMPTY_FLAVOR_DRAFT)} className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-stone-200 text-stone-600">
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <input
          value={pizzaFlavorQuery}
          onChange={(e) => setPizzaFlavorQuery(e.target.value)}
          placeholder="Buscar por nome"
          className="bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm"
        />
        <select
          value={pizzaFlavorTypeFilter}
          onChange={(e) => setPizzaFlavorTypeFilter(e.target.value as FlavorTypeFilter)}
          className="bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm"
        >
          <option value="Todos">Todos os tipos</option>
          <option value="Salgado">Salgado</option>
          <option value="Doce">Doce</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 max-h-[400px]">
        {filteredPizzaFlavors.map((flavor) => (
          <div key={flavor.id} className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
            <div>
              <p className="text-sm font-bold text-stone-700 dark:text-stone-300">{flavor.name}</p>
              <p className="text-[11px] text-stone-500">
                {flavor.flavorType === 'Doce' ? 'Doce' : 'Salgado'} • {typeof flavor.extraPrice === 'number' ? `+R$ ${flavor.extraPrice.toFixed(2)}` : 'Sem adicional'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${flavor.active !== false ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                {flavor.active !== false ? 'Ativo' : 'Inativo'}
              </span>
              <button onClick={() => handleEditPizzaFlavor(flavor)} className="p-2 text-stone-400 hover:text-orange-500 rounded-lg"><Edit2 size={14} /></button>
              <button onClick={() => handleDeletePizzaFlavor(flavor)} className="p-2 text-stone-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {filteredPizzaFlavors.length === 0 && <div className="text-center text-stone-400 text-xs py-10 italic">Nenhum sabor encontrado.</div>}
      </div>
    </div>
  );

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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 justify-items-center">
            {items.map(item => (
            <div key={item.id} onClick={() => item.type === 'pizza' && setDetailsItem(item)} className={`w-[220px] bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] group shadow-sm hover:shadow-lg transition-all relative overflow-hidden flex flex-col ${item.type === 'pizza' ? 'cursor-pointer' : ''}`}>
                <div className="relative h-[130px] overflow-hidden">
                <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                <div className="absolute top-2 left-2">
                    <span className="bg-[#ff6b35] text-white px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide">{item.category}</span>
                </div>
                <div className="absolute bottom-2 right-2">
                    <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-semibold uppercase">{item.type === 'pizza' ? `${getPizzaSizes(item).length} tam.` : item.size}</span>
                </div>
                </div>
                <div className="px-3.5 pt-3 pb-2 flex-1 flex flex-col gap-2">
                  <span className="text-[10px] text-[#ff6b35] uppercase tracking-[0.12em] font-semibold">{item.category}</span>
                  <h3 className="text-white text-[14px] font-medium leading-tight line-clamp-2">{item.name}</h3>
                  <p className="text-[#888888] text-[11px]">
                    {item.type === 'pizza'
                      ? `${getPizzaSizes(item).length} tamanhos • ${getPizzaFlavorIds(item).length} sabores • ${getPizzaBorders(item).length} bordas`
                      : (item.description || 'Item do cardápio')}
                  </p>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 rounded-md text-[10px] text-stone-300 bg-[#2a2a2a]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mx-[14px] border-t-[0.5px] border-[#333]" />
                <div className="px-3.5 py-3 flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); if (item.type === 'pizza') { setDetailsItem(item); return; } handleEdit(item); }} className="flex-1 bg-[#ff6b35] text-white text-sm font-medium rounded-[10px] py-[9px] hover:brightness-110 transition-all">Ver detalhes</button>
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="w-[38px] h-[38px] grid place-items-center bg-[#2a2a2a] text-stone-400 hover:text-stone-200 rounded-[10px] transition-all"><Edit2 size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="w-[38px] h-[38px] grid place-items-center bg-[#2a2a2a] text-stone-400 hover:text-red-400 rounded-[10px] transition-all"><Trash2 size={16} /></button>
                </div>
            </div>
            ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
          {items.map(item => (
              <div key={item.id} onClick={() => item.type === 'pizza' && setDetailsItem(item)} className={`bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-4 w-full min-w-0 flex flex-col xl:flex-row items-start xl:items-center gap-4 md:gap-6 hover:shadow-lg transition-all group ${item.type === 'pizza' ? 'cursor-pointer' : ''}`}>
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
                      {item.type === 'pizza' && (
                        <>
                          <p className="text-[11px] font-bold text-stone-500 dark:text-stone-300">{`${getPizzaSizes(item).length} tamanhos • ${getPizzaFlavorIds(item).length} sabores • ${getPizzaBorders(item).length} bordas`}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getPizzaSizes(item).slice(0, 4).map((size) => <span key={size.id} className="text-[9px] text-stone-400 font-bold bg-stone-50 dark:bg-stone-800 px-1.5 rounded-md">{size.label}</span>)}
                            {getPizzaSizes(item).length > 4 && <span className="text-[9px] text-stone-400 font-bold bg-stone-50 dark:bg-stone-800 px-1.5 rounded-md">+{getPizzaSizes(item).length - 4}</span>}
                          </div>
                        </>
                      )}
                      <p className="text-xs text-stone-400 hidden md:block line-clamp-2 break-words">{item.description}</p>
                      {/* Mobile Description */}
                       <p className="text-xs text-stone-400 line-clamp-2 md:hidden mt-1">{item.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between w-full xl:w-auto xl:flex-nowrap xl:flex-col xl:items-end gap-2 xl:gap-1 xl:px-4 xl:border-l xl:border-r border-stone-100 dark:border-stone-800">
                      <div className="flex flex-col items-start xl:items-end">
                          <span className="text-sm font-black text-stone-900 dark:text-white">{item.type === 'pizza' ? `A partir de ${formatCurrencyBRL(getStartingPrice(item))}` : formatCurrencyBRL(item.price)}</span>
                          {item.originalPrice && (
                              <span className="text-[10px] text-stone-400 line-through">{formatCurrencyBRL(item.originalPrice)}</span>
                          )}
                          {item.type === 'pizza' && <span className={`text-[10px] font-black uppercase ${isItemActive(item) ? 'text-emerald-500' : 'text-stone-400'}`}>{isItemActive(item) ? 'Ativo' : 'Inativo'}</span>}
                      </div>
                      {/* Mobile Actions in the bottom row */}
                      <div className="flex gap-2 xl:hidden">
                        {item.type === 'pizza' && <button onClick={(e) => { e.stopPropagation(); setDetailsItem(item); }} className="px-2.5 py-2 bg-stone-50 dark:bg-stone-800 text-[10px] font-black uppercase text-stone-500 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all">Ver detalhes</button>}
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                  </div>

                  <div className="hidden xl:flex gap-2 pl-2 shrink-0">
                      {item.type === 'pizza' && <button onClick={(e) => { e.stopPropagation(); setDetailsItem(item); }} className="px-3 py-2 bg-stone-50 dark:bg-stone-800 text-[10px] font-black uppercase text-stone-500 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all">Ver detalhes</button>}
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2.5 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
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
               onClick={() => { resetForm(); setNewItemType('normal'); setFormData((p) => ({ ...p, type: 'regular' })); setNormalBaseline(getNormalSnapshot({ ...formData, name: '', category: categories[0] || 'Burgers', price: '', costPrice: '', originalPrice: '', description: '', imageUrl: '', imagePublicId: '', size: 'M', tags: [], ingredients: [], extras: [], type: 'regular', pricingStrategy: 'highestFlavor', sizes: [] })); setIsModalOpen(true); }} 
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
                  <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-stone-800 dark:text-white">{newItemType === 'pizza' ? 'Nova Pizza' : editingId ? 'Ficha Técnica do Prato' : 'Novo Item'}</h2>
                  <p className="text-sm text-stone-400 font-medium">{newItemType === 'pizza' ? 'Cadastre apenas o card da pizza: nome, preço, fatias, máximo de sabores e imagem.' : editingId ? 'Edite as informações do item.' : 'Preencha os dados para colocar no cardápio.'}</p>
                </div>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 lg:p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400 hover:text-red-500 transition-all"><X size={20} className="lg:w-6 lg:h-6"/></button>
              </div>

              {/* Scrollable Content: Apenas o formulário rola */}
              <div ref={modalBodyRef} onScroll={handleModalScroll} className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:px-12 space-y-10">
                <div className="rounded-2xl border border-stone-200 dark:border-stone-700 p-3 bg-white dark:bg-stone-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">Tipo do item</p>
                    <div className="flex gap-2" title={editingId ? 'Este campo não pode ser alterado após a criação' : undefined}>
                      <button
                        onClick={() => handleTypeSwitch('normal')}
                        disabled={!!editingId}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${newItemType === 'normal' ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500'} ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => handleTypeSwitch('pizza')}
                        disabled={!!editingId}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${newItemType === 'pizza' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500'} ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Pizza
                      </button>
                    </div>
                  </div>

                {newItemType === 'pizza' ? (
                  <PizzaConfiguratorContent
                    pizzaBase={editingPizzaBase}
                    categories={categories}
                    onSaved={async () => {
                      const menuData = await loadMenu();
                      await loadCatalogs(menuData);
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    onDirtyChange={setDirtyPizza}
                  />
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Coluna 1: Básico e Descrição */}
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                        <List size={14} className="text-orange-500" /> Informações principais
                      </h3>
                      <p className="text-xs text-stone-400">Preencha o básico para cadastrar o item no cardápio.</p>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Nome do item</label>
                        <input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold outline-none focus:border-orange-500 dark:text-white" placeholder="Ex: Burger Supremo" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`space-y-2 ${isAddingCategory ? 'sm:col-span-2' : ''}`}>
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Categoria</label>
                          {editingId ? (
                            <div
                              title="Este campo não pode ser alterado após a criação"
                              className="w-full h-[58px] bg-stone-100 dark:bg-stone-800/70 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold text-stone-500 dark:text-stone-300 flex items-center opacity-50 cursor-not-allowed"
                            >
                              {originalCategory || formData.category}
                            </div>
                          ) : isAddingCategory ? (
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
                        <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Imagem <span className="text-stone-400">(opcional)</span></label>
                        <div className="flex items-center gap-2">
                          <label className="px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold text-sm text-stone-600 dark:text-stone-300 cursor-pointer hover:border-orange-400 transition-all inline-flex items-center gap-2">
                            <ImageIcon size={16} /> Selecionar imagem
                            <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                          </label>
                          {selectedImageFile && <span className="text-[11px] text-stone-500 font-bold truncate max-w-[180px]">{selectedImageFile.name}</span>}
                          {isUploadingImage && <span className="text-[11px] text-orange-500 font-bold">Enviando imagem...</span>}
                        </div>
                        {imageUploadError && <p className="text-[11px] text-red-500">{imageUploadError}</p>}
                        {(localImagePreview || formData.imageUrl) && (
                          <img src={localImagePreview || formData.imageUrl} alt="Prévia" className="w-20 h-20 rounded-xl object-cover border border-stone-200" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                        <DollarSign size={14} className="text-orange-500" /> Preço
                      </h3>
                      <p className="text-xs text-stone-400">Defina os valores do item.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Preço de venda</label>
                          <input type="text" inputMode="decimal" value={formData.price} onChange={e => setFormData(p => ({...p, price: sanitizeDecimalInput(e.target.value)}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-black text-orange-600" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Custo unitário</label>
                          <input type="text" inputMode="decimal" value={formData.costPrice} onChange={e => setFormData(p => ({...p, costPrice: sanitizeDecimalInput(e.target.value)}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white" placeholder="R$ 0,00" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Preço promocional ou de antes</label>
                          <input type="text" inputMode="decimal" value={formData.originalPrice} onChange={e => setFormData(p => ({...p, originalPrice: sanitizeDecimalInput(e.target.value)}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <label className="text-[10px] font-black uppercase text-stone-500 ml-2">Descrição</label>
                        <button onClick={handleAIOptimize} disabled={isGeneratingDescription} className="px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 text-[10px] font-black uppercase flex items-center gap-1.5 w-fit disabled:opacity-60">
                          {isGeneratingDescription ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={12}/>} Gerar com IA
                        </button>
                      </div>
                      <p className="text-xs text-stone-400">Explique o item de forma simples ou gere um texto com IA.</p>
                      <textarea rows={5} value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="w-full bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-medium text-sm leading-relaxed outline-none focus:border-orange-500 dark:text-white" placeholder="Descreva o sabor, os ingredientes ou os diferenciais do item" />
                    </div>
                  </div>

                  {/* Coluna 2: Detalhes opcionais */}
                  <details className="group space-y-6 bg-stone-50/50 dark:bg-stone-800/30 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-stone-100 dark:border-stone-800">
                    <summary className="list-none cursor-pointer flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Detalhes opcionais</p>
                        <p className="text-xs text-stone-400">Preencha apenas se quiser adicionar mais informações.</p>
                      </div>
                      <span className="text-[10px] font-black uppercase text-stone-400 group-open:hidden">Mostrar</span>
                      <span className="text-[10px] font-black uppercase text-stone-400 hidden group-open:inline">Ocultar</span>
                    </summary>
                    <div className="space-y-8 pt-2">
                    {/* Tags */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                        <Tag size={14} className="text-orange-500" /> Tags
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
                        <List size={14} className="text-orange-500" /> Ingredientes
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
                        <PlusCircle size={14} className="text-orange-500" /> Complementos opcionais
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input value={newExtra.name} onChange={e => setNewExtra(p => ({...p, name: e.target.value}))} className="flex-[2] min-w-0 bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold dark:text-white" placeholder="Item" />
                        <input type="text" inputMode="decimal" value={newExtra.price} onChange={e => setNewExtra(p => ({...p, price: sanitizeDecimalInput(e.target.value)}))} className="flex-1 min-w-0 bg-white dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-bold dark:text-white" placeholder="R$" />
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
                  </details>
                </div>
                )}
              </div>

              {/* Footer: Fixo no fundo */}
              {newItemType === 'normal' && (
              <div className="flex flex-col sm:flex-row gap-4 p-6 lg:p-12 lg:pt-6 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 z-10">
                 {showScrollToType && (
                   <button onClick={scrollToTypeSelector} className="w-full sm:w-auto py-3 px-4 bg-stone-50 dark:bg-stone-800 text-stone-500 rounded-2xl text-[10px] font-black uppercase border border-stone-200 dark:border-stone-700">Trocar tipo</button>
                 )}
                 <button onClick={() => setIsModalOpen(false)} className="w-full sm:flex-1 py-4 sm:py-5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-3xl font-black uppercase tracking-widest text-[10px]">Descartar Alterações</button>
                 <button onClick={handleSave} className="w-full sm:flex-[2] py-4 sm:py-5 bg-orange-500 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                   {editingId ? 'Confirmar Atualização' : 'Salvar Novo Prato no Cardápio'}
                 </button>
              </div>
              )}
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
                              type="text" 
                              inputMode="decimal"
                              value={deliveryFee} 
                              onChange={e => setDeliveryFee(sanitizeDecimalInput(e.target.value))}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 h-full">
                      {renderGlobalList('category', categories, List, 'Categorias', 'Nova Categoria')}
                      {renderGlobalList('tag', globalTags, Tag, 'Selos e Tags', 'Novo Selo/Tag')}
                      {renderGlobalList('ingredient', globalIngredients, List, 'Ingredientes', 'Novo Ingrediente')}
                      {renderPizzaFlavorsGlobalList()}
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
                                type="text"
                                inputMode="numeric"
                                value={newCoupon.discount}
                                onChange={e => setNewCoupon(p => ({ ...p, discount: sanitizeIntegerInput(e.target.value) }))}
                                className="w-full bg-white dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 font-bold dark:text-white outline-none focus:border-orange-500"
                                placeholder="%"
                              />
                          </div>
                          <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-bold uppercase text-stone-500 ml-2">Máx. (R$)</label>
                              <input 
                                type="text"
                                inputMode="decimal"
                                value={newCoupon.maxDiscountValue}
                                onChange={e => setNewCoupon(p => ({ ...p, maxDiscountValue: sanitizeDecimalInput(e.target.value) }))}
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

      {detailsItem && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-[280] flex items-center justify-center p-4" onClick={() => setDetailsItem(null)}>
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Detalhes da pizza</p>
                <h3 className="font-black text-xl text-stone-800 dark:text-white uppercase">{selectedPizzaDetails?.name || detailsItem.name}</h3>
                <p className="text-xs text-stone-500">{`${selectedSizes.length} tamanhos • ${flavorExtras.length} sabores • ${borderExtras.length} bordas`}</p>
              </div>
              <button onClick={() => setDetailsItem(null)} className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-6">
              {pizzaDetailsError && (
                <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {pizzaDetailsError}
                </div>
              )}

              {pizzaDetailsLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-24 rounded-2xl bg-stone-100 dark:bg-stone-800" />
                  <div className="h-40 rounded-2xl bg-stone-100 dark:bg-stone-800" />
                  <div className="h-24 rounded-2xl bg-stone-100 dark:bg-stone-800" />
                  <div className="h-40 rounded-2xl bg-stone-100 dark:bg-stone-800" />
                </div>
              ) : (
                <>
                  <section className="rounded-2xl border border-stone-100 dark:border-stone-800 p-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Tamanhos</h4>
                    <div className="space-y-2">
                      {selectedSizes.map((size) => (
                        <div key={size.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs bg-stone-50 dark:bg-stone-800/40 rounded-xl px-3 py-2 items-center">
                          <span className="font-black text-stone-700 dark:text-stone-200">{size.label}</span>
                          <span className="text-stone-500">{size.slices ?? '-'} fatias</span>
                          <span className="text-stone-500">{size.maxFlavors} sabores</span>
                          <span className={`justify-self-start px-2 py-1 rounded-md font-bold ${activeLabel === 'Ativo' ? 'text-[#00e5b0] bg-emerald-500/10' : 'text-stone-400 bg-stone-200/40 dark:bg-stone-700/50'}`}>{activeLabel}</span>
                          <span className="text-[10px] text-stone-400">ID: {size.id}</span>
                        </div>
                      ))}
                      {selectedSizes.length === 0 && <p className="text-xs text-stone-400">Nenhum tamanho cadastrado.</p>}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-stone-100 dark:border-stone-800 p-4 overflow-x-auto">
                    <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Preço dos sabores por tamanho</h4>
                    <table className="w-full min-w-[560px] text-xs">
                      <thead>
                        <tr className="text-left text-stone-400 uppercase">
                          <th className="pb-2">Sabor</th>
                          {selectedSizes.map((size) => <th key={size.id} className="pb-2">{size.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {flavorExtras.map((extra) => (
                          <tr key={extra.name} className="border-t border-stone-100 dark:border-stone-800">
                            <td className="py-2 font-bold text-stone-700 dark:text-stone-200">{extra.name}</td>
                            {selectedSizes.map((size) => (
                              <td key={`${extra.name}-${size.id}`} className="py-2 text-stone-500">{formatCurrencyBRL(resolveExtraPriceBySize(extra as PizzaExtraEntry & Record<string, any>, size))}</td>
                            ))}
                          </tr>
                        ))}
                        {flavorExtras.length === 0 && (
                          <tr>
                            <td colSpan={Math.max(1, selectedSizes.length + 1)} className="py-3 text-stone-400">Nenhum sabor com preço cadastrado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </section>

                  <section className="rounded-2xl border border-stone-100 dark:border-stone-800 p-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Bordas</h4>
                    <div className="space-y-2">
                      {borderExtras.map((border) => (
                        <div key={border.name} className="grid grid-cols-2 gap-2 text-xs bg-stone-50 dark:bg-stone-800/40 rounded-xl px-3 py-2">
                          <span className="font-black text-stone-700 dark:text-stone-200">{border.name}</span>
                          <span className="text-stone-500">{formatCurrencyBRL(Number(border.price || 0))}</span>
                        </div>
                      ))}
                      {borderExtras.length === 0 && <p className="text-xs text-stone-400">Nenhuma borda cadastrada.</p>}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-stone-100 dark:border-stone-800 p-4 overflow-x-auto">
                    <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-3">Preço das bordas por tamanho</h4>
                    <table className="w-full min-w-[560px] text-xs">
                      <thead>
                        <tr className="text-left text-stone-400 uppercase">
                          <th className="pb-2">Borda</th>
                          {selectedSizes.map((size) => <th key={size.id} className="pb-2">{size.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {borderExtras.map((border) => (
                          <tr key={border.name} className="border-t border-stone-100 dark:border-stone-800">
                            <td className="py-2 font-bold text-stone-700 dark:text-stone-200">{border.name}</td>
                            {selectedSizes.map((size) => (
                              <td key={`${border.name}-${size.id}`} className="py-2 text-stone-500">{formatCurrencyBRL(resolveExtraPriceBySize(border as PizzaExtraEntry & Record<string, any>, size))}</td>
                            ))}
                          </tr>
                        ))}
                        {borderExtras.length === 0 && (
                          <tr>
                            <td colSpan={Math.max(1, selectedSizes.length + 1)} className="py-3 text-stone-400">Nenhuma borda cadastrada.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
