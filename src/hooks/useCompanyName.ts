import { useEffect, useMemo, useState } from 'react';
import { getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { storeSettingsDocRef } from '../firebase/firestore-paths';

export const COMPANY_NAME_FALLBACK = 'Configurar empresa';

function normalizeCompanyName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readCompanyNameFromPlatformSettingsStorage(): string | null {
  const rawSettings = localStorage.getItem('platform_settings_v1');
  if (!rawSettings) return null;

  try {
    const parsed = JSON.parse(rawSettings) as { companyName?: unknown };
    return normalizeCompanyName(parsed.companyName);
  } catch {
    return null;
  }
}

export function getCompanyNameFromLocalSources(): string {
  const localCompanyName = normalizeCompanyName(localStorage.getItem('foodai-company-name'));
  if (localCompanyName) return localCompanyName;

  const platformCompanyName = readCompanyNameFromPlatformSettingsStorage();
  if (platformCompanyName) return platformCompanyName;

  return COMPANY_NAME_FALLBACK;
}

export function useCompanyName() {
  const [companyName, setCompanyName] = useState<string>(() => getCompanyNameFromLocalSources());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncLocalFallback = () => {
      if (!mounted) return;
      setCompanyName(getCompanyNameFromLocalSources());
    };

    const unsubscribe = onSnapshot(
      storeSettingsDocRef(db),
      (snapshot) => {
        if (!mounted) return;

        const firestoreName = normalizeCompanyName(snapshot.data()?.companyName);
        const finalName = firestoreName || getCompanyNameFromLocalSources();

        localStorage.setItem('foodai-company-name', finalName);
        setCompanyName(finalName);
        setError(null);
        setIsLoading(false);
      },
      async () => {
        try {
          const snapshot = await getDoc(storeSettingsDocRef(db));
          const firestoreName = normalizeCompanyName(snapshot.data()?.companyName);
          const finalName = firestoreName || getCompanyNameFromLocalSources();

          localStorage.setItem('foodai-company-name', finalName);
          if (mounted) {
            setCompanyName(finalName);
            setError(null);
          }
        } catch (getError) {
          if (mounted) {
            setError(getError instanceof Error ? getError.message : 'Erro ao carregar empresa');
            setCompanyName(getCompanyNameFromLocalSources());
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    );

    window.addEventListener('foodai:company-updated', syncLocalFallback as EventListener);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('foodai:company-updated', syncLocalFallback as EventListener);
    };
  }, []);

  return useMemo(() => ({ companyName, isLoading, error }), [companyName, isLoading, error]);
}
