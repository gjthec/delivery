import { addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { userCollectionRef } from '../firebase/firestore-paths';

export async function createUser(data: Record<string, unknown>) {
  const ref = userCollectionRef(db);

  await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp()
  });
}
