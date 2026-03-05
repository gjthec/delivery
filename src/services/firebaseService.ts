
import { IS_FIREBASE_ON } from '../constants';
import { db } from '../firebaseConfig';
import { deleteDoc, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { categoriesCollectionRef, couponsCollectionRef, menuCollectionRef, notificationsCollectionRef, storeSettingsDocRef } from '../firebase/firestore-paths';
import {
  AdminNotification,
  CartItem,
  CheckoutDetails,
  Category,
  MenuItem,
  NotificationPayload,
  NotificationType,
  OrderStatus
} from '../types';
import { createTenantOrder, getTenantOrdersByPhone } from './order.service';
import { getTenantId } from '../utils/tenant.util';

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefinedDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, currentValue]) => currentValue !== undefined)
      .map(([key, currentValue]) => [key, removeUndefinedDeep(currentValue)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function normalizeNotificationType(type: unknown): NotificationType {
  if (
    type === 'created' ||
    type === 'preparing' ||
    type === 'shipping' ||
    type === 'completed' ||
    type === 'cancelled' ||
    type === 'system' ||
    type === 'ai'
  ) {
    return type;
  }

  return 'system';
}

function normalizeNotificationPayload(payload: unknown): NotificationPayload | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  return payload as NotificationPayload;
}

function normalizeAdminNotification(id: string, raw: Record<string, unknown>): AdminNotification {
  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : 'Notificação',
    message: typeof raw.message === 'string' ? raw.message : '',
    time: typeof raw.time === 'string' ? raw.time : new Date().toISOString(),
    read: typeof raw.read === 'boolean' ? raw.read : false,
    type: normalizeNotificationType(raw.type),
    payload: normalizeNotificationPayload(raw.payload)
  };
}

/**
 * Interface para representar a estrutura de um pedido no banco de dados
 */
export interface FirebaseOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  customer?: {
    name: string;
    phone: string;
    address: CheckoutDetails['address'];
  };
  items: {
    menuItem: MenuItem;
    quantity: number;
    removedIngredients: string[];
    selectedExtras: { name: string; price: number }[];
    observations?: string;
  }[];
  total: number;
  payment: {
    method: CheckoutDetails['payment']['type'];
    brand?: CheckoutDetails['payment']['brand'];
    changeFor?: CheckoutDetails['payment']['changeFor'];
    total?: number;
  };
  address: CheckoutDetails['address'];
  status: OrderStatus;
  createdAt: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function toFirestorePhoneDocId(phone: string): string {
  return normalizePhone(phone);
}

export interface FirebaseCoupon {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscountValue?: number;
  active: boolean;
}

export interface FirebaseStoreSettings {
  deliveryFee: number;
}

function parseNumericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export function toFirebaseOrder(params: {
  id: string;
  customerName: string;
  details: CheckoutDetails;
  items: CartItem[];
  total: number;
  createdAt?: string;
}): FirebaseOrder {
  const { id, customerName, details, items, total, createdAt } = params;

  return {
    id,
    customerName: customerName || 'Cliente',
    customerPhone: details.customer?.phone || '',
    customer: details.customer ? {
      name: details.customer.name || 'Cliente',
      phone: details.customer.phone || '',
      address: {
        ...details.address,
        ...(details.address.complement ? { complement: details.address.complement } : {})
      }
    } : undefined,
    items: items.map((ci) => ({
      menuItem: ci.item,
      quantity: ci.quantity,
      removedIngredients: ci.removedIngredients,
      selectedExtras: ci.selectedExtras,
      observations: ci.observations || ''
    })),
    total,
    payment: {
      method: details.payment.type,
      ...(details.payment.brand ? { brand: details.payment.brand } : {}),
      ...(details.payment.changeFor ? { changeFor: details.payment.changeFor } : {}),
      total
    },
    address: {
      ...details.address,
      ...(details.address.complement ? { complement: details.address.complement } : {})
    },
    status: 'pending',
    createdAt: createdAt ?? new Date().toISOString()
  };
}

/**
 * Busca pedidos anteriores pelo número de telefone.
 */
export async function fetchOrdersByPhone(phone: string): Promise<FirebaseOrder[] | null> {
  if (!IS_FIREBASE_ON || !phone.trim()) return null;

  return getTenantOrdersByPhone(phone);
}

/**
 * Envia o pedido para o Firestore se a integração estiver ativa.
 */
export async function saveOrderToFirebase(orderData: FirebaseOrder): Promise<boolean> {
  if (!IS_FIREBASE_ON) {
    console.log('[Firebase] Integração desativada. Pedido processado localmente.');
    return true;
  }

  if (import.meta.env.DEV) {
    const maskedPhone = (orderData.customer?.phone || orderData.customerPhone || '').replace(/\D/g, '');
    console.log('[Firebase] Salvando pedido no tenant', {
      tenantId: getTenantId(),
      path: `deliveryuai/${getTenantId()}/orders/${orderData.id}`,
      orderId: orderData.id,
      customerPhoneMasked: maskedPhone ? `${maskedPhone.slice(0, 2)}***${maskedPhone.slice(-2)}` : ''
    });
  }

  return createTenantOrder(orderData);
}


function mapUserNotifications(snapshotDocs: Array<{ id: string; data: () => Record<string, unknown> }>): AdminNotification[] {
  return snapshotDocs
    .map((docSnap) => normalizeAdminNotification(docSnap.id, docSnap.data()))
    .filter((notification) => notification.type !== 'created')
    .sort((a, b) => {
      const timeA = Number.isNaN(Date.parse(a.time)) ? 0 : Date.parse(a.time);
      const timeB = Number.isNaN(Date.parse(b.time)) ? 0 : Date.parse(b.time);
      return timeB - timeA;
    });
}

