import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebaseの設定
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: "first-moments-app",
  storageBucket: "first-moments-app.firebasestorage.app",
  messagingSenderId: "400159814745",
  appId: "1:400159814745:web:f62c963cb9b33b3920ed48",
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// 各サービスのインスタンスを取得
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// エミュレータの設定（開発環境の場合）
if (process.env.NODE_ENV === "development") {
  try {
    // Firestoreエミュレーターに接続
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Authエミュレーターに接続
    connectAuthEmulator(auth, 'http://localhost:9099');
    
    // Storageエミュレーターに接続
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.error('Firebase Emulators: Connection failed', error);
  }
}
