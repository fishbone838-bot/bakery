// Firebase 初始化 (請保留你原本的 config 內容)
const firebaseConfig = {
  apiKey: "AIzaSyChgtljdiiYO69_wgSOORbxCd3KPB2u2os",
  authDomain: "daifuku-order.firebaseapp.com",
  projectId: "daifuku-order",
  storageBucket: "daifuku-order.firebasestorage.app",
  messagingSenderId: "430618395622",
  appId: "1:430618395622:web:e59a8bec2c0fd354368c27"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 核心功能函數 ---

// 1. 取得日期字串 (YYYY-MM-DD)
function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 2. 取得下一號
async function getNextNumber() {
  const snap = await db.collection("orders").orderBy("number","desc").limit(1).get();
  if (snap.empty) return 1;
  return snap.docs[0].data().number + 1;
}

// 3. 建立訂單 (加入 date 欄位)
async function createOrder(data){
  const num = await getNextNumber();
  await db.collection("orders").add({
    number: num,
    name: data.name,
    phone: data.phone,
    amount: data.amount,
    status: "未取貨",
    date: getTodayStr(), // 這裡是關鍵，用來區分哪一天的訂單
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
  return num;
}

// 4. 讀取訂單 (後台用) — 支援篩選與排序
//    options: { status: '全部'|'未取貨'|'已取貨'|'已取消', sortBy: 'number'|'time', sortDir: 'asc'|'desc' }
async function getOrders(options = {}){
  let q = db.collection("orders");

  // 篩選狀態（預設為全部）
  if (options.status && options.status !== '全部') {
    q = q.where('status', '==', options.status);
  }

  // 排序
  const sortBy = options.sortBy || 'number';
  const sortDir = options.sortDir === 'asc' ? 'asc' : 'desc';
  if (sortBy === 'time') {
    q = q.orderBy('time', sortDir);
  } else {
    q = q.orderBy('number', sortDir);
  }

  const snap = await q.get();
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}

// 5. 更新訂單狀態（若改為已取消，紀錄取消時間；若從已取消改回，移除取消時間）
async function updateStatus(id, status){
  const ref = db.collection("orders").doc(id);
  const doc = await ref.get();
  const prev = doc.exists ? doc.data().status : null;

  const updates = { status };
  if (status === '已取消') {
    updates.cancelledAt = firebase.firestore.FieldValue.serverTimestamp();
  } else if (prev === '已取消') {
    updates.cancelledAt = firebase.firestore.FieldValue.delete();
  }

  await ref.update(updates);
}

// 6. 取得限量設定 (若資料庫沒設定過，預設 50)
async function getStockConfig() {
  const doc = await db.collection("settings").doc("stock").get();
  return doc.exists ? doc.data() : { max: 50 };
}

// 7. 更新限量設定 (這就是你報錯缺少的那個函數)
async function updateStockConfig(newMax) {
  await db.collection("settings").doc("stock").set({
    max: Number(newMax)
  });
}