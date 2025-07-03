import { google } from 'googleapis';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export async function GET() {
  try {
    const credentials = {
      "type": "service_account",
      "project_id": "habit-us-c24d0",
      "private_key_id": "6b4f9b73510e22a5903d92f233470a9852ef66fb",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCLX+WVrnLmWk+0\nIWXEz5nG5KO1UOD8FLYOrmIiWgmj6imWlLKh58Y/cPfVsg9WT9fc0ij+s3rWnSKx\nhcC2TmscnQ19Ar5xOyFEBrk+eMffNKkpzDIYW+vw4MWRbgXTGxreDqWVfLt2RGMp\nZGhfsbk9q8mGm82xjJAVX36Sy679Mcqe2jlcDXxBMM6EYFot4KOpZ6dVw4dDZ7Z9\nZqUl5aooaQULkvhraxQQeQ5jxo8gZW/BqXFfaS9fHO7gRRTYwErAbG53BtdPf0k2\nFRPj3hOuruTkzXpeLzQR3bs7AmGTMorHRkM8OetlnD9r0675TapbSrujiXyBemE6\nlrI1hZulAgMBAAECggEAF7lRl5pztXEu+v7qV0dtKhVWJnFncpFF8hbN3oIL/QpJ\nXPfftj6BGOBuV0IxaSQ7HrvpPX2ojap+stANHxsXEW5MUviqGRUTEwS/+HnPr9dD\najl3V30iGsTv7FLZi/cjqiO9HMZ4FGgMpwmP2KYkXXKF4bNYnn3KMtEn9u3T0gYs\n5FICGfNbF5jCDtBNt2KLB4OPCblhRjNvPFq9TswgVsQE92hUaB8OscAeZ8+aw25P\nyNuNBzd9bNyBtu/UW8q6qcMHl1aPwHZuNvO9CrRDF5aYKiIY+55swvCr8kGu5Kcj\nDrrPsy5koJqJtkfGrBwuBb/c5mUH4DW4zhougE9RsQKBgQC9mxjcilDg4Z0d+BGj\nK7LaXTrrBEvASAOuk3PrEU8FRCyENrQoohyrDvCmRjNGGKneTgSYeocX6rmdc1YE\n/xBrejniz1JxCqodK3BTNU1B8Pwx+JYEHjbhZFEZa9eaZh4Wge07rrb1PguX2sPI\nyn8fmP1w4jV1V4J8iVdPkGLteQKBgQC8Leb3Fx858oS5Sixw3NYCzgOrHKpprBl5\nKD3vr9XaJUZvPknEPpWicEY1bJ7fWjUNODkYlLxZj4mSOK3zZEIoQvUSAlL4Zzph\nrKvYBYtZzhcgXpi22C1HadST4ZplLdYlCIyYkyqLygYeqT/6Gsa8jvgautu/52Sc\nVDFFDatQjQKBgAJ8NPA3E+ZOrruE095apUZ9cFdCQCfuCbZREnTjTjDYeujkuqnJ\nriyDzp2vT968VgWm6iKBgKHMntA0gc0g9rsh5/5UD1WR+TbWqes9SJzzpqqVAopd\nRwTfRrzZkALjEcPjwhNFL/q47Hf6ExTfqpjkbXX8UQ0Pr5MoTa+qSdGpAoGAZpiU\nKzVFBh/uMuN41VPhrofJwjoPwytcfAzvr8VrT9Mw0qfgKgmBJZ4W+TuuZtHUyM9V\necxl4GJ8u+cBGAkadL8ExHvV5q7JSsWMr2tebWkKfNB2bIHyNdRCXRoMRou2DFzb\n4reh47MSoRbf1alRny5HoLMt6jPrS7wvXJm2RGUCgYEApcLVeWc7kONElbRKfiBq\n21w6wp9rTKLdg0sw0/g+J63euKINKrNJMhjWAQbjcXF56Te6GLHzSXJ/L92q6X2n\nXJnHyEiq0enK/tnmW4bXAXROgw+2Ylglt/GNaZzZjeWeiNehiE1x3aKwsEqDwICA\njFAeS4WK92wB77c+IFjLPC4=\n-----END PRIVATE KEY-----\n",
      "client_email": "orderbackup@habit-us-c24d0.iam.gserviceaccount.com",
      "client_id": "109752363582345840283",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/orderbackup%40habit-us-c24d0.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
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
