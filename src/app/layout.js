import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OrderNotifier from './dashboard/OrderNotifier';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "HabitUs Admin",
  description: "Admin Pannel for HabitUs",
  icons: {
    icon: '/favicon.png', // or .png, .svg if you prefer
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-green-900 text-gray-100 min-h-screen`}

      >
        <OrderNotifier />

        {children}
      </body>
    </html>
  );
}
