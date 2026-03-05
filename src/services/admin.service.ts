import { addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { adminCollectionRef } from '../firebase/firestore-paths';

export async function createAdmin(data: Record<string, unknown>) {
  // Escrita sempre no tenant atual (localhost agora, subdomínio no futuro).
  const ref = adminCollectionRef(db);

  await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp()
  });
}