export async function getUserNotificationsFromFirebase(): Promise<AdminNotification[]> {
  if (!IS_FIREBASE_ON) return [];

  try {
    const notificationsRef = notificationsCollectionRef(db);
    const snapshot = await getDocs(notificationsRef);

    return mapUserNotifications(
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        data: () => docSnap.data() as Record<string, unknown>
      }))
    );
  } catch (error) {
    console.error('[Firebase] Erro ao buscar notificações:', error);
    return [];
  }
}



export function subscribeToUserNotifications(onChange: (notifications: AdminNotification[]) => void): () => void {
  if (!IS_FIREBASE_ON) {
    onChange([]);
    return () => {};
  }

  const notificationsRef = notificationsCollectionRef(db);

  return onSnapshot(
    notificationsRef,
    (snapshot) => {
      const notifications = mapUserNotifications(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          data: () => docSnap.data() as Record<string, unknown>
        }))
      );

      onChange(notifications);
    },
    (error) => {
      console.error('[Firebase] Erro no listener de notificações:', error);
      onChange([]);
    }
  );
}

export async function clearUserNotificationsFromFirebase(notificationIds: string[]): Promise<boolean> {
  if (!IS_FIREBASE_ON || notificationIds.length === 0) return true;

  try {
    const notificationsRef = notificationsCollectionRef(db);

    await Promise.all(
      notificationIds.map((notificationId) => deleteDoc(doc(notificationsRef, notificationId)))
    );

    return true;
  } catch (error) {
    console.error('[Firebase] Erro ao limpar notificações:', error);
    return false;
  }
}

/**
 * Busca todos os itens do cardápio no Firestore.
 */
export async function fetchMenuFromFirebase(): Promise<MenuItem[] | null> {
  if (!IS_FIREBASE_ON) return null;

  try {
    const querySnapshot = await getDocs(menuCollectionRef(db));
    return querySnapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id
    } as MenuItem));
  } catch (error) {
    console.error('[Firebase] Erro ao buscar menu:', error);
    return [];
  }
}

/**
 * Busca todas as categorias no Firestore.
 */
export async function fetchCategoriesFromFirebase(): Promise<Category[] | null> {
  if (!IS_FIREBASE_ON) return null;

  try {
    const querySnapshot = await getDocs(categoriesCollectionRef(db));
    return querySnapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id
    } as Category));
  } catch (error) {
    console.error('[Firebase] Erro ao buscar categorias:', error);
    return [];
  }
}

/**
 * Busca um cupom no Firestore no tenant atual (deliveryuai/{tenantId}/coupons/{CODE}).
 */

export async function fetchCouponFromFirebase(code: string): Promise<FirebaseCoupon | null> {
  if (!IS_FIREBASE_ON) return null;

  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return null;

  try {
    const couponRef = doc(couponsCollectionRef(db), normalizedCode);
    const couponSnapshot = await getDoc(couponRef);

    if (!couponSnapshot.exists()) {
      return null;
    }

    const couponData = couponSnapshot.data() as Partial<FirebaseCoupon>;

    return {
      id: couponSnapshot.id,
      code: typeof couponData.code === 'string' ? couponData.code : couponSnapshot.id,
      discountPercentage: parseNumericValue(couponData.discountPercentage) ?? 0,
      maxDiscountValue: parseNumericValue(couponData.maxDiscountValue),
      active: typeof couponData.active === 'boolean' ? couponData.active : false
    };
  } catch (error) {
    console.error('[Firebase] Erro ao buscar cupom:', error);
    return null;
  }
}

/**
 * Escuta em tempo real as configurações da loja no tenant atual (deliveryuai/{tenantId}/settings/store).
 */
export function subscribeToStoreSettingsFromFirebase(onChange: (settings: FirebaseStoreSettings | null) => void): () => void {
  if (!IS_FIREBASE_ON) {
    onChange(null);
    return () => {};
  }

  const settingsRef = storeSettingsDocRef(db);

  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }

      const settingsData = snapshot.data() as Record<string, unknown>;
      const deliveryFee = parseNumericValue(settingsData.deliveryFee);

      if (deliveryFee === undefined) {
        onChange(null);
        return;
      }

      onChange({ deliveryFee });
    },
    (error) => {
      console.error('[Firebase] Erro no listener de configurações da loja:', error);
      onChange(null);
    }
  );
}

/**
 * Busca as configurações da loja no Firestore do tenant atual (deliveryuai/{tenantId}/settings/store).
 */
export async function fetchStoreSettingsFromFirebase(): Promise<FirebaseStoreSettings | null> {
  if (!IS_FIREBASE_ON) return null;

  try {
    const settingsRef = storeSettingsDocRef(db);
    const settingsSnapshot = await getDoc(settingsRef);

    if (!settingsSnapshot.exists()) {
      return null;
    }

    const settingsData = settingsSnapshot.data() as Record<string, unknown>;
    const deliveryFee = parseNumericValue(settingsData.deliveryFee);

    if (deliveryFee === undefined) {
      return null;
    }

    return { deliveryFee };
  } catch (error) {
    console.error('[Firebase] Erro ao buscar configurações da loja:', error);
    return null;
  }
}
