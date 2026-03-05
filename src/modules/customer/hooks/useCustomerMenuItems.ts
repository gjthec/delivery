import { useEffect, useState } from 'react';
import { MenuItem } from '../../../types';
import { getMenuItems } from '../services/menu.service';

export function useCustomerMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await getMenuItems();
        if (!mounted) return;
        setItems(result);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : 'Erro ao carregar menu';
        setError(message);
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    items,
    loading,
    error
  };
}
