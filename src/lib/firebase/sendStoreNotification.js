import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase"; 

export async function sendCustomStoreNotification({ title, body, topic = "store" }) {
  const functions = getFunctions(app);
  const sendNotification = httpsCallable(functions, "sendCustomStoreNotification");

  try {
    const result = await sendNotification({ title, body, topic });
    return result.data;
  } catch (err) {
    console.error("Notification error:", err);
    throw err;
  }
}
