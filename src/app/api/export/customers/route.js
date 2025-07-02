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

    const customersSnap = await getDocs(collection(db, 'customers'));
    const ordersSnap = await getDocs(collection(db, 'orders'));

    const orderMap = {};
    ordersSnap.forEach(doc => {
      const order = doc.data();
      const phone = order.phone;
      const paid = parseFloat(order.paidAmount) || 0;
      if (phone) {
        if (!orderMap[phone]) orderMap[phone] = { total: 0, count: 0 };
        orderMap[phone].total += paid;
        orderMap[phone].count += 1;
      }
    });

    const values = [
      ['Name', 'Phone', 'Referral ID', 'Order Count', 'Total Spent'],
      ...customersSnap.docs.map(doc => {
        const c = doc.data();
        const stats = orderMap[c.phone] || { count: 0, total: 0 };
        return [
          c.name || 'Unknown',
          c.phone || 'N/A',
          c.referralId || '—',
          stats.count,
          `₹${stats.total.toFixed(2)}`
        ];
      })
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Customers!A1', 
        valueInputOption: 'RAW',
        requestBody: { values },
      });

    return Response.json({ message: 'Customer data updated to Google Sheet ✅' });
  } catch (err) {
    console.error('Customer sheet export failed:', err);
    return Response.json({ error: 'Failed to export customer data ❌' }, { status: 500 });
  }
}
