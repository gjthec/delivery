import { collection, doc, Firestore } from 'firebase/firestore';
import { getTenantId } from '../utils/tenant.util';

export function tenantDocRef(db: Firestore) {
  const tenantId = getTenantId();
  return doc(db, 'deliveryuai', tenantId);
}

export function adminCollectionRef(db: Firestore) {
  const tenantId = getTenantId();
  return collection(db, 'deliveryuai', tenantId, 'admin');
}

export function userCollectionRef(db: Firestore) {
  const tenantId = getTenantId();
  return collection(db, 'deliveryuai', tenantId, 'user');
}

export function tenantCollection(db: Firestore, collectionName: string) {
  const tenantId = getTenantId();
  return collection(db, 'deliveryuai', tenantId, collectionName);
}

export function tenantDoc(db: Firestore, collectionName: string, docId: string) {
  const tenantId = getTenantId();
  return doc(db, 'deliveryuai', tenantId, collectionName, docId);
}

export function productsCollectionRef(db: Firestore) {
  return tenantCollection(db, 'products');
}

export function categoriesCollectionRef(db: Firestore) {
  return tenantCollection(db, 'categories');
}

export function bannersCollectionRef(db: Firestore) {
  return tenantCollection(db, 'banners');
}

export function menuCollectionRef(db: Firestore) {
  return tenantCollection(db, 'menu');
}

export function couponsCollectionRef(db: Firestore) {
  return tenantCollection(db, 'coupons');
}

export function settingsDocRef(db: Firestore) {
  return tenantDoc(db, 'settings', 'general');
}

export function storeSettingsDocRef(db: Firestore) {
  return tenantDoc(db, 'settings', 'store');
}

export function businessDocRef(db: Firestore) {
  return tenantDoc(db, 'business', 'info');
}

export function deliverySettingsDocRef(db: Firestore) {
  return tenantDoc(db, 'deliverySettings', 'general');
}

export function tenantPathSegments() {
  return ['deliveryuai', getTenantId()] as const;
}

export function tenantCollectionPath(collectionName: string) {
  return ['deliveryuai', getTenantId(), collectionName] as const;
}
