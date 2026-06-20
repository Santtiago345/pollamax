// NOTE: Firebase Admin SDK is not currently used.
// If you need server-side Firestore operations, install firebase-admin
// and uncomment the code below. Make sure FIREBASE_SERVICE_ACCOUNT
// env var is set in your Vercel dashboard.
//
// import { cert, getApp, getApps, initializeApp } from 'firebase-admin';
// import { getAuth } from 'firebase-admin/auth';
// import { getFirestore } from 'firebase-admin/firestore';
//
// if (!getApps().length) {
//   if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
//     throw new Error('FIREBASE_SERVICE_ACCOUNT no está definida');
//   }
//   const serviceAccount = JSON.parse(
//     Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8')
//   );
//   initializeApp({
//     credential: cert(serviceAccount),
//   });
// }
//
// const adminApp = getApp();
// export const adminDb = getFirestore(adminApp);
// export const adminAuth = getAuth(adminApp);
