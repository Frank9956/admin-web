// app/dashboard/invoice/page.jsx
import { Suspense } from "react";
import InvoicePageClient from "./page";

export default function InvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvoicePageClient />
    </Suspense>
  );
}
