import { useMemo } from 'react';
import { COMPANY_FALLBACK, useStoreSettings } from './useStoreSettings';

export const COMPANY_NAME_FALLBACK = COMPANY_FALLBACK;

export function getCompanyNameFromLocalSources(): string {
  try {
    const raw = localStorage.getItem('foodai-company-name');
    if (raw && raw.trim()) return raw.trim();
  } catch {
    // no-op
  }

  return COMPANY_NAME_FALLBACK;
}

export function useCompanyName() {
  const { companyDisplayName, isLoading, error } = useStoreSettings();

  return useMemo(() => ({
    companyName: companyDisplayName,
    isLoading,
    error
  }), [companyDisplayName, isLoading, error]);
}
