import { IS_FIREBASE_ENABLED, firebaseConfig } from './config';
import { MenuItem, Order, Combo, SalesInsights, SavedInsight, OrderStatus, AdminNotification, OrderNotificationEvent, Coupon, StoreSettings } from '../types';
import { initializeApp } from 'firebase/app';
import { tenantPathSegments } from '../../../firebase/firestore-paths';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

// Inicialização segura do Firebase
let db: any = null;
if (IS_FIREBASE_ENABLED && firebaseConfig.apiKey !== 'SUA_API_KEY' && firebaseConfig.apiKey !== '') {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
  }
}

// Caminho raiz para organização dos dados
const ROOT_PATH = tenantPathSegments();

// Helper para remover campos 'undefined' que o Firestore não aceita
const sanitizeData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: any, key) => {
      const value = sanitizeData(obj[key]);
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  return obj;
};

// Chaves do LocalStorage (Fallback para persistência offline ou sem config)
const KEYS = {
  MENU: 'platform_menu_v1',
  ORDERS: 'platform_orders_v1',
  COMBOS: 'platform_combos_v1',
  COUPONS: 'platform_coupons_v1',
  INSIGHTS: 'platform_insights_v1',
  NOTIFICATIONS: 'platform_notifications_v1',
  CATEGORIES: 'platform_categories_v1',
  TAGS: 'platform_tags_v1',
  INGREDIENTS: 'platform_ingredients_v1',
  SETTINGS: 'platform_settings_v1'
};

const COLLECTIONS = {
  CATEGORIES: 'categories',
  TAGS: 'tags',
  INGREDIENTS: 'ingredients',
  COMBOS: 'combos'
} as const;

const buildTaxonomyId = (value: string) => value
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

// --- Funções Auxiliares Local ---
const getLocal = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- SERVIÇO DE CARDÁPIO ---
export const dbMenu = {
  getAll: async (): Promise<MenuItem[]> => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, ...ROOT_PATH, 'menu'));
        const items: MenuItem[] = [];
        querySnapshot.forEach((snapshotDoc) => {
          items.push({ ...snapshotDoc.data(), id: snapshotDoc.id } as MenuItem);
        });
        return items;
      } catch (e) {
        console.warn('Firestore error on menu, falling back to local:', e);
      }
    }
    return getLocal(KEYS.MENU, []);
  },
  save: async (item: MenuItem): Promise<void> => {
    const sanitized = sanitizeData(item);
    if (db) {
      try {
        await setDoc(doc(db, ...ROOT_PATH, 'menu', sanitized.id), sanitized);
        return;
      } catch (e) {
        console.error('Error saving menu item to Firestore:', e);
      }
    }
    const items = await dbMenu.getAll();
    const index = items.findIndex((i) => i.id === sanitized.id);
    const updated = index >= 0
      ? items.map((i) => (i.id === sanitized.id ? sanitized : i))
      : [sanitized, ...items];
    setLocal(KEYS.MENU, updated);
  },
  delete: async (id: string): Promise<void> => {
    if (db) {
      try {
        await deleteDoc(doc(db, ...ROOT_PATH, 'menu', id));
        return;
      } catch (e) {
        console.error('Error deleting menu item from Firestore:', e);
      }
    }
    const items = await dbMenu.getAll();
    const updated = items.filter((i) => i.id !== id);
    setLocal(KEYS.MENU, updated);
  }
};

const getTaxonomyLocalKey = (type: 'category' | 'tag' | 'ingredient') => {
  if (type === 'category') return KEYS.CATEGORIES;
  if (type === 'tag') return KEYS.TAGS;
  return KEYS.INGREDIENTS;
};

const getTaxonomyCollection = (type: 'category' | 'tag' | 'ingredient') => {
  if (type === 'category') return COLLECTIONS.CATEGORIES;
  if (type === 'tag') return COLLECTIONS.TAGS;
  return COLLECTIONS.INGREDIENTS;
};

