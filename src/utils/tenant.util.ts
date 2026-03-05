export function getTenantId(): string {
  const envTenant = import.meta.env.VITE_TENANT_ID as string | undefined;
  if (envTenant?.trim()) {
    return envTenant.trim();
  }

  // SSR/ambientes sem window: manter tenant padrão local.
  if (typeof window === 'undefined') return 'localhost';

  const host = window.location.hostname;

  // Modo localhost-first (obrigatório agora).
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    return 'localhost';
  }

  // Preparado para subdomínio no futuro (ex.: pizzaria.deliveryuai.com).
  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  // Fallback seguro para não quebrar leituras/escritas.
  return 'localhost';
}
