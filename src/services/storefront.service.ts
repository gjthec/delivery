import { DocumentData, QueryDocumentSnapshot, Unsubscribe, getDoc, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  bannersCollectionRef,
  businessDocRef,
  categoriesCollectionRef,
  deliverySettingsDocRef,
  menuCollectionRef,
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
  return {
    ...docSnap.data(),
    id: docSnap.id
  } as T;
}

export async function getStorefrontData(): Promise<StorefrontData> {
  const productsQ = query(menuCollectionRef(db), where('active', '==', true), orderBy('name'));
  const categoriesQ = query(categoriesCollectionRef(db), where('active', '==', true), orderBy('order', 'asc'));
  const bannersQ = query(bannersCollectionRef(db), where('active', '==', true), orderBy('order', 'asc'));

  const [productsSnap, categoriesSnap, bannersSnap, settingsSnap, businessSnap, deliverySettingsSnap] = await Promise.all([
    getDocs(productsQ),
    getDocs(categoriesQ),
    getDocs(bannersQ),
    getDoc(settingsDocRef(db)),
    getDoc(businessDocRef(db)),
    getDoc(deliverySettingsDocRef(db))
  ]);

  return {
    products: productsSnap.docs.map((docSnap) => mapDoc<MenuItem>(docSnap)),
    categories: categoriesSnap.docs.map((docSnap) => mapDoc<Category>(docSnap)),
    banners: bannersSnap.docs.map((docSnap) => mapDoc<Record<string, unknown>>(docSnap)),
    settings: settingsSnap.exists() ? settingsSnap.data() : null,
    business: businessSnap.exists() ? businessSnap.data() : null,
    deliverySettings: deliverySettingsSnap.exists() ? deliverySettingsSnap.data() : null
  };
}

export function subscribeToStorefrontData(
  onData: (data: Partial<StorefrontData>) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(
    onSnapshot(query(menuCollectionRef(db), where('active', '==', true), orderBy('name')), (snapshot) => {
      onData({ products: snapshot.docs.map((docSnap) => mapDoc<MenuItem>(docSnap)) });
    }, (error) => onError(error))
  );

  unsubscribers.push(
    onSnapshot(query(categoriesCollectionRef(db), where('active', '==', true), orderBy('order', 'asc')), (snapshot) => {
      onData({ categories: snapshot.docs.map((docSnap) => mapDoc<Category>(docSnap)) });
    }, (error) => onError(error))
  );

  unsubscribers.push(
    onSnapshot(settingsDocRef(db), (snapshot) => {
      onData({ settings: snapshot.exists() ? snapshot.data() : null });
    }, (error) => onError(error))
  );

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
