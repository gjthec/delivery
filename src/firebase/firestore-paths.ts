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

export function tenantPathSegments() {
  return ['deliveryuai', getTenantId()] as const;
}

export function tenantCollectionPath(collectionName: string) {
  return ['deliveryuai', getTenantId(), collectionName] as const;
}
