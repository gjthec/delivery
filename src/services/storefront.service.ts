import {
  DocumentData,
  FirestoreError,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  bannersCollectionRef,
  businessDocRef,
  categoriesCollectionRef,
  deliverySettingsDocRef,
  menuCollectionRef,
  productsCollectionRef,
  settingsDocRef
} from '../firebase/firestore-paths';
import { Category, MenuItem } from '../types';

export interface StorefrontData {
  products: MenuItem[];
  categories: Category[];
  banners: Array<Record<string, unknown>>;
  settings: Record<string, unknown> | null;
  business: Record<string, unknown> | null;
  deliverySettings: Record<string, unknown> | null;
}

function mapDoc<T>(docSnap: QueryDocumentSnapshot<DocumentData>): T {
  return { ...docSnap.data(), id: docSnap.id } as T;
}

function isMissingIndexError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '');
  return message.includes('The query requires an index');
}

function sortByField(items: Array<Record<string, unknown>>, field: string, direction: 'asc' | 'desc' = 'asc') {
  return [...items].sort((a, b) => {
    const left = a[field];
    const right = b[field];

    if (typeof left === 'number' && typeof right === 'number') {
      return direction === 'asc' ? left - right : right - left;
    }

    const l = String(left ?? '');
    const r = String(right ?? '');
    const compare = l.localeCompare(r, 'pt-BR');
    return direction === 'asc' ? compare : -compare;
  });
}

function filterActive(items: Array<Record<string, unknown>>) {
  return items.filter((item) => item.active === true);
}

async function runCollectionQueryWithFallback<T>(
  queryFactory: () => ReturnType<typeof query>,
  collectionFactory: () => ReturnType<typeof productsCollectionRef>,
  clientSort: { field: string; direction?: 'asc' | 'desc' }
): Promise<T[]> {
  try {
    const snap = await getDocs(queryFactory());
    return snap.docs.map((docSnap) => mapDoc<T>(docSnap));
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    // Fallback temporário para ambiente local sem índice composto criado.
    const rawSnapshot = await getDocs(collectionFactory());
    const mapped = rawSnapshot.docs.map((docSnap) => mapDoc<T>(docSnap));
    const activeOnly = filterActive(mapped as Array<Record<string, unknown>>);
    return sortByField(activeOnly, clientSort.field, clientSort.direction) as T[];
  }
}

async function readProductsPreferingProductsCollection(): Promise<MenuItem[]> {
  const products = await runCollectionQueryWithFallback<MenuItem>(
    () => query(productsCollectionRef(db), where('active', '==', true), orderBy('name', 'asc')),
    () => productsCollectionRef(db),
    { field: 'name', direction: 'asc' }
  );

  if (products.length > 0) {
    return products;
  }

  // Compatibilidade temporária para tenants que ainda usam `menu`.
  return runCollectionQueryWithFallback<MenuItem>(
    () => query(menuCollectionRef(db), where('active', '==', true), orderBy('name', 'asc')),
    () => menuCollectionRef(db),
    { field: 'name', direction: 'asc' }
  );
}

export async function getStorefrontData(): Promise<StorefrontData> {
  const [products, categories, banners, settingsSnap, businessSnap, deliverySettingsSnap] = await Promise.all([
    readProductsPreferingProductsCollection(),
    runCollectionQueryWithFallback<Category>(
      () => query(categoriesCollectionRef(db), where('active', '==', true), orderBy('order', 'asc')),
      () => categoriesCollectionRef(db),
      { field: 'order', direction: 'asc' }
    ),
    runCollectionQueryWithFallback<Record<string, unknown>>(
      () => query(bannersCollectionRef(db), where('active', '==', true), orderBy('order', 'asc')),
      () => bannersCollectionRef(db),
      { field: 'order', direction: 'asc' }
    ),
    getDoc(settingsDocRef(db)),
    getDoc(businessDocRef(db)),
    getDoc(deliverySettingsDocRef(db))
  ]);

  return {
    products,
    categories,
    banners,
    settings: settingsSnap.exists() ? settingsSnap.data() : null,
    business: businessSnap.exists() ? businessSnap.data() : null,
    deliverySettings: deliverySettingsSnap.exists() ? deliverySettingsSnap.data() : null
  };
}

function subscribeWithIndexFallback<T>(
  queryFactory: () => ReturnType<typeof query>,
  collectionFactory: () => ReturnType<typeof productsCollectionRef>,
  onData: (items: T[]) => void,
  onError: (error: Error) => void,
  clientSort: { field: string; direction?: 'asc' | 'desc' }
): Unsubscribe {
  let fallbackUnsub: Unsubscribe | null = null;

  const unsubscribe = onSnapshot(
    queryFactory(),
    (snapshot: QuerySnapshot<DocumentData>) => {
      onData(snapshot.docs.map((docSnap) => mapDoc<T>(docSnap)));
    },
    (error: FirestoreError) => {
      if (!isMissingIndexError(error)) {
        onError(error);
        return;
      }

      if (!fallbackUnsub) {
        fallbackUnsub = onSnapshot(
          collectionFactory(),
          (snapshot) => {
            const mapped = snapshot.docs.map((docSnap) => mapDoc<T>(docSnap));
            const activeOnly = filterActive(mapped as Array<Record<string, unknown>>);
            onData(sortByField(activeOnly, clientSort.field, clientSort.direction) as T[]);
          },
          (fallbackError) => onError(fallbackError)
        );
      }
    }
  );

  return () => {
    unsubscribe();
    fallbackUnsub?.();
  };
}

export function subscribeToStorefrontData(
  onData: (data: Partial<StorefrontData>) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(
    subscribeWithIndexFallback<MenuItem>(
      () => query(productsCollectionRef(db), where('active', '==', true), orderBy('name', 'asc')),
      () => productsCollectionRef(db),
      (products) => onData({ products }),
      onError,
      { field: 'name', direction: 'asc' }
    )
  );

  unsubscribers.push(
    subscribeWithIndexFallback<Category>(
      () => query(categoriesCollectionRef(db), where('active', '==', true), orderBy('order', 'asc')),
      () => categoriesCollectionRef(db),
      (categories) => onData({ categories }),
      onError,
      { field: 'order', direction: 'asc' }
    )
  );

  unsubscribers.push(
    subscribeWithIndexFallback<Record<string, unknown>>(
      () => query(bannersCollectionRef(db), where('active', '==', true), orderBy('order', 'asc')),
      () => bannersCollectionRef(db),
      (banners) => onData({ banners }),
      onError,
      { field: 'order', direction: 'asc' }
    )
  );

  unsubscribers.push(
    onSnapshot(
      settingsDocRef(db),
      (snapshot) => onData({ settings: snapshot.exists() ? snapshot.data() : null }),
      (error) => onError(error)
    )
  );

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
