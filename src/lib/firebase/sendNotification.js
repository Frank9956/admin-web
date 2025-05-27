import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase"; // your firebase app

export async function sendCustomNotification({ title, body, topic = "admins" }) {
  const functions = getFunctions(app);
  const sendNotification = httpsCallable(functions, "sendCustomNotification");

  try {
    const result = await sendNotification({ title, body, topic });
    return result.data;
  } catch (err) {
    console.error("Notification error:", err);
    throw err;
  }
}
