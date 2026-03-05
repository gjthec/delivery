import type { FirebaseOrder } from './firebaseService';
import { getTenantOrdersByPhone } from './order.service';
import { getTenantId } from '../utils/tenant.util';

const isDev = import.meta.env.DEV;

export async function getUserPanelOrders(params: { userId?: string; phone?: string }): Promise<FirebaseOrder[]> {
  const { phone } = params;

  if (isDev) {
    console.log('[user-panel] filtros aplicados', {
      tenantId: getTenantId(),
      userId: params.userId || null,
      phoneMasked: phone ? `${phone.slice(0, 2)}***${phone.slice(-2)}` : null
    });
  }

  if (!phone?.trim()) {
    return [];
  }

  return getTenantOrdersByPhone(phone);
}
