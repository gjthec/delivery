import { collection, doc, Firestore } from 'firebase/firestore';
import { getTenantId } from '../utils/tenant.util';

const ROOT_COLLECTION = 'deliveryuai';

export function tenantDocRef(db: Firestore) {
  return doc(db, ROOT_COLLECTION, getTenantId());
}

export function tenantCollection(db: Firestore, collectionName: string) {
  return collection(db, ROOT_COLLECTION, getTenantId(), collectionName);
}

export function tenantDoc(db: Firestore, collectionName: string, docId: string) {
  return doc(db, ROOT_COLLECTION, getTenantId(), collectionName, docId);
}

export const adminCollectionRef = (db: Firestore) => tenantCollection(db, 'admin');
export const userCollectionRef = (db: Firestore) => tenantCollection(db, 'user');
export const productsCollectionRef = (db: Firestore) => tenantCollection(db, 'products');
export const categoriesCollectionRef = (db: Firestore) => tenantCollection(db, 'categories');
export const bannersCollectionRef = (db: Firestore) => tenantCollection(db, 'banners');
export const couponsCollectionRef = (db: Firestore) => tenantCollection(db, 'coupons');

// Compatibilidade com dados antigos do cardápio.
export const menuCollectionRef = (db: Firestore) => tenantCollection(db, 'menu');

export const settingsDocRef = (db: Firestore) => tenantDoc(db, 'settings', 'general');
export const storeSettingsDocRef = (db: Firestore) => tenantDoc(db, 'settings', 'store');
export const businessDocRef = (db: Firestore) => tenantDoc(db, 'business', 'info');
export const deliverySettingsDocRef = (db: Firestore) => tenantDoc(db, 'deliverySettings', 'general');

export function tenantPathSegments() {
  return [ROOT_COLLECTION, getTenantId()] as const;
}

export function tenantCollectionPath(collectionName: string) {
  return [ROOT_COLLECTION, getTenantId(), collectionName] as const;
}
