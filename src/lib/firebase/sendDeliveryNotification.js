import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase"; // your firebase app

export async function sendCustomDeliveryNotification({ title, body, topic = "delivery" }) {
  const functions = getFunctions(app);
  const sendNotification = httpsCallable(functions, "sendCustomDeliveryNotification");

  try {
    const result = await sendNotification({ title, body, topic });
    return result.data;
  } catch (err) {
    console.error("Notification error:", err);
    throw err;
  }
}
