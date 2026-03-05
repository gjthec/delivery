import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTenantId } from '../utils/tenant.util';
import { EMPTY_STORE_SETTINGS, StoreSettings } from '../types/storeSettings';
import { getStoreSettings, subscribeStoreSettings } from '../services/storeSettings.service';

export const COMPANY_FALLBACK = 'Cadastre sua empresa';

type StoreSettingsState = {
  settings: StoreSettings;
  isLoading: boolean;
  error: string | null;
};

const settingsCache = new Map<string, StoreSettings>();

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function getCompanyDisplayName(settings: StoreSettings | null | undefined): string {
  return firstNonEmpty(
    settings?.companyName,
    settings?.storeName,
    settings?.businessName,
    settings?.brandName,
    settings?.name
  ) ?? COMPANY_FALLBACK;
}

export function useStoreSettings() {
  const tenantId = getTenantId();
  const cached = settingsCache.get(tenantId);

  const [state, setState] = useState<StoreSettingsState>({
    settings: cached ?? EMPTY_STORE_SETTINGS,
    isLoading: !cached,
    error: null
  });

  const applySettings = useCallback((settings: StoreSettings) => {
    settingsCache.set(tenantId, settings);
    localStorage.setItem('foodai-company-name', getCompanyDisplayName(settings));
    setState({ settings, isLoading: false, error: null });
  }, [tenantId]);

  const load = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const fresh = await getStoreSettings(tenantId);
      applySettings(fresh);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar configurações da loja'
      }));
    }
  }, [applySettings, tenantId]);

  useEffect(() => {
    let mounted = true;

    if (!settingsCache.has(tenantId)) {
      getStoreSettings(tenantId)
        .then((fresh) => {
          if (!mounted) return;
          applySettings(fresh);
        })
        .catch((error) => {
          if (!mounted) return;
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao carregar configurações da loja'
          }));
        });
    }

    const unsubscribe = subscribeStoreSettings(
      tenantId,
      (settings) => {
        if (!mounted) return;
        applySettings(settings);
      },
      (error) => {
        if (!mounted) return;
        setState((prev) => ({ ...prev, isLoading: false, error: error.message || 'Erro ao sincronizar configurações da loja' }));
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [applySettings, tenantId]);

  const companyDisplayName = useMemo(() => getCompanyDisplayName(state.settings), [state.settings]);

  return {
    settings: state.settings,
    companyDisplayName,
    isLoading: state.isLoading,
    error: state.error,
    refresh: load
  };
}
