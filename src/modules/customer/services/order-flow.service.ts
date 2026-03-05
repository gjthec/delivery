import { IS_FIREBASE_ON } from '../../../constants';
import { CartItem, CheckoutDetails } from '../../../types';
import { saveOrderToFirebase, toFirebaseOrder } from '../../../services/firebaseService';
import { WHATSAPP_NUMBER } from '../constants/customer.constants';
import { getCompanyNameFromLocalSources } from '../../../hooks/useCompanyName';

export function sendWhatsAppMessage(details: CheckoutDetails, items: CartItem[], total: number) {
  const companyName = getCompanyNameFromLocalSources();

  let message = `*🍔 NOVO PEDIDO - ${companyName}*%0A%0A`;
  message += `*Itens do Pedido:*%0A`;
  items.forEach(ci => {
    if (ci.pizzaConfig) {
      const flavors = ci.pizzaConfig.segments.map((segment) => segment.flavorName).join(', ');
      const ingredients = (ci.pizzaConfig.ingredientsSummary || []).join(', ');
      message += `• ${ci.quantity}x ${ci.item.name} (${ci.pizzaConfig.sizeLabel}) - ${flavors}%0A`;
      if (ingredients) message += `   _Ingredientes: ${ingredients}_%0A`;
      if (ci.observations) message += `   _Obs: ${ci.observations}_%0A`;
      return;
    }

    const extras = ci.selectedExtras.length > 0 ? ` (+ ${ci.selectedExtras.map(e => e.name).join(', ')})` : '';
    const removed = ci.removedIngredients.length > 0 ? ` (sem ${ci.removedIngredients.join(', ')})` : '';
    message += `• ${ci.quantity}x ${ci.item.name}${extras}${removed}%0A`;
    if (ci.observations) message += `   _Obs: ${ci.observations}_%0A`;
  });

  message += `%0A*Endereço de Entrega:*%0A`;
  message += `${details.address.label}: ${details.address.street}, ${details.address.number}`;
  if (details.address.complement) message += ` (${details.address.complement})`;
  message += `%0A${details.address.neighborhood}, ${details.address.city}/${details.address.state}%0A`;

  message += `%0A*Pagamento:* ${details.payment.type.toUpperCase()}`;
  if (details.payment.brand) message += ` - Bandeira: ${details.payment.brand.toUpperCase()}`;
  if (details.payment.changeFor) message += `%0A*Troco para:* R$ ${details.payment.changeFor}`;

  if (details.customer) {
    message += `%0A%0A*Cliente:* ${details.customer.name}`;
    message += `%0A*Telefone:* ${details.customer.phone}`;
  }

  message += `%0A%0A*VALOR TOTAL: R$ ${total.toFixed(2)}*`;
  message += `%0A%0A_Enviado via ${companyName} App_`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}

export function generateOrderId() {
  return `PED-${Date.now().toString().slice(-6)}`;
}

export function calculateCartTotal(cart: CartItem[], deliveryFee: number) {
  const subtotal = cart.reduce((acc, ci) => {
    if (ci.pizzaConfig) {
      return acc + (ci.pizzaConfig.unitPriceComputed * ci.quantity);
    }

    const extrasTotal = ci.selectedExtras.reduce((ea, ec) => ea + ec.price, 0);
    return acc + ((ci.item.price + extrasTotal) * ci.quantity);
  }, 0);

  return subtotal + deliveryFee;
}

export async function processOrderToDatabase(orderId: string, details: CheckoutDetails, items: CartItem[], total: number) {
  const orderForDb = toFirebaseOrder({
    id: orderId,
    customerName: details.customer.name || 'Cliente',
    details,
    items,
    total
  });

  if (!IS_FIREBASE_ON) return true;
  return saveOrderToFirebase(orderForDb);
}
