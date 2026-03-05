export function getTenantId(): string {
  if (typeof window === 'undefined') return 'localhost';

  const host = window.location.hostname;

  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    return 'localhost';
  }

  const parts = host.split('.');

  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain && subdomain !== 'www') return subdomain;
  }

  return 'localhost';
}
