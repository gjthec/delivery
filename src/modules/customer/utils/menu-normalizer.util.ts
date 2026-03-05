import { getTenantId } from '../../../utils/tenant.util';
import { MenuItem as AppMenuItem } from '../../../types';
import { MenuItemSource, MenuItemExtra, PizzaPricingStrategy, PizzaSizeSource } from '../types/menu.types';

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



function normalizePizzaSizes(value: unknown): PizzaSizeSource[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((size) => {
      if (!size || typeof size !== 'object') return null;
      const payload = size as Record<string, unknown>;
      const id = String(payload.id ?? '').trim();
      const label = String(payload.label ?? '').trim();
      const basePrice = toNumber(payload.basePrice);
      const maxFlavors = toNumber(payload.maxFlavors);
      const slices = toNumber(payload.slices);

      if (!id || !label || basePrice === null || maxFlavors === null) return null;

      return {
        id,
        label,
        basePrice,
        maxFlavors: Math.max(1, Math.floor(maxFlavors)),
        slices
      };
    })
    .filter((item): item is PizzaSizeSource => Boolean(item));
}

function normalizePricingStrategy(value: unknown): PizzaPricingStrategy {
  if (
    value === 'highestFlavor'
    || value === 'averageFlavor'
    || value === 'fixedBySize'
  ) {
    return value;
  }

  return 'highestFlavor';
}



function normalizeFlavorIngredients(value: unknown): Array<{ id: string; name: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((ingredient) => {
      if (!ingredient || typeof ingredient !== 'object') return null;
      const payload = ingredient as Record<string, unknown>;
      const id = String(payload.id ?? '').trim();
      const name = String(payload.name ?? '').trim();
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((item): item is { id: string; name: string } => Boolean(item));
}

function normalizePriceDeltaBySize(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object') return null;

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([sizeId, delta]) => {
      const parsed = toNumber(delta);
      return parsed === null ? null : [String(sizeId), parsed] as const;
    })
    .filter((entry): entry is readonly [string, number] => Boolean(entry));

  if (entries.length === 0) return null;
  return Object.fromEntries(entries);
}

export function normalizePizzaFlavor(raw: unknown, fallbackId?: string) {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  const id = String(payload.id ?? fallbackId ?? '').trim();
  const name = String(payload.name ?? '').trim();
  if (!id || !name) return null;

  return {
    id,
    name,
    description: payload.description ? String(payload.description) : null,
    imageUrl: payload.imageUrl ? String(payload.imageUrl) : null,
    active: typeof payload.active === 'boolean' ? payload.active : true,
    tags: toStringArray(payload.tags),
    ingredients: normalizeFlavorIngredients(payload.ingredients),
    priceDeltaBySize: normalizePriceDeltaBySize(payload.priceDeltaBySize)
  };
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

  const itemType = item.type === 'pizza' ? 'pizza' : 'regular';

  return {
    id,
    type: itemType,
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
    active: typeof item.active === 'boolean' ? item.active : true,
    pricingStrategy: normalizePricingStrategy(item.pricingStrategy),
    sizes: normalizePizzaSizes(item.sizes)
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
    calories: undefined,
    type: item.type || 'regular',
    pricingStrategy: item.pricingStrategy,
    sizes: item.sizes
  };
}
