import { SessionInterface } from "@shopify/shopify-api";
import {
  CollectionReference,
  FieldValue,
  getFirestore,
  Firestore,
} from "firebase-admin/firestore";

export interface StoreOptions {
  collection?: string;
}

export class FirebaseSessionStore {
  private db: Firestore;
  private collection: CollectionReference;
  constructor(options?: StoreOptions) {
    this.db = getFirestore();
    this.collection = this.db.collection(options?.collection || "sessions");
  }
  async storeCallback(session: SessionInterface): Promise<boolean> {
    try {
      await this.collection
        .doc(session.id)
        .set({ data: { ...session }, createdAt: FieldValue.serverTimestamp() });

      return true;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error("Unable to store session");
      }
    }
  }

  /*
    The loadCallback takes in the id, and uses the getAsync method to access the session data
     If a stored session exists, it's parsed and returned
     Otherwise, return undefined
  */
  async loadCallback(id: string): Promise<SessionInterface | undefined> {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return undefined;
      }
      const result = doc.data()?.data;
      return result ? result : undefined;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error("Unable to store session");
      }
    }
  }

  async deleteSessionsCallback(ids: string[]): Promise<boolean> {
    try {
      const snapshot = await this.collection.where("data.id", "in", ids).get();
      if (snapshot.size === 0) {
        return true;
      }
      const batch = this.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return true;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error("Unable to delete sessions");
      }
    }
  }

  async findSessionsByShopCallback(shop: string): Promise<SessionInterface[]> {
    try {
      const snapshot = await this.collection
        .where("data.shop", "==", shop)
        .get();
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map((doc) => doc.data()?.data);
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error("Unable to store session");
      }
    }
  }

  /*
    The deleteCallback takes in the id, and uses the redis `del` method to delete it from the store
    If the session can be deleted, return true
    Otherwise, return false
  */
  async deleteCallback(id: string): Promise<boolean> {
    try {
      return !!(await this.collection.doc(id).delete());
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error("Unable to store session");
      }
    }
  }
}
