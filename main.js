// Firebase SDK

// 🔴 請換成你的 Firebase 設定
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

// 取得下一號
async function getNextNumber() {

  const snap = await db
    .collection("orders")
    .orderBy("number","desc")
    .limit(1)
    .get();

  if (snap.empty) return 1;

  return snap.docs[0].data().number + 1;
}

// 建立訂單
async function createOrder(data){

  const num = await getNextNumber();

  await db.collection("orders").add({
    number: num,
    name: data.name,
    phone: data.phone,
    amount: data.amount,
    status: "未取貨",
    time: firebase.firestore.FieldValue.serverTimestamp()
  });

  return num;
}

// 讀取訂單
async function getOrders(){

  const snap = await db
    .collection("orders")
    .orderBy("number")
    .get();

  return snap.docs.map(d=>({
    id:d.id,
    ...d.data()
  }));
}

// 更新狀態
async function updateStatus(id,status){

  await db.collection("orders")
    .doc(id)
    .update({status});
}
// 取得目前庫存設定
async function getStockConfig() {
  const doc = await db.collection("settings").doc("stock").get();
  if (!doc.exists) {
    // 如果資料庫還沒設定過，預設給 50 份
    return { max: 50 };
  }
  return doc.data();
}

// 更新庫存設定 (由後台呼叫)
async function updateStockConfig(newMax) {
  await db.collection("settings").doc("stock").set({
    max: Number(newMax)
  });
}
// 取得今天的日期字串 (格式：YYYY-MM-DD)
function getTodayStr() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// 修改後的建立訂單：加入 date 欄位
async function createOrder(data){
  const num = await getNextNumber();
  await db.collection("orders").add({
    number: num,
    name: data.name,
    phone: data.phone,
    amount: data.amount,
    status: "未取貨",
    date: getTodayStr(), // ✨ 新增：記錄這是哪一天的訂單
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
  return num;
}

// 取得目前的每日限量設定
async function getStockConfig() {
  const doc = await db.collection("settings").doc("stock").get();
  return doc.exists ? doc.data() : { max: 50 };
}

// 更新每日限量設定
async function updateStockConfig(newMax) {
  await db.collection("settings").doc("stock").set({
    max: Number(newMax)
  });
}