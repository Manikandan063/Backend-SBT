import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseAdmin;

try {
  // Use service account credentials from environment variables or a JSON file
  // For production, it's better to use environment variables

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn('[Firebase] Warning: Missing Firebase environment variables. Push notifications will not work.');
  } else {
    const serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!admin.apps.length) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase] Admin SDK initialized successfully');
    } else {
      firebaseAdmin = admin.app();
    }
  }
} catch (error) {
  console.error('[Firebase] Admin SDK initialization failed:', error.message);
}

export default admin;
