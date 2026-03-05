import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, IS_FIREBASE_ON } from '../../../constants';
import { useStorefrontData } from '../../../hooks/useStorefrontData';
import { askWaiter } from '../../../services/geminiService';
import { clearUserNotificationsFromFirebase, subscribeToUserNotifications } from '../../../services/firebaseService';
import { AdminNotification, CartItem, CheckoutDetails, ExtraItem, MenuItem } from '../../../types';
import { generateOrderId, calculateCartTotal, processOrderToDatabase, sendWhatsAppMessage } from '../services/order-flow.service';
import { AiSuggestion, CheckoutSession } from '../types/customer-app.types';
import { useCustomerMenuItems } from './useCustomerMenuItems';

export function useCustomerAppController() {
  const { data: storefrontData, loading: isLoadingData, error: storefrontError } = useStorefrontData();
  const { items: realMenuItems, loading: isLoadingMenu, error: menuError } = useCustomerMenuItems();
  const menuItems = realMenuItems;
  const categories = storefrontData.categories.length > 0 ? storefrontData.categories : CATEGORIES;
  const deliveryFee = typeof storefrontData.deliverySettings?.deliveryFee === 'number' ? storefrontData.deliverySettings.deliveryFee : 5.90;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartJiggling, setIsCartJiggling] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('foodai-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('foodai-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isCartOpen || isPixModalOpen || isDetailModalOpen || isProfileOpen || isOrdersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isCartOpen, isPixModalOpen, isDetailModalOpen, isProfileOpen, isOrdersOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToUserNotifications((userNotifications) => {
      setNotifications(userNotifications);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = useMemo(() => menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = true;
    if (activeCategory === 'Promoções') {
      matchesCategory = !!(item.originalPrice && item.originalPrice > item.price);
    } else if (activeCategory) {
      matchesCategory = item.category === activeCategory;
    }

    return matchesSearch && matchesCategory;
  }), [activeCategory, menuItems, searchQuery]);

  const currentInitialData = editingCartIndex !== null ? {
    removedIngredients: cart[editingCartIndex].removedIngredients,
    selectedExtras: cart[editingCartIndex].selectedExtras,
    observations: cart[editingCartIndex].observations,
    quantity: cart[editingCartIndex].quantity
  } : null;

  const shouldHideFooter = isCartOpen || isPixModalOpen || isDetailModalOpen || isSearchFocused;

  const getItemCountInCart = (itemId: string) => cart
    .filter(cartItem => cartItem.item.id === itemId)
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const saveToCart = (item: MenuItem, quantity: number, removedIngredients: string[], selectedExtras: ExtraItem[], observations: string) => {
    if (editingCartIndex !== null) {
      const updatedCart = [...cart];
      updatedCart[editingCartIndex] = {
        ...updatedCart[editingCartIndex],
        quantity,
        removedIngredients,
        selectedExtras,
        observations
      };
      setCart(updatedCart);
      setEditingCartIndex(null);
    } else {
      const newCartItem: CartItem = {
        cartId: Math.random().toString(36).substr(2, 9),
        item,
        quantity,
        removedIngredients,
        selectedExtras,
        observations
      };
      setCart(prev => [...prev, newCartItem]);
    }

    setIsCartJiggling(true);
    setTimeout(() => setIsCartJiggling(false), 500);
  };

  const openItemDetails = (item: MenuItem) => {
    setEditingCartIndex(null);
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleEditCartItem = (index: number) => {
    const cartItem = cart[index];
    setEditingCartIndex(index);
    setSelectedItem(cartItem.item);
    setIsDetailModalOpen(true);
  };

  const handleCheckout = async (details: CheckoutDetails): Promise<{ success: boolean; message?: string }> => {
    if (cart.length === 0) {
      return { success: false, message: 'Seu carrinho está vazio.' };
    }

    const finalTotal = calculateCartTotal(cart, deliveryFee);
    const orderId = generateOrderId();

    setCurrentTotal(finalTotal);
    setIsCartOpen(false);

    let savedToDatabase = false;
    if (IS_FIREBASE_ON) {
      savedToDatabase = await processOrderToDatabase(orderId, details, cart, finalTotal);
      if (!savedToDatabase) {
        return { success: false, message: 'Não foi possível salvar seu pedido agora. Tente novamente em instantes.' };
      }
    }

    setCheckoutSession({ orderId, details, total: finalTotal, savedToDatabase });

    if (details.payment.type === 'pix') {
      setIsPixModalOpen(true);
      return { success: true, message: 'Pedido salvo! Agora confirme o pagamento via Pix.' };
    } else {
      sendWhatsAppMessage(details, cart, finalTotal);
      setCart([]);
      return { success: true, message: 'Pedido finalizado com sucesso!' };
    }
  };

  const handlePixConfirmed = async () => {
    if (checkoutSession) {
      let wasSaved = checkoutSession.savedToDatabase;
      if (IS_FIREBASE_ON && !wasSaved) {
        wasSaved = await processOrderToDatabase(checkoutSession.orderId, checkoutSession.details, cart, checkoutSession.total);
      }

      sendWhatsAppMessage(checkoutSession.details, cart, checkoutSession.total);
      setCheckoutSession((prev) => prev ? { ...prev, savedToDatabase: wasSaved } : prev);
    }
    setCart([]);
    setIsPixModalOpen(false);
  };

  const clearNotifications = async () => {
    const notificationIds = notifications.map((notification) => notification.id);
    setNotifications([]);
    await clearUserNotificationsFromFirebase(notificationIds);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleAskWaiter = async (overrideQuery?: string) => {
    const finalQuery = overrideQuery || searchQuery;
    if (!finalQuery) return;

    setSearchQuery(finalQuery);
    setIsAiLoading(true);
    setAiSuggestions([]);
    setIsSearchFocused(false);

    const result = await askWaiter(finalQuery, menuItems);
    if (result?.suggestions) {
      setAiSuggestions(result.suggestions);
      setTimeout(() => {
        const el = document.getElementById('ai-suggestions-anchor');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setIsAiLoading(false);
  };

  const handleExploreClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      searchInputRef.current?.focus();
      setIsSearchFocused(true);
    }, 500);
  };

  return {
    menuItems,
    categories,
    deliveryFee,
    isLoadingData: isLoadingData || isLoadingMenu,
    storefrontError: menuError || storefrontError,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    aiSuggestions,
    setAiSuggestions,
    isAiLoading,
    isSearchFocused,
    setIsSearchFocused,
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    isCartJiggling,
    isPixModalOpen,
    setIsPixModalOpen,
    isProfileOpen,
    setIsProfileOpen,
    isOrdersOpen,
    setIsOrdersOpen,
    currentTotal,
    selectedItem,
    isDetailModalOpen,
    setIsDetailModalOpen,
    setEditingCartIndex,
    darkMode,
    setDarkMode,
    notifications,
    searchInputRef,
    filteredItems,
    currentInitialData,
    shouldHideFooter,
    getItemCountInCart,
    saveToCart,
    openItemDetails,
    handleEditCartItem,
    handleCheckout,
    handlePixConfirmed,
    clearNotifications,
    markNotificationsAsRead,
    handleAskWaiter,
    handleExploreClick
  };
}
