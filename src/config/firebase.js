import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('[Firebase] Warning: Missing FIREBASE_SERVICE_ACCOUNT environment variable. Push notifications will not work.');
  } else if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized successfully");
  }
} catch (error) {
  console.error(
    "[Firebase] Admin SDK initialization failed:",
    error.message
  );
}

export const messaging = admin.apps.length ? admin.messaging() : null;
export default admin;
