import { MenuItem, PizzaFlavor, PizzaSizeOption } from '../../../types';

interface ComputePizzaPriceInput {
  baseItem: MenuItem;
  sizeId: string;
  selectedFlavors: PizzaFlavor[];
}

export function getPizzaSize(baseItem: MenuItem, sizeId: string): PizzaSizeOption | null {
  const sizes = baseItem.sizes || [];
  return sizes.find((size) => size.id === sizeId) || null;
}

export function computePizzaPrice({ baseItem, sizeId, selectedFlavors }: ComputePizzaPriceInput): number {
  const size = getPizzaSize(baseItem, sizeId);
  if (!size) return baseItem.price || 0;

  const strategy = baseItem.pricingStrategy || 'highestFlavor';
  const deltas = selectedFlavors.map((flavor) => {
    const rawDelta = flavor.priceDeltaBySize?.[sizeId];
    return Number.isFinite(rawDelta) ? Number(rawDelta) : 0;
  });

  if (strategy === 'fixedBySize') return size.basePrice;
  if (deltas.length === 0) return size.basePrice;

  if (strategy === 'averageFlavor') {
    const total = deltas.reduce((acc, delta) => acc + delta, 0);
    return size.basePrice + (total / deltas.length);
  }

  return size.basePrice + Math.max(...deltas);
}
