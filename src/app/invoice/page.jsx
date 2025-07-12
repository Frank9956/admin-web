"use client";

import { useRef, useState, useEffect } from "react";

export default function InvoicePage() {
  const [info, setInfo] = useState({
    name: "",
    address: "",
    phone: "",
    orderId: "",
    date: new Date().toLocaleDateString(),
    items: [],
    discount: 0,
  });

  const [newItem, setNewItem] = useState({ name: "", qty: 0, price: 0 });
  const previewRef = useRef();

  function loadHtml2PdfScript() {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        return resolve(window.html2pdf);
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => resolve(window.html2pdf);
      script.onerror = () => reject(new Error("Failed to load html2pdf"));
      document.body.appendChild(script);
    });
  }

  const handleItemAdd = () => {
    if (newItem.name && newItem.qty && newItem.price) {
      setInfo((prev) => ({ ...prev, items: [...prev.items, newItem] }));
      setNewItem({ name: "", qty: 0, price: 0 });
    }
  };

  const deleteItem = (i) => {
    setInfo((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== i),
    }));
  };

  const handleExportPDF = async () => {
    const html2pdf = await loadHtml2PdfScript();

    const element = previewRef.current;
    if (!element) return;

    html2pdf()
      .set({
        margin: 0.5,
        filename: `invoice-${info.orderId || "bill"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  const subtotal = info.items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const total = subtotal - Number(info.discount);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
      {/* LEFT - Inputs */}
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-4">Invoice Builder</h1>

        <input
          placeholder="Customer Name"
          className="w-full p-2 bg-gray-800 rounded"
          value={info.name}
          onChange={(e) => setInfo({ ...info, name: e.target.value })}
        />

        <textarea
          placeholder="Customer Address"
          className="w-full p-2 bg-gray-800 rounded"
          value={info.address}
          onChange={(e) => setInfo({ ...info, address: e.target.value })}
        />

        <input
          placeholder="Phone"
          className="w-full p-2 bg-gray-800 rounded"
          value={info.phone}
          onChange={(e) => setInfo({ ...info, phone: e.target.value })}
        />

        <input
          placeholder="Invoice No (e.g. CUS-4EEF53)"
          className="w-full p-2 bg-gray-800 rounded"
          value={info.orderId}
          onChange={(e) => setInfo({ ...info, orderId: e.target.value })}
        />

        <div>
          <h2 className="font-semibold mb-2">Add Items</h2>
          <div className="flex gap-2">
            <input placeholder="Item" className="p-1 bg-gray-800 rounded" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
            <input placeholder="Qty" type="number" className="p-1 w-20 bg-gray-800 rounded" value={newItem.qty} onChange={(e) => setNewItem({ ...newItem, qty: Number(e.target.value) })} />
            <input placeholder="Price" type="number" className="p-1 w-24 bg-gray-800 rounded" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} />
            <button onClick={handleItemAdd} className="bg-blue-700 px-3 rounded">Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {info.items.map((item, i) => (
              <div key={i} className="flex justify-between bg-gray-800 p-2 rounded">
                <div>{item.name} — {item.qty} × ₹{item.price}</div>
                <button className="text-red-500" onClick={() => deleteItem(i)}>Delete</button>
              </div>
            ))}
          </div>
        </div>

        <input
          placeholder="Discount"
          type="number"
          className="w-full p-2 bg-gray-800 rounded"
          value={info.discount}
          onChange={(e) => setInfo({ ...info, discount: e.target.value })}
        />

        <button onClick={handleExportPDF} className="bg-green-600 px-4 py-2 rounded">
          Export to PDF
        </button>
      </div>

      {/* RIGHT - Preview */}
      <div
        ref={previewRef}
        className="bg-white text-black rounded-lg shadow p-6 max-w-[800px] mx-auto"
      >
        <div className="flex justify-between items-center">
          <div></div>
          <div className="text-right">
            <h1 className="text-xl font-bold">HABIT US</h1>
            <p className="text-sm font-semibold mt-1">Invoice #{info.orderId || "---"}</p>
            <p className="text-sm">Date: {info.date}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">Bill To:</p>
            <p>{info.name}</p>
            <p>{info.address}</p>
            <p>{info.phone}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Payment Terms: Due on Receipt</p>
            <p>PO Number: —</p>
          </div>
        </div>

        <div className="mt-6">
          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2 text-left">Item</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Rate</th>
                <th className="border p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {info.items.map((item, i) => (
                <tr key={i}>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2 text-center">{item.qty}</td>
                  <td className="border p-2 text-right">₹{item.price}</td>
                  <td className="border p-2 text-right">₹{item.qty * item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-right text-sm">
            <p>Subtotal: ₹{subtotal}</p>
            <p>Discount: ₹{info.discount || 0}</p>
            <p className="font-bold text-lg mt-1">Total: ₹{total}</p>
          </div>
        </div>

        <div className="mt-8 text-sm">
          <p><strong>Signature:</strong> ____________________________</p>
        </div>
      </div>
    </div>
  );
}