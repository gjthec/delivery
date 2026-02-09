import { IS_FIREBASE_ON } from '../constants';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CartItem, Address, PaymentType, CardBrand } from '../types';
/**
 * Interface para representar a estrutura de um pedido no banco de dados
 */
export interface FirebaseOrder {
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    customizations: {
      removed: string[];
      extras: string[];
      obs: string;
    };
  }[];
  customer: {
    name: string;
    phone: string;
    address: Address;
  };
  payment: {
    method: PaymentType;
    brand?: CardBrand;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
  createdAt: string;
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
    
    // Referência para a coleção "orders"
    const ordersRef = collection(db, "orders");
    
    // Adiciona o documento com timestamp do servidor para maior precisão
    await addDoc(ordersRef, {
      ...orderData,
      serverTimestamp: serverTimestamp()
    });

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
export async function syncMenuFromFirebase(): Promise<any[] | null> {
  if (!IS_FIREBASE_ON) return null;
  // Aqui você implementaria o getDocs para a coleção "menu"
  return [];
}
