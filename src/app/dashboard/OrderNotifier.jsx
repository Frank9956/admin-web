'use client'

import { useEffect, useRef } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function OrderNotifier() {
  const initialLoad = useRef(true); // <--- track first snapshot

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const ordersCollection = collection(db, 'receivedOrder');

    const unsubscribe = onSnapshot(ordersCollection, (snapshot) => {
      // Skip initial load
      if (initialLoad.current) {
        initialLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderData = change.doc.data();

          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification("New Order Received!", {
              body: `Order ID: ${orderData.phone || 'N/A'}`,
              icon: "/favicon.png",
            });

            // Play sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(err => console.log('Audio play error:', err));
          }
        }
      });
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  return null;
}
