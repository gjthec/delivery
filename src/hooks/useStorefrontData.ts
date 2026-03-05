import { useEffect, useState } from 'react';
import { CATEGORIES, MENU_ITEMS } from '../constants';
import { getStorefrontData, StorefrontData, subscribeToStorefrontData } from '../services/storefront.service';

const EMPTY_DATA: StorefrontData = {
  products: [],
  categories: [],
  banners: [],
  settings: null,
  business: null,
  deliverySettings: null
};

export function useStorefrontData() {
  const [data, setData] = useState<StorefrontData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const result = await getStorefrontData();
        if (!mounted) return;

        const hasFirestoreData = result.products.length > 0 || result.categories.length > 0;

        setData(hasFirestoreData ? result : {
          ...result,
          products: MENU_ITEMS,
          categories: CATEGORIES
        });
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar loja');
        setData({
          ...EMPTY_DATA,
          products: MENU_ITEMS,
          categories: CATEGORIES
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    const unsubscribe = subscribeToStorefrontData(
      (partial) => {
        if (!mounted) return;
        setData((current) => ({ ...current, ...partial }));
      },
      (snapshotError) => {
        if (!mounted) return;
        setError(snapshotError.message || 'Erro ao sincronizar loja');
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { data, loading, error };
}
