import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseAdmin;

try {
  // Use service account credentials from environment variables or a JSON file
  // For production, it's better to use environment variables
  // Format the private key properly by handling potential escaping issues from environment variables
  const formatPrivateKey = (key) => {
    if (!key) return undefined;
    
    try {
      // 1. Remove surrounding quotes if they exist
      let formatted = key.replace(/^"|"$/g, '').trim();
      
      // 2. Replace literal string "\n" with actual newline character
      formatted = formatted.replace(/\\n/g, '\n');
      
      // 3. Handle single-line strings with spaces instead of newlines
      // (This is common when environment variables are pasted incorrectly)
      if (formatted.includes('-----BEGIN PRIVATE KEY-----') && !formatted.includes('\n')) {
         // Extract the base64 string by removing headers and any extra spaces
         let base64Part = formatted
           .replace('-----BEGIN PRIVATE KEY-----', '')
           .replace('-----END PRIVATE KEY-----', '')
           .replace(/\s+/g, ''); // Remove all spaces and whitespace
           
         // Break into chunks of 64 characters (standard PEM format)
         const chunks = base64Part.match(/.{1,64}/g);
         if (chunks) {
           formatted = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----`;
         }
      }
      
      return formatted;
    } catch (err) {
      console.error("Error formatting private key:", err.message);
      return key;
    }
  };

  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  };

  if (!admin.apps.length) {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase] Admin SDK initialized successfully');
  } else {
    firebaseAdmin = admin.app();
  }
} catch (error) {
  console.error('[Firebase] Admin SDK initialization failed:', error.message);
}

export default admin;
