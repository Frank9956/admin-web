// Import Firebase v2 functions and admin SDK
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// ✅ Firestore trigger for new order creation
exports.newOrderNotification = onDocumentCreated("receivedOrder/{orderId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    console.log("⚠️ No data in snapshot");
    return null;
  }

  const order = snap.data();
  console.log("🛒 New order placed:", order);

  // Example: Save a log or send push notification (custom logic later)
  await db.collection("logs").add({
    message: `New order from ${order.name || "unknown"}`,
    timestamp: new Date(),
  });

  return null;
});
