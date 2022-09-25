import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// const serviceAccount = require('./path/to/serviceAccountKey.json');

export const setupFirebase = () => {
  initializeApp({
    // credential: cert(serviceAccount),
  });

};
