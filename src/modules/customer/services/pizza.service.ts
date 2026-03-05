import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { pizzaFlavorsCollectionRef, tenantPathSegments } from '../../../firebase/firestore-paths';
import { PizzaFlavor } from '../../../types';
import { normalizePizzaFlavor } from '../utils/menu-normalizer.util';

export async function listPizzaFlavors(): Promise<PizzaFlavor[]> {
  const sources = [
    pizzaFlavorsCollectionRef(db),
    collection(db, ...tenantPathSegments(), 'catalog', 'pizzaFlavors')
  ];

  for (const ref of sources) {
    try {
      const snapshot = await getDocs(ref);
      const flavors = snapshot.docs
        .map((docSnap) => normalizePizzaFlavor(docSnap.data(), docSnap.id))
        .filter((item): item is PizzaFlavor => Boolean(item));

      if (flavors.length > 0) return flavors;
    } catch {
      // tenta próximo path
    }
  }

  return [];
}

export async function getActivePizzaFlavors(): Promise<PizzaFlavor[]> {
  const flavors = await listPizzaFlavors();
  return flavors.filter((flavor) => flavor.active);
}
