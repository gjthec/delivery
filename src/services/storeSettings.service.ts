import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { StoreSettings } from '../types/storeSettings';

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toStoreSettings(raw: Record<string, unknown> | null): StoreSettings {
  return {
    companyName: normalizeNullableString(raw?.companyName),
    storeName: normalizeNullableString(raw?.storeName),
    businessName: normalizeNullableString(raw?.businessName),
    name: normalizeNullableString(raw?.name),
    brandName: normalizeNullableString(raw?.brandName),
    logoUrl: normalizeNullableString(raw?.logoUrl),
    raw: raw ? (raw as Record<string, any>) : null
  };
}

function storeSettingsDocRefByTenant(tenantId: string) {
  return doc(db, 'deliveryuai', tenantId, 'settings', 'store');
}

export async function getStoreSettings(tenantId: string): Promise<StoreSettings> {
  const snapshot = await getDoc(storeSettingsDocRefByTenant(tenantId));
  const raw = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return toStoreSettings(raw);
}

export function subscribeStoreSettings(
  tenantId: string,
  onChange: (settings: StoreSettings) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    storeSettingsDocRefByTenant(tenantId),
    (snapshot) => {
      const raw = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
      onChange(toStoreSettings(raw));
    },
    (error) => {
      onError?.(error);
    }
  );
}
