import { useCallback, useEffect, useState } from 'react';
import { FirebaseOrder } from '../services/firebaseService';
import { getUserPanelOrders } from '../services/user-panel.service';

export function useOrders(phone: string, enabled: boolean) {
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!enabled || !phone.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getUserPanelOrders({ phone });
      setOrders(result);
    } catch (err) {
      console.error('[useOrders] erro ao carregar pedidos:', err);
      setError('Não foi possível carregar os pedidos agora.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, phone]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    reload: loadOrders
  };
}
