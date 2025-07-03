import { google } from 'googleapis';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export async function GET() {
  try {
    const credentials = {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
    };

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
