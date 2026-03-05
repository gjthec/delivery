import { getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { pizzaFlavorsCollectionRef } from '../../../firebase/firestore-paths';
import { PizzaFlavor } from '../../../types';

export async function getActivePizzaFlavors(): Promise<PizzaFlavor[]> {
  const snapshot = await getDocs(pizzaFlavorsCollectionRef(db));
  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<PizzaFlavor, 'id'>) }))
    .filter((flavor) => flavor.active)
    .map((flavor) => ({
      ...flavor,
      tags: Array.isArray(flavor.tags) ? flavor.tags : [],
      priceDeltaBySize: flavor.priceDeltaBySize || null
    }));
}
