import { getTenantId } from '../../../utils/tenant.util';
import { MenuItem as AppMenuItem } from '../../../types';
import { MenuItemSource, MenuItemExtra } from '../types/menu.types';

const isDev = import.meta.env.DEV;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function normalizeExtras(value: unknown): MenuItemExtra[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((extra) => {
      if (!extra || typeof extra !== 'object') return null;
      const payload = extra as Record<string, unknown>;
      const name = String(payload.name ?? '').trim();
      const price = toNumber(payload.price);

      if (!name) return null;

      return {
        name,
        price: price ?? 0
      };
    })
    .filter((item): item is MenuItemExtra => Boolean(item));
}

function normalizeSingleItem(raw: unknown, fallbackId?: string): MenuItemSource | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;
  const id = String(item.id ?? fallbackId ?? '').trim();
  const name = String(item.name ?? '').trim();
  const description = String(item.description ?? 'Sem descrição').trim();
  const category = String(item.category ?? 'Sem categoria').trim();
  const price = toNumber(item.price);

  if (!id || !name || price === null) {
    return null;
  }

  return {
    id,
    name,
    description,
    category,
    price,
    originalPrice: toNumber(item.originalPrice),
    costPrice: toNumber(item.costPrice),
    imageUrl: item.imageUrl ? String(item.imageUrl) : null,
    ingredients: toStringArray(item.ingredients),
    extras: normalizeExtras(item.extras),
    preparationTime: item.preparationTime ? String(item.preparationTime) : null,
    rating: toNumber(item.rating),
    size: item.size ? String(item.size) : null,
    tags: toStringArray(item.tags),
    active: typeof item.active === 'boolean' ? item.active : true
  };
}

function findArrayInWrapper(input: Record<string, unknown>): unknown[] | null {
  const candidateKeys = ['data', 'items', 'menu', 'infos', 'documents', 'docs'];

  for (const key of candidateKeys) {
    const candidate = input[key];
    if (Array.isArray(candidate)) return candidate;

    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.docs)) return nested.docs;
      if (Array.isArray(nested.documents)) return nested.documents;
    }
  }

  return null;
}

export function normalizeMenuPayload(raw: unknown): MenuItemSource[] {
  if (isDev) {
    console.log(`[customer-menu][tenant=${getTenantId()}] payload bruto`, raw);
  }

  let normalized: MenuItemSource[] = [];

  if (Array.isArray(raw)) {
    normalized = raw
      .map((item) => normalizeSingleItem(item))
      .filter((item): item is MenuItemSource => Boolean(item));
  } else if (raw && typeof raw === 'object') {
    const payload = raw as Record<string, unknown>;

    const firestoreLikeDocs = payload.docs;
    if (Array.isArray(firestoreLikeDocs)) {
      normalized = firestoreLikeDocs
        .map((docPayload) => {
          if (!docPayload || typeof docPayload !== 'object') return null;
          const docObj = docPayload as { id?: string; data?: Record<string, unknown> };
          return normalizeSingleItem(docObj.data ?? docObj, docObj.id);
        })
        .filter((item): item is MenuItemSource => Boolean(item));
    }

    if (normalized.length === 0) {
      const wrappedArray = findArrayInWrapper(payload);
      if (wrappedArray) {
        normalized = wrappedArray
          .map((item) => normalizeSingleItem(item))
          .filter((item): item is MenuItemSource => Boolean(item));
      }
    }

    if (normalized.length === 0) {
      normalized = Object.entries(payload)
        .map(([key, value]) => normalizeSingleItem(value, key))
        .filter((item): item is MenuItemSource => Boolean(item));
    }
  }

  const activeOnly = normalized.filter((item) => item.active);

  if (isDev) {
    console.log(`[customer-menu][tenant=${getTenantId()}] payload normalizado`, activeOnly);
  }

  return activeOnly;
}

export function toAppMenuItem(item: MenuItemSource): AppMenuItem {
  return {
    ...item,
    imageUrl: item.imageUrl || '',
    calories: undefined
  };
}
