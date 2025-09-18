// 'use client'

// import { useEffect, useRef } from 'react';
// import { db } from '@/lib/firebase/firebase';
// import { collection, onSnapshot } from 'firebase/firestore';

// export default function OrderNotifier() {
//   const initialLoad = useRef(true); // <--- track first snapshot

//   useEffect(() => {
//     if ("Notification" in window && Notification.permission !== "granted") {
//       Notification.requestPermission();
//     }

//     const ordersCollection = collection(db, 'receivedOrder');

//     const unsubscribe = onSnapshot(ordersCollection, (snapshot) => {
//       // Skip initial load
//       if (initialLoad.current) {
//         initialLoad.current = false;
//         return;
//       }

//       snapshot.docChanges().forEach((change) => {
//         if (change.type === 'added') {
//           const orderData = change.doc.data();

//           // Show browser notification
//           if (Notification.permission === "granted") {
//             new Notification("New Order Received!", {
//               body: `Order ID: ${orderData.phone || 'N/A'}`,
//               icon: "/favicon.png",
//             });

//             // Play sound
//             const audio = new Audio('/notification.mp3');
//             audio.play().catch(err => console.log('Audio play error:', err));
//           }
//         }
//       });
//     });

//     return () => unsubscribe(); // cleanup on unmount
//   }, []);

//   return null;
// }




'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/firebase/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export default function OrderNotifier() {
  const initialLoad = useRef(true)      // Skip existing orders on first snapshot
  const [soundUnlocked, setSoundUnlocked] = useState(false)

  // Ask for notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const ordersCollection = collection(db, 'receivedOrder')

    const unsubscribe = onSnapshot(ordersCollection, snapshot => {
      // Skip first batch of existing orders
      if (initialLoad.current) {
        initialLoad.current = false
        return
      }

      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const orderData = change.doc.data()

          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification("New Order Received!", {
              body: `Order ID: ${orderData.phone || 'N/A'}`,
              icon: "/favicon.png",
            })
          }

          // Play sound if unlocked
          if (soundUnlocked) {
            const audio = new Audio('/notification.mp3')
            audio.play().catch(err => console.log('Audio play error:', err))
          }
        }
      })
    })

    return () => unsubscribe()
  }, [soundUnlocked])

  // Handler to unlock sound on mobile
  const unlockSound = () => {
    const audio = new Audio('/notification.mp3')
    audio.play().then(() => {
      audio.pause()         // Pause immediately, just unlock
      setSoundUnlocked(true)
    }).catch(err => console.log('Unlock sound error:', err))
  }

  return (
    <>
      {!soundUnlocked && (
        <button
          onClick={unlockSound}
          className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50"
        >
          Enable Notifications & Sound
        </button>
      )}
    </>
  )
}
