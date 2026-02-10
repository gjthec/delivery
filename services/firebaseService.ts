
import { IS_FIREBASE_ON } from '../constants';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { CartItem, Address, PaymentType, CardBrand, MenuItem, Category } from '../types';

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
    console.log("[Firebase] Integração desativada no momento (IS_FIREBASE_ON = false).");
    return true; 
  }

  try {
    const ordersRef = collection(db, "orders");
    await addDoc(ordersRef, {
      ...orderData,
      serverTimestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("[Firebase] Erro ao salvar pedido:", error);
    return false;
  }
}

/**
 * Busca todos os itens do cardápio no Firestore.
 */
export async function fetchMenuFromFirebase(): Promise<MenuItem[] | null> {
  if (!IS_FIREBASE_ON) return null;
  try {
    const querySnapshot = await getDocs(collection(db, "menu"));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id // Usa o ID do documento do Firestore
    } as MenuItem));
  } catch (error) {
    console.error("[Firebase] Erro ao buscar menu:", error);
    return null;
  }
}

/**
 * Busca todas as categorias no Firestore.
 */
export async function fetchCategoriesFromFirebase(): Promise<Category[] | null> {
  if (!IS_FIREBASE_ON) return null;
  try {
    const querySnapshot = await getDocs(collection(db, "categories"));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Category));
  } catch (error) {
    console.error("[Firebase] Erro ao buscar categorias:", error);
    return null;
  }
}
