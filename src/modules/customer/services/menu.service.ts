import { doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { getTenantId } from '../../../utils/tenant.util';
import { menuCollectionRef } from '../../../firebase/firestore-paths';
import { MENU_COLLECTION, MENU_DEV_TENANT, MENU_HTTP_SOURCE, MENU_ROOT_COLLECTION } from '../constants/menu.constants';
import { normalizeMenuPayload, toAppMenuItem } from '../utils/menu-normalizer.util';
import { MenuItem } from '../../../types';

const isDev = import.meta.env.DEV;

async function fetchFromFirestore(menuId?: string): Promise<unknown> {
  if (menuId) {
    const tenantId = getTenantId() || MENU_DEV_TENANT;
    const itemRef = doc(db, MENU_ROOT_COLLECTION, tenantId, MENU_COLLECTION, menuId);
    const snapshot = await getDoc(itemRef);
    return snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [];
  }

  const snapshot = await getDocs(menuCollectionRef(db));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

async function fetchFromHttp(menuId?: string): Promise<unknown> {
  const endpoint = menuId ? `${MENU_HTTP_SOURCE}/${menuId}` : MENU_HTTP_SOURCE;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Falha ao buscar menu HTTP (${response.status})`);
  }
  return response.json();
}

export async function getMenuItems(menuId?: string): Promise<MenuItem[]> {
  let rawPayload: unknown;

  try {
    rawPayload = await fetchFromFirestore(menuId);
  } catch (firestoreError) {
    if (isDev) {
      console.warn('[customer-menu] Falha na leitura via Firestore, tentando fallback HTTP local.', firestoreError);
    }

    rawPayload = await fetchFromHttp(menuId);
  }

  const normalized = normalizeMenuPayload(rawPayload);
  return normalized.map(toAppMenuItem);
}
