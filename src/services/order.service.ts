import { addDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  notificationDocRef,
  notificationsCollectionRef,
  orderDocRef,
  ordersCollectionRef,
  tenantCollectionPath
} from '../firebase/firestore-paths';
import { getTenantId } from '../utils/tenant.util';
import type { FirebaseOrder } from './firebaseService';

const isDev = import.meta.env.DEV;

function findUndefinedPaths(value: unknown, currentPath = ''): string[] {
  if (value === undefined) {
    return [currentPath || '<root>'];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findUndefinedPaths(item, `${currentPath}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      return findUndefinedPaths(nested, nextPath);
    });
  }

  return [];
}

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, currentValue]) => currentValue !== undefined)
      .map(([key, currentValue]) => [key, removeUndefinedDeep(currentValue)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function maskPhone(phone?: string): string {
  if (!phone) return '';
  const normalized = normalizePhone(phone);
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`;
}

function isMissingIndexError(error: unknown): boolean {
  return String((error as { message?: string })?.message || '').includes('The query requires an index');
}

function devLog(message: string, payload?: unknown) {
  if (!isDev) return;
  if (payload === undefined) {
    console.log(`[orders][tenant=${getTenantId()}] ${message}`);
    return;
  }
  console.log(`[orders][tenant=${getTenantId()}] ${message}`, payload);
}

export async function createTenantOrder(orderData: FirebaseOrder): Promise<boolean> {
  const tenantId = getTenantId();

  try {
    const rawOrderPayload = {
      ...orderData,
      tenantId,
      phone: orderData.customer?.phone || orderData.customerPhone || '',
      customerPhone: orderData.customerPhone || orderData.customer?.phone || '',
      updatedAt: serverTimestamp(),
      serverTimestamp: serverTimestamp()
    };

    const undefinedPaths = findUndefinedPaths(rawOrderPayload);
    if (isDev && undefinedPaths.length > 0) {
      console.warn('[orders] Campos undefined no payload do pedido:', undefinedPaths);
    }

    const orderPayload = removeUndefinedDeep(rawOrderPayload);

    devLog(`Gravando pedido em ${tenantCollectionPath('orders').join('/')}/${orderData.id}`, {
      orderId: orderData.id,
      customerPhone: maskPhone(orderPayload.customerPhone)
    });

    await setDoc(orderDocRef(db, orderData.id), orderPayload);

    const notification = removeUndefinedDeep({
      id: orderData.id,
      title: 'Pedido pendente',
      message: `Novo pedido pendente: ${orderData.id}`,
      time: new Date().toISOString(),
      read: false,
      type: 'created',
      payload: {
        orderId: orderData.id,
        status: 'pending',
        event: 'created'
      },
      serverTimestamp: serverTimestamp()
    });

    await setDoc(notificationDocRef(db, notification.id), notification);
    return true;
  } catch (error) {
    console.error('[orders] Erro ao gravar pedido no path multi-tenant:', error);
    return false;
  }
}

export async function getTenantOrdersByPhone(phone: string): Promise<FirebaseOrder[]> {
  const normalizedPhone = normalizePhone(phone);
  const ordersRef = ordersCollectionRef(db);
  const tenantPath = tenantCollectionPath('orders').join('/');

  devLog(`Buscando pedidos por telefone em ${tenantPath}`, { phone: maskPhone(phone) });

  try {
    const queries = [
      query(ordersRef, where('customer.phone', '==', phone), orderBy('createdAt', 'desc')),
      query(ordersRef, where('customerPhone', '==', phone), orderBy('createdAt', 'desc')),
      query(ordersRef, where('phone', '==', normalizedPhone), orderBy('createdAt', 'desc'))
    ];

    const snapshots = await Promise.all(queries.map((q) => getDocs(q)));
    const docs = snapshots.flatMap((snapshot) => snapshot.docs);

    const uniqueOrders = Array.from(new Map(docs.map((docSnap) => [docSnap.id, {
      ...(docSnap.data() as FirebaseOrder),
      id: docSnap.id
    }])).values());

    devLog('Quantidade de pedidos retornados na query', uniqueOrders.length);

    return uniqueOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    if (!isMissingIndexError(error)) {
      console.warn('[orders] Erro em query com índice, aplicando fallback local:', error);
    }

    const snapshot = await getDocs(ordersRef);
    const allOrders = snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as FirebaseOrder), id: docSnap.id }));

    const filtered = allOrders.filter((order) => {
      const phones = [order.customer?.phone, order.customerPhone, (order as FirebaseOrder & { phone?: string }).phone]
        .filter((value): value is string => Boolean(value))
        .map(normalizePhone);

      return phones.includes(normalizedPhone);
    });

    devLog('Quantidade de pedidos retornados no fallback', filtered.length);

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getTenantOrderById(orderId: string): Promise<FirebaseOrder | null> {
  const snapshot = await getDoc(doc(ordersCollectionRef(db), orderId));
  if (!snapshot.exists()) return null;
  return {
    ...(snapshot.data() as FirebaseOrder),
    id: snapshot.id
  };
}

export async function createOrder(payload: Omit<FirebaseOrder, 'id'>): Promise<string> {
  const tenantId = getTenantId();
  const ref = await addDoc(ordersCollectionRef(db), {
    ...payload,
    tenantId,
    phone: payload.customer?.phone || payload.customerPhone || '',
    customerPhone: payload.customerPhone || payload.customer?.phone || '',
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
    serverTimestamp: serverTimestamp()
  });

  devLog(`Pedido criado com addDoc em ${tenantCollectionPath('orders').join('/')}/${ref.id}`);
  return ref.id;
}

export async function getTenantNotifications() {
  const snapshot = await getDocs(notificationsCollectionRef(db));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}
