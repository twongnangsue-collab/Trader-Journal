// นำเข้า Firebase และบริการต่างๆ ผ่านลิงก์ CDN (สำหรับเบราว์เซอร์)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js"; // ฐานข้อมูลตัวหนังสือ
import { getStorage } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";   // โกดังเก็บรูปภาพ

// กุญแจ (Config) ของแอปคุณ
const firebaseConfig = {
  apiKey: "AIzaSyDBqLJXQzhT3rkcGjAJeUENzBbQIV5_2cs",
  authDomain: "trader-journal-f41f2.firebaseapp.com",
  projectId: "trader-journal-f41f2",
  storageBucket: "trader-journal-f41f2.firebasestorage.app",
  messagingSenderId: "890348977134",
  appId: "1:890348977134:web:9c75925ca94aac89feecff",
  measurementId: "G-ZY7T9XMB35"
};

// เริ่มต้นระบบ Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ส่งออกตัวแปรเพื่อให้ไฟล์ app.js ของเราดึงไปใช้งานได้
export { app, db, storage };