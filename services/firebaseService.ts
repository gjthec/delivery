import { IS_FIREBASE_ON } from '../constants';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { CartItem, CheckoutDetails, MenuItem } from '../types';

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefinedDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, currentValue]) => currentValue !== undefined)
      .map(([key, currentValue]) => [key, removeUndefinedDeep(currentValue)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

/**
 * Interface para representar a estrutura de um pedido no banco de dados
 */
export interface FirebaseOrder {
  id: string;
  customerName: string;
  items: {
    menuItem: MenuItem;
    quantity: number;
    removedIngredients: string[];
    selectedExtras: { name: string; price: number }[];
    observations?: string;
  }[];
  total: number;
  payment: {
    method: CheckoutDetails['payment']['type'];
    brand?: CheckoutDetails['payment']['brand'];
    changeFor?: CheckoutDetails['payment']['changeFor'];
  };
  address: CheckoutDetails['address'];
  status: 'pending' | 'preparing' | 'shipping' | 'completed' | 'cancelled';
  createdAt: string;
}


export function toFirebaseOrder(params: {
  id: string;
  customerName: string;
  details: CheckoutDetails;
  items: CartItem[];
  total: number;
  createdAt?: string;
}): FirebaseOrder {
  const { id, customerName, details, items, total, createdAt } = params;

  return {
    id,
    customerName,
    items: items.map((ci) => ({
      menuItem: ci.item,
      quantity: ci.quantity,
      removedIngredients: ci.removedIngredients,
      selectedExtras: ci.selectedExtras,
      observations: ci.observations
    })),
    total,
    payment: {
      method: details.payment.type,
      ...(details.payment.brand ? { brand: details.payment.brand } : {}),
      ...(details.payment.changeFor ? { changeFor: details.payment.changeFor } : {})
    },
    address: {
      ...details.address,
      ...(details.address.complement ? { complement: details.address.complement } : {})
    },
    status: 'pending',
    createdAt: createdAt ?? new Date().toISOString()
  };
}

/**
 * Envia o pedido para o Firestore se a integração estiver ativa.
 */
export async function saveOrderToFirebase(orderData: FirebaseOrder): Promise<boolean> {
  if (!IS_FIREBASE_ON) {
    console.log("[Firebase] Integração desativada. Pedido processado localmente.");
    return true; 
  }

  try {
    console.log("[Firebase] Gravando pedido no Firestore...");
    // Referência para a coleção "foodai/admin/orders"
    const ordersRef = collection(db, "foodai", "admin", "orders");
    
    // Adiciona o documento com timestamp do servidor para maior precisão
    await addDoc(ordersRef, removeUndefinedDeep({
      ...orderData,
      serverTimestamp: serverTimestamp()
    }));

    console.log("[Firebase] Pedido salvo com sucesso!");
    return true;
  } catch (error) {
    console.error("[Firebase] Erro ao salvar pedido:", error);
    return false;
  }
}

/**
 * Futura função para sincronizar estoque do painel administrativo
 */
export async function syncMenuFromFirebase(): Promise<MenuItem[] | null> {
  if (!IS_FIREBASE_ON) return null;

  try {
    const menuRef = collection(db, 'foodai', 'admin', 'menu');
    const snapshot = await getDocs(menuRef);

    const menuItems: MenuItem[] = snapshot.docs
      .map((docSnap) => {
        const rawDoc = docSnap.data() as Record<string, any>;
        const source = rawDoc.item ?? rawDoc;

        if (!source?.name || typeof source.price !== 'number') {
          return null;
        }

        const normalizedSize = source.size === 'P' || source.size === 'M' || source.size === 'G'
          ? source.size
          : 'M';

        return {
          id: source.id ?? docSnap.id,
          name: source.name,
          category: source.category ?? 'Outros',
          price: source.price,
          originalPrice: source.originalPrice,
          rating: source.rating ?? 0,
          preparationTime: source.preparationTime ?? 'N/A',
          imageUrl: source.imageUrl ?? '',
          description: source.description ?? '',
          size: normalizedSize,
          tags: Array.isArray(source.tags) ? source.tags : [],
          calories: source.calories,
          ingredients: Array.isArray(source.ingredients) ? source.ingredients : [],
          extras: Array.isArray(source.extras)
            ? source.extras
                .filter((extra: any) => extra?.name && typeof extra?.price === 'number')
                .map((extra: any) => ({ name: extra.name, price: extra.price }))
            : []
        } satisfies MenuItem;
      })
      .filter((item): item is MenuItem => item !== null);

    return menuItems;
  } catch (error) {
    console.error('[Firebase] Erro ao sincronizar menu:', error);
    return null;
  }
}
