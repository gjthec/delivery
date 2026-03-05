import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { tenantPathSegments } from '../../../firebase/firestore-paths';
import { Ingredient, PizzaFlavor } from '../../../types';
import { normalizePizzaFlavor } from '../utils/menu-normalizer.util';

function catalogCollection(name: 'pizzaFlavors' | 'ingredients') {
  return collection(db, ...tenantPathSegments(), 'catalog', name);
}

function sanitizeIngredient(raw: unknown, fallbackId?: string): Ingredient | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  const id = String(payload.id ?? fallbackId ?? '').trim();
  const name = String(payload.name ?? '').trim();
  if (!id || !name) return null;

  return {
    id,
    name,
    active: typeof payload.active === 'boolean' ? payload.active : true,
    tags: Array.isArray(payload.tags) ? payload.tags.map((tag) => String(tag)).filter(Boolean) : [],
    allergens: Array.isArray(payload.allergens) ? payload.allergens.map((a) => String(a)).filter(Boolean) : null
  };
}

export async function listPizzaFlavors(): Promise<PizzaFlavor[]> {
  const snapshot = await getDocs(catalogCollection('pizzaFlavors'));
  return snapshot.docs
    .map((docSnap) => normalizePizzaFlavor(docSnap.data(), docSnap.id))
    .filter((item): item is PizzaFlavor => Boolean(item));
}

export async function listIngredients(): Promise<Ingredient[]> {
  const snapshot = await getDocs(catalogCollection('ingredients'));
  return snapshot.docs
    .map((docSnap) => sanitizeIngredient(docSnap.data(), docSnap.id))
    .filter((item): item is Ingredient => Boolean(item));
}

export async function saveIngredient(ingredient: Ingredient): Promise<void> {
  const payload: Ingredient = {
    id: ingredient.id,
    name: ingredient.name,
    active: ingredient.active !== false,
    tags: ingredient.tags || [],
    allergens: ingredient.allergens || null
  };

  await setDoc(doc(catalogCollection('ingredients'), payload.id), payload);
}

export async function savePizzaFlavor(flavor: PizzaFlavor): Promise<void> {
  const payload: PizzaFlavor = {
    id: flavor.id,
    name: flavor.name,
    description: flavor.description || null,
    imageUrl: flavor.imageUrl || null,
    active: flavor.active !== false,
    tags: flavor.tags || [],
    ingredients: Array.isArray(flavor.ingredients) ? flavor.ingredients : [],
    priceDeltaBySize: flavor.priceDeltaBySize || null
  };

  await setDoc(doc(catalogCollection('pizzaFlavors'), payload.id), payload);
}
