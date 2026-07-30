const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');

let isFirebaseInitialized = false;
let serviceAccount = null;

// 1. Try to load from environment variable
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // Check if it's a JSON string
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    // If not a JSON string, check if it's a file path
    try {
      const filePath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (fs.existsSync(filePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (err) {
      // Ignore and fallback
    }
  }
}

// 2. If not loaded yet, check for the specific file in the project root
if (!serviceAccount) {
  const defaultPath = path.join(process.cwd(), 'rahala-b668e-firebase-adminsdk-fbsvc-6b692371eb.json');
  if (fs.existsSync(defaultPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Failed to parse service account JSON file:', e.message);
    }
  }
}

if (serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully.');
  } catch (e) {
    console.warn('⚠️  Firebase service account invalid. Using fallback auth & mock messaging:', e.message);
  }
} else {
  console.warn('⚠️  No Firebase service account credentials found. Using fallback auth & mock messaging.');
}


/**
 * Verifies Google / Firebase ID Token.
 * @param {string} idToken
 * @returns {Promise<{ email: string, name: string, picture: string }>}
 */
const verifyGoogleToken = async (idToken) => {
  if (isFirebaseInitialized) {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return {
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email.split('@')[0],
      picture: decodedToken.picture || '',
    };
  }

  // Fallback for development/testing if Firebase credentials are not set in .env
  const jwt = require('jsonwebtoken');
  const decoded = jwt.decode(idToken);
  if (decoded && decoded.email) {
    return {
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
      picture: decoded.picture || '',
    };
  }

  throw new Error('Invalid Firebase ID Token format.');
};

/**
 * Sends FCM Push Notification to single or multiple device tokens
 * @param {string[]} tokens Array of FCM device tokens
 * @param {string} title
 * @param {string} body
 * @param {object} data Payload object
 */
const sendFCMMulticast = async (tokens = [], title, body, data = {}) => {
  if (!tokens || tokens.length === 0) return;

  const stringData = {};
  for (const key in data) {
    stringData[key] = String(data[key]);
  }

  if (isFirebaseInitialized) {
    try {
      const message = {
        notification: { title, body },
        data: stringData,
        tokens,
      };
      const response = await getMessaging().sendEachForMulticast(message);
      console.log(`📱 FCM Push sent successfully: ${response.successCount} succeeded, ${response.failureCount} failed.`);
      return response;
    } catch (error) {
      console.error('❌ Error sending FCM push notification:', error.message);
    }
  } else {
    console.log(`📱 [FCM Mock Push] To ${tokens.length} tokens: Title="${title}", Body="${body}"`);
  }
};

module.exports = {
  verifyGoogleToken,
  sendFCMMulticast,
  isFirebaseInitialized,
};
