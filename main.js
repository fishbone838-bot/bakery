// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🔴 請換成你的 Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyChgtljdiiYO69_wgSOORbxCd3KPB2u2os",
  authDomain: "daifuku-order.firebaseapp.com",
  projectId: "daifuku-order",
  storageBucket: "daifuku-order.firebasestorage.app",
  messagingSenderId: "430618395622",
  appId: "1:430618395622:web:e59a8bec2c0fd354368c27"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 取得目前號碼
async function getNextNumber() {
  const q = query(
    collection(db, "orders"),
    orderBy("number", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) return 1;
  return snap.docs[0].data().number + 1;
}

// 新增訂單
export async function createOrder(data) {

  const num = await getNextNumber();

  await addDoc(collection(db, "orders"), {
    number: num,
    name: data.name,
    phone: data.phone,
    amount: data.amount,
    status: "未取貨",
    time: serverTimestamp()
  });

  return num;
}

// 讀取訂單
export async function getOrders() {
  const q = query(
    collection(db, "orders"),
    orderBy("number", "asc")
  );

  const snap = await getDocs(q);

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

// 更新狀態
export async function updateStatus(id, status) {
  await updateDoc(doc(db, "orders", id), {
    status
  });
}
