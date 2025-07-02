// app/api/sheets/update/route.js

import { google } from 'googleapis';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'habit-us-c24d0-6b4f9b73510e.json');
    const keyFile = await fs.readFile(serviceAccountPath, 'utf-8');
    const credentials = JSON.parse(keyFile);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = '1cSp8d-Vg1fv3h2Iz4udrLeUnykiMdx38NE9mZOt6RAs';

    const snapshot = await getDocs(collection(db, 'orders'));
    const orders = snapshot.docs.map(doc => doc.data());

    const values = [
      ['Order ID', 'Address', 'Amount', 'Payment Method', 'Status', 'Bill URL'],
      ...orders.map(o => [
        o.orderId || 'N/A',
        o.address || 'N/A',
        o.paidAmount ? `₹${o.paidAmount}` : '₹0',
        o.payment || 'N/A',
        o.status || 'N/A',
        o.orderBillUrl || 'N/A',
      ]),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return Response.json({ message: 'Google Sheet updated successfully ✅' });
  } catch (err) {
    console.error('Sheet export failed:', err);
    return Response.json({ error: 'Google Sheet export failed ❌' }, { status: 500 });
  }
}
