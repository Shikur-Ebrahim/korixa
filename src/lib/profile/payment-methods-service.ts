import {
  collection,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  writeBatch,
  addDoc,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase";
import { PaymentMethod } from "./types";
import { Unsubscribe } from "firebase/auth";

export function subscribePaymentMethods(
  uid: string,
  callback: (methods: PaymentMethod[]) => void
): Unsubscribe {
  const db = getClientFirestore();
  const q = query(
    collection(db, "users", uid, "paymentMethods")
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    
    const methods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PaymentMethod));
    
    // Sort locally: Defaults first, then by creation date descending
    methods.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.createdAt - a.createdAt;
    });

    callback(methods);
  }, (error) => {
    console.error("Failed to subscribe to payment methods:", error);
    callback([]);
  });
}

export async function addPaymentMethod(uid: string, methodData: Omit<PaymentMethod, "id" | "uid" | "createdAt" | "updatedAt">): Promise<string> {
  const db = getClientFirestore();
  const colRef = collection(db, "users", uid, "paymentMethods");
  
  // Check if it's the first method
  const q = query(colRef, where("isActive", "==", true));
  const snap = await getDocs(q);
  const isFirst = snap.empty;

  const now = Date.now();
  const newMethod = {
    ...methodData,
    uid,
    isDefault: methodData.isDefault || isFirst,
    createdAt: now,
    updatedAt: now
  };

  if (newMethod.isDefault) {
    // We need to unset other defaults
    await unsetOtherDefaults(uid);
  }

  const docRef = await addDoc(colRef, newMethod);
  return docRef.id;
}

export async function updatePaymentMethod(uid: string, methodId: string, updates: Partial<Omit<PaymentMethod, "id" | "uid" | "createdAt" | "updatedAt">>): Promise<void> {
  const db = getClientFirestore();
  const docRef = doc(db, "users", uid, "paymentMethods", methodId);
  
  if (updates.isDefault) {
    await unsetOtherDefaults(uid);
  }

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now()
  });
}

export async function deletePaymentMethod(uid: string, methodId: string): Promise<void> {
  const db = getClientFirestore();
  const docRef = doc(db, "users", uid, "paymentMethods", methodId);
  await deleteDoc(docRef);
}

export async function setDefaultPaymentMethod(uid: string, methodId: string): Promise<void> {
  await unsetOtherDefaults(uid);
  const db = getClientFirestore();
  const docRef = doc(db, "users", uid, "paymentMethods", methodId);
  await updateDoc(docRef, { 
    isDefault: true,
    updatedAt: Date.now()
  });
}

async function unsetOtherDefaults(uid: string) {
  const db = getClientFirestore();
  const colRef = collection(db, "users", uid, "paymentMethods");
  const q = query(colRef, where("isDefault", "==", true));
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.update(d.ref, { isDefault: false, updatedAt: Date.now() });
    });
    await batch.commit();
  }
}
