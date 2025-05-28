import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase"; // your firebase app

export async function sendCustomNotification({ title, body }) {
  const functions = getFunctions(app);
  const sendNotification = httpsCallable(functions, "sendCustomNotification");

  try {
    const [storeResult, deliveryResult] = await Promise.all([
      sendNotification({ title, body, topic: "store" }),
      sendNotification({ title, body, topic: "delivery" }),
    ]);

    return {
      success: true,
      storeResponse: storeResult.data,
      deliveryResponse: deliveryResult.data,
    };
  } catch (err) {
    console.error("Notification error:", err);
    throw err;
  }
}