const getTaxonomyFromMenu = async (type: 'category' | 'tag' | 'ingredient'): Promise<string[]> => {
  const menu = await dbMenu.getAll();
  if (type === 'category') return Array.from(new Set(menu.map((i) => i.category))).sort();
  if (type === 'tag') return Array.from(new Set(menu.flatMap((i) => i.tags))).sort();
  return Array.from(new Set(menu.flatMap((i) => i.ingredients))).sort();
};

export const dbCatalog = {
  getAll: async (type: 'category' | 'tag' | 'ingredient'): Promise<string[]> => {
    const localKey = getTaxonomyLocalKey(type);
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, ...ROOT_PATH, getTaxonomyCollection(type)));
        const values: string[] = [];
        querySnapshot.forEach((snapshotDoc) => {
          const payload = snapshotDoc.data() as { name?: string };
          if (payload.name?.trim()) {
            values.push(payload.name.trim());
          }
        });

        if (values.length > 0) {
          const uniqueValues = Array.from(new Set(values)).sort();
          setLocal(localKey, uniqueValues);
          return uniqueValues;
        }
      } catch (e) {
        console.warn(`Firestore error on ${type} catalog, falling back to local:`, e);
      }
    }

    const localValues = getLocal<string[]>(localKey, []);
    if (localValues.length > 0) return Array.from(new Set(localValues)).sort();
    return getTaxonomyFromMenu(type);
  },
  save: async (type: 'category' | 'tag' | 'ingredient', value: string): Promise<void> => {
    const normalized = value.trim();
    if (!normalized) return;

    const localKey = getTaxonomyLocalKey(type);
    const id = buildTaxonomyId(normalized);
    if (db && id) {
      try {
        await setDoc(doc(db, ...ROOT_PATH, getTaxonomyCollection(type), id), {
          id,
          name: normalized,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error(`Error saving ${type} to Firestore:`, e);
      }
    }

    const current = getLocal<string[]>(localKey, []);
    if (!current.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setLocal(localKey, [...current, normalized].sort());
    }
  },
  rename: async (type: 'category' | 'tag' | 'ingredient', oldValue: string, newValue: string): Promise<void> => {
    const previousId = buildTaxonomyId(oldValue);
    const newId = buildTaxonomyId(newValue);
    const normalizedNew = newValue.trim();
    if (!normalizedNew) return;

    if (db && previousId && newId) {
      try {
        if (previousId !== newId) {
          await deleteDoc(doc(db, ...ROOT_PATH, getTaxonomyCollection(type), previousId));
        }
        await setDoc(doc(db, ...ROOT_PATH, getTaxonomyCollection(type), newId), {
          id: newId,
          name: normalizedNew,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error(`Error renaming ${type} on Firestore:`, e);
      }
    }

    const localKey = getTaxonomyLocalKey(type);
    const updated = getLocal<string[]>(localKey, [])
      .map((item) => (item === oldValue ? normalizedNew : item));
    setLocal(localKey, Array.from(new Set(updated)).sort());
  },
  delete: async (type: 'category' | 'tag' | 'ingredient', value: string): Promise<void> => {
    const id = buildTaxonomyId(value);
    if (db && id) {
      try {
        await deleteDoc(doc(db, ...ROOT_PATH, getTaxonomyCollection(type), id));
      } catch (e) {
        console.error(`Error deleting ${type} from Firestore:`, e);
      }
    }

    const localKey = getTaxonomyLocalKey(type);
    const updated = getLocal<string[]>(localKey, []).filter((item) => item !== value);
    setLocal(localKey, updated);
  }
};



const buildUserOrderPath = (order: Pick<Order, 'customerPhone' | 'userId'>) => {
  const phone = order.customerPhone?.toString().trim() || order.userId?.toString().trim();
  if (!phone) return null;

  return ['deliveryuai', ROOT_PATH[1], 'user', phone, 'profile', 'orders'] as const;
};

const orderStatusNotificationCopy: Record<Exclude<OrderStatus, 'pending'>, { title: string; message: (orderId: string) => string; event: OrderNotificationEvent }> = {
  preparing: {
    title: 'Pedido em preparo',
    message: (orderId) => `Pedido ${orderId} entrou em preparo.`,
    event: 'preparing'
  },
  shipping: {
    title: 'Pedido em entrega',
    message: (orderId) => `Pedido ${orderId} saiu para entrega.`,
    event: 'shipping'
  },
  completed: {
    title: 'Pedido concluído',
    message: (orderId) => `Pedido ${orderId} foi marcado como entregue.`,
    event: 'completed'
  },
  cancelled: {
    title: 'Pedido cancelado',
    message: (orderId) => `Pedido ${orderId} foi cancelado.`,
    event: 'cancelled'
  }
};

// --- SERVIÇO DE CONFIGURAÇÕES DA LOJA ---
const DEFAULT_SETTINGS: StoreSettings = {
  deliveryFee: 0,
  companyName: '',
  logoUrl: '',
  openingHours: '',
  averageTimeMinutes: 0
};

export const dbSettings = {
  get: async (): Promise<StoreSettings> => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, ...ROOT_PATH, 'settings'));
        if (!querySnapshot.empty) {
          const snapshotDoc = querySnapshot.docs[0];
          const payload = snapshotDoc.data() as Partial<StoreSettings>;
          if (typeof payload.deliveryFee === 'number') {
            const settings: StoreSettings = {
              deliveryFee: payload.deliveryFee,
              companyName: payload.companyName || '',
              logoUrl: payload.logoUrl || '',
              openingHours: payload.openingHours || '',
              averageTimeMinutes: Number(payload.averageTimeMinutes || 0)
            };
            setLocal(KEYS.SETTINGS, settings);
            return settings;
          }
        }
      } catch (e) {
        console.warn('Firestore error on settings, falling back to local:', e);
      }
    }

    const localSettings = getLocal<StoreSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
    return {
      deliveryFee: typeof localSettings.deliveryFee === 'number' ? localSettings.deliveryFee : DEFAULT_SETTINGS.deliveryFee,
      companyName: localSettings.companyName || '',
      logoUrl: localSettings.logoUrl || '',
      openingHours: localSettings.openingHours || '',
      averageTimeMinutes: Number(localSettings.averageTimeMinutes || 0)
    };
  },
  save: async (settings: StoreSettings): Promise<void> => {
    const payload: StoreSettings = {
      deliveryFee: Number.isFinite(settings.deliveryFee) ? settings.deliveryFee : DEFAULT_SETTINGS.deliveryFee,
      companyName: settings.companyName || '',
      logoUrl: settings.logoUrl || '',
      openingHours: settings.openingHours || '',
      averageTimeMinutes: Number(settings.averageTimeMinutes || 0)
    };

    if (db) {
      try {
        await setDoc(doc(db, ...ROOT_PATH, 'settings', 'store'), {
          ...payload,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error saving settings to Firestore:', e);
      }
    }

    setLocal(KEYS.SETTINGS, payload);
  }
};


// --- SERVIÇO DE PEDIDOS ---
export const dbOrders = {
  getAll: async (): Promise<Order[]> => {
    if (db) {
      try {
        const q = query(collection(db, ...ROOT_PATH, 'orders'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];
        querySnapshot.forEach((snapshotDoc) => {
          orders.push({ ...snapshotDoc.data(), id: snapshotDoc.id } as Order);
        });
        return orders;
      } catch (e) {
        console.warn('Firestore error on orders, falling back to local:', e);
      }
    }
    return getLocal(KEYS.ORDERS, []);
  },
  add: async (order: Order): Promise<void> => {
    const sanitized = sanitizeData(order);
    let orderId = sanitized.id || `PED-${Date.now()}`;

    if (db) {
      try {
        if (orderId && orderId.includes('-')) {
          await setDoc(doc(db, ...ROOT_PATH, 'orders', orderId), sanitized);
        } else {
          const created = await addDoc(collection(db, ...ROOT_PATH, 'orders'), sanitized);
          orderId = created.id;
        }

        const userOrdersPath = buildUserOrderPath(sanitized);
        if (userOrdersPath) {
          await setDoc(doc(db, ...userOrdersPath, orderId), sanitized);
        }
      } catch (e) {
        console.error('Error adding order to Firestore:', e);
      }
    } else {
      const orders = await dbOrders.getAll();
      const updated = [sanitized, ...orders];
      setLocal(KEYS.ORDERS, updated);
    }

    await dbNotifications.add({
      id: `NOTIF-${orderId}`,
      title: 'Pedido pendente',
      message: `Novo pedido pendente: ${orderId}`,
      time: new Date().toISOString(),
      read: false,
      type: 'created',
      payload: { orderId, status: sanitized.status, event: 'created' }
    });
  },
  updateStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    if (db) {
      try {
        const orderRef = doc(db, ...ROOT_PATH, 'orders', orderId);
        await updateDoc(orderRef, { status });

        const orderSnapshot = await getDoc(orderRef);
        const orderData = orderSnapshot.exists() ? (orderSnapshot.data() as Order) : undefined;

        if (orderData) {
          const userOrdersPath = buildUserOrderPath(orderData);
          if (userOrdersPath) {
            await updateDoc(doc(db, ...userOrdersPath, orderId), { status });
          }
        }
      } catch (e) {
        console.error('Error updating order status in Firestore:', e);
      }
    } else {
      const orders = await dbOrders.getAll();
      const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      setLocal(KEYS.ORDERS, updated);
    }

    if (status !== 'pending') {
      const copy = orderStatusNotificationCopy[status as Exclude<OrderStatus, 'pending'>];
      await dbNotifications.add({
        id: `NOTIF-${orderId}-${status}-${Date.now()}`,
        title: copy.title,
        message: copy.message(orderId),
        time: new Date().toISOString(),
        read: false,
        type: copy.event,
        payload: {
          orderId,
          status,
          event: copy.event,
        },
      });
    }
  }
};

// --- SERVIÇO DE NOTIFICAÇÕES ---
export const dbNotifications = {
  getAll: async (): Promise<AdminNotification[]> => {
    if (db) {
      try {
        const q = query(collection(db, ...ROOT_PATH, 'notifications'), orderBy('time', 'desc'));
        const querySnapshot = await getDocs(q);
        const items: AdminNotification[] = [];
        querySnapshot.forEach((snapshotDoc) => {
          items.push({ ...snapshotDoc.data(), id: snapshotDoc.id } as AdminNotification);
        });
        return items;
      } catch (e) {
        console.warn('Firestore error on notifications, falling back to local:', e);
      }
    }
    return getLocal(KEYS.NOTIFICATIONS, []);
  },
  subscribe: (callback: (items: AdminNotification[]) => void) => {
    if (db) {
      const q = query(collection(db, ...ROOT_PATH, 'notifications'), orderBy('time', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const items: AdminNotification[] = [];
        snapshot.forEach((snapshotDoc) => {
          items.push({ ...snapshotDoc.data(), id: snapshotDoc.id } as AdminNotification);
        });
        callback(items);
      }, (e) => {
        console.warn('Realtime notifications failed, fallback to local.', e);
        callback(getLocal(KEYS.NOTIFICATIONS, []));
      });
    }

    callback(getLocal(KEYS.NOTIFICATIONS, []));
    return () => undefined;
  },
  add: async (notification: AdminNotification): Promise<void> => {
    const sanitized = sanitizeData(notification);

    if (db) {
      try {
        await setDoc(doc(db, ...ROOT_PATH, 'notifications', sanitized.id), {
          ...sanitized,
          serverTimestamp: serverTimestamp()
        });
        return;
      } catch (e) {
        console.error('Error saving notification to Firestore:', e);
      }
    }

    const items = getLocal<AdminNotification[]>(KEYS.NOTIFICATIONS, []);
    setLocal(KEYS.NOTIFICATIONS, [sanitized, ...items]);
  },
  markAsRead: async (id: string): Promise<void> => {
    if (db) {
      try {
        await updateDoc(doc(db, ...ROOT_PATH, 'notifications', id), { read: true });
        return;
      } catch (e) {
        console.error('Error updating notification read flag:', e);
      }
    }

    const items = getLocal<AdminNotification[]>(KEYS.NOTIFICATIONS, []);
    setLocal(KEYS.NOTIFICATIONS, items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  },
  clearAll: async (): Promise<void> => {
    const items = await dbNotifications.getAll();

    if (db) {
      try {
        await Promise.all(items.map((item) => deleteDoc(doc(db, ...ROOT_PATH, 'notifications', item.id))));
        return;
      } catch (e) {
        console.error('Error clearing notifications:', e);
      }
    }

    setLocal(KEYS.NOTIFICATIONS, []);
  }
};


const COMBO_CATEGORY_NAME = 'Combos';
const buildComboMenuId = (comboId: string) => `combo-${comboId}`;

const mapComboToMenuItem = (combo: Combo): MenuItem => ({
  id: buildComboMenuId(combo.id),
  name: combo.name,
  category: COMBO_CATEGORY_NAME,
  price: combo.price,
  costPrice: undefined,
  originalPrice: undefined,
  description: combo.description,
  imageUrl: 'https://picsum.photos/seed/combo/600/400',
  rating: 4.8,
  preparationTime: '20-30 min',
  size: 'M',
  tags: ['combo'],
  calories: undefined,
  ingredients: combo.items.map((item) => `${item.qty}x ${item.name}`),
  extras: []
});

// --- SERVIÇO DE COMBOS ---
export const dbCombos = {
  getAll: async (): Promise<Combo[]> => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, ...ROOT_PATH, COLLECTIONS.COMBOS));
        const items: Combo[] = [];
        querySnapshot.forEach((snapshotDoc) => {
          items.push({ ...snapshotDoc.data(), id: snapshotDoc.id } as Combo);
        });
        const uniqueItems = items.filter((item, index, self) => self.findIndex((c) => c.id === item.id) === index);
        setLocal(KEYS.COMBOS, uniqueItems);
        return uniqueItems;
      } catch (e) {
        console.warn('Firestore error on combos:', e);
      }
    }
    return getLocal(KEYS.COMBOS, []);
  },
  save: async (combo: Combo): Promise<void> => {
    const normalizedComboId = buildTaxonomyId(combo.name || '') || combo.id || `cmb-${Date.now()}`;
    const comboWithId: Combo = {
      ...combo,
      id: normalizedComboId,
    };
    const sanitized = sanitizeData(comboWithId);

    await dbCatalog.save('category', COMBO_CATEGORY_NAME);
    await dbMenu.save(mapComboToMenuItem(comboWithId));

    if (db) {
      try {
        await setDoc(doc(db, ...ROOT_PATH, COLLECTIONS.COMBOS, sanitized.id), sanitized);
        const currentLocalCombos = getLocal<Combo[]>(KEYS.COMBOS, []);
        const localIndex = currentLocalCombos.findIndex((c) => c.id === sanitized.id);
        const updatedLocal = localIndex >= 0
          ? currentLocalCombos.map((c) => (c.id === sanitized.id ? sanitized : c))
          : [sanitized, ...currentLocalCombos];
        setLocal(KEYS.COMBOS, updatedLocal);
        return;
      } catch (e) {
        console.error('Error saving combo to Firestore:', e);
      }
    }
    const combos = await dbCombos.getAll();
    const existingIndex = combos.findIndex((c) => c.id === sanitized.id);
    const updated = existingIndex >= 0
      ? combos.map((c) => (c.id === sanitized.id ? sanitized : c))
      : [sanitized, ...combos];
    setLocal(KEYS.COMBOS, updated);
  },
  delete: async (id: string): Promise<void> => {
    await dbMenu.delete(buildComboMenuId(id));

    if (db) {
      try {
        await deleteDoc(doc(db, ...ROOT_PATH, COLLECTIONS.COMBOS, id));
        return;
      } catch (e) {
        console.error('Error deleting combo from Firestore:', e);
      }
    }
    const combos = await dbCombos.getAll();
    setLocal(KEYS.COMBOS, combos.filter((c) => c.id !== id));
  }
};

// --- SERVIÇO DE CUPONS ---
export const dbCoupons = {
  getAll: async (): Promise<Coupon[]> => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, ...ROOT_PATH, 'coupons'));
        const items: Coupon[] = [];
        querySnapshot.forEach((snapshotDoc) => {
          const payload = snapshotDoc.data() as Partial<Coupon>;
          const code = (payload.code || snapshotDoc.id).toUpperCase();
          items.push({
            id: snapshotDoc.id,
            code,
            discountPercentage: payload.discountPercentage ?? 0,
            maxDiscountValue: payload.maxDiscountValue,
            active: payload.active ?? true,
          });
        });
        return items;
      } catch (e) {
        console.warn('Firestore error on coupons:', e);
      }
    }

    return getLocal<Coupon[]>(KEYS.COUPONS, []).map((coupon) => ({
      ...coupon,
      code: coupon.code.toUpperCase(),
      maxDiscountValue: coupon.maxDiscountValue,
      active: coupon.active ?? true,
    }));
  },
  save: async (coupon: Coupon): Promise<void> => {
    const normalizedCode = coupon.code.trim().toUpperCase();
    const couponId = normalizedCode;
    const payload: Coupon = {
      ...coupon,
      id: couponId,
      code: normalizedCode,
      maxDiscountValue: coupon.maxDiscountValue,
      active: coupon.active ?? true,
    };
    const sanitized = sanitizeData(payload);

    if (db) {
      try {
        await setDoc(doc(db, ...ROOT_PATH, 'coupons', couponId), sanitized);
        return;
      } catch (e) {
        console.error('Error saving coupon to Firestore:', e);
      }
    }

    const coupons = await dbCoupons.getAll();
    const index = coupons.findIndex((c) => c.id === couponId);
    const updated = index >= 0
      ? coupons.map((c) => (c.id === couponId ? sanitized : c))
      : [sanitized, ...coupons];
    setLocal(KEYS.COUPONS, updated);
  },
  delete: async (id: string): Promise<void> => {
    if (db) {
      try {
        await deleteDoc(doc(db, ...ROOT_PATH, 'coupons', id));
        return;
      } catch (e) {
        console.error('Error deleting coupon from Firestore:', e);
      }
    }
    const coupons = await dbCoupons.getAll();
    setLocal(KEYS.COUPONS, coupons.filter((c) => c.id !== id));
  }
};

