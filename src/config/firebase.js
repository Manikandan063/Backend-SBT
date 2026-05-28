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
    
    // First replace literal \n with newlines and remove surrounding quotes
    let formatted = key.replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim();
    
    // If it's a single line (which often happens when pasting into Render's dashboard)
    if (formatted.includes('-----BEGIN PRIVATE KEY-----') && !formatted.includes('\n')) {
      const beginMarker = '-----BEGIN PRIVATE KEY-----';
      const endMarker = '-----END PRIVATE KEY-----';
      
      // Extract just the base64 content
      let keyContent = formatted.replace(beginMarker, '').replace(endMarker, '').trim();
      
      // Replace any spaces in the base64 content with newlines
      keyContent = keyContent.replace(/ /g, '\n');
      
      formatted = `${beginMarker}\n${keyContent}\n${endMarker}`;
    }
    
    return formatted;
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
