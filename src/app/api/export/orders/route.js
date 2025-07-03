// app/api/sheets/update/route.js

import { google } from 'googleapis';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    const credentials = {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.split(String.raw`\n`).join('\n'),
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
      range: 'Orders!A1', 
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return Response.json({ message: 'Google Sheet updated successfully ✅' });
  } catch (err) {
    console.error('Sheet export failed:', err);
    return Response.json({ error: 'Google Sheet export failed ❌' }, { status: 500 });
  }
}