// --- SERVIÇO DE INSIGHTS ---
export const dbInsights = {
  getHistory: async (): Promise<SavedInsight[]> => {
    if (db) {
      try {
        const q = query(collection(db, ...ROOT_PATH, 'insights'), orderBy('date', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        const history: SavedInsight[] = [];
        querySnapshot.forEach((snapshotDoc) => {
          history.push({ ...snapshotDoc.data(), id: snapshotDoc.id } as SavedInsight);
        });
        return history;
      } catch (e) {
        console.warn('Firestore error on insights history:', e);
      }
    }
    return getLocal(KEYS.INSIGHTS, []);
  },
  save: async (insight: SalesInsights): Promise<SavedInsight> => {
    const newEntry: SavedInsight = {
      id: `INS-${Date.now()}`,
      date: new Date().toISOString(),
      data: insight
    };

    const sanitized = sanitizeData(newEntry);

    if (db) {
      try {
        await setDoc(doc(db, ...ROOT_PATH, 'insights', sanitized.id), sanitized);
        return sanitized;
      } catch (e) {
        console.error('Error saving insight to Firestore:', e);
      }
    }

    const history = await dbInsights.getHistory();
    setLocal(KEYS.INSIGHTS, [sanitized, ...history]);
    return sanitized;
  },
  clear: async (): Promise<void> => {
    setLocal(KEYS.INSIGHTS, []);
  }
};

export interface LoyalCustomer {
  name: string;
  totalOrders: number;
  averageTicket: number;
  lastPurchase: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface GlobalSearchResult {
  id: string;
  label: string;
  type: 'clientes' | 'pedidos' | 'produtos';
  route: string;
}

export const dbLoyalCustomers = {
  getAll: async (): Promise<LoyalCustomer[]> => {
    const orders = await dbOrders.getAll();
    const grouped = orders.reduce<Record<string, LoyalCustomer>>((acc, order) => {
      const key = order.customerName || 'Cliente sem nome';
      if (!acc[key]) {
        acc[key] = {
          name: key,
          totalOrders: 0,
          averageTicket: 0,
          lastPurchase: order.createdAt
        };
      }

      const current = acc[key];
      current.totalOrders += 1;
      current.averageTicket += order.total;
      if (new Date(order.createdAt) > new Date(current.lastPurchase)) {
        current.lastPurchase = order.createdAt;
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .map((item) => ({ ...item, averageTicket: item.averageTicket / item.totalOrders }))
      .filter((item) => item.totalOrders >= 5)
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }
};

export const dbSatisfacao = {
  getAll: async (): Promise<ReviewItem[]> => {
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, ...ROOT_PATH, 'reviews'));
        const items: ReviewItem[] = [];
        querySnapshot.forEach((snapshotDoc) => {
          const payload = snapshotDoc.data() as Partial<ReviewItem>;
          items.push({
            id: snapshotDoc.id,
            author: payload.author || 'Cliente',
            stars: Number(payload.stars || 0),
            comment: payload.comment || '',
            createdAt: payload.createdAt || new Date().toISOString()
          });
        });
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (e) {
        console.warn('Firestore error on reviews, using mock data:', e);
      }
    }

    return [
      { id: 'review-1', author: 'Marina', stars: 5, comment: 'Entrega rápida e comida ótima!', createdAt: new Date().toISOString() },
      { id: 'review-2', author: 'João', stars: 4, comment: 'Gostei bastante.', createdAt: new Date(Date.now() - 86400000).toISOString() }
    ];
  }
};

export const dbGlobalSearch = {
  search: async (term: string): Promise<GlobalSearchResult[]> => {
    const normalized = term.trim().toLowerCase();
    if (normalized.length < 2) return [];

    const [orders, menu] = await Promise.all([dbOrders.getAll(), dbMenu.getAll()]);
    const customersMap = new Map<string, GlobalSearchResult>();

    orders.forEach((order) => {
      if (order.customerName.toLowerCase().includes(normalized)) {
        customersMap.set(order.customerName, {
          id: order.customerName,
          label: order.customerName,
          type: 'clientes',
          route: 'clientes-fieis'
        });
      }
    });

    const orderResults = orders
      .filter((order) => order.id.toLowerCase().includes(normalized))
      .slice(0, 5)
      .map((order) => ({ id: order.id, label: `Pedido ${order.id}`, type: 'pedidos' as const, route: 'orders' }));

    const productResults = menu
      .filter((item) => item.name.toLowerCase().includes(normalized))
      .slice(0, 5)
      .map((item) => ({ id: item.id, label: item.name, type: 'produtos' as const, route: 'menu' }));

    return [...Array.from(customersMap.values()).slice(0, 5), ...orderResults, ...productResults];
  }
};
