// src/app/firebase.ts
// Khởi tạo Firebase App & Auth cho N3T - Quản lý Kho

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCCq_2V9JxjA5GHoXiIpORUBR83GNR2UBk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nt106-quanlykho.firebaseapp.com',
  // TODO: điền thêm các thông số còn lại từ Firebase console
  // projectId, storageBucket, messagingSenderId, appId
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
