"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db, storage } from "@/lib/firebase/firebase";
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { sendWhatsAppReciptMessage } from '@/utils/whatsapp'
// Replace this with your actual logoBase64 string

const logoBase64 = "data:image/png;base64,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"



export default function InvoicePage() {
  
  const searchParams = useSearchParams();
  const orderIdFromQuery = searchParams.get("orderId");
  
  
  const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };
  
  const [order, setOrder] = useState({
    orderId: "",
    name: "",
    address: "",
    phone: "",
    totalBill: "",
    paymentMode: "Cash",
    customerId: "",
    date: formatDate(new Date()),
  });
  const [orderCount, setOrderCount] = useState(0);

  const [items, setItems] = useState([
    { description: "", quantity: 1, rate: 0 },
  ]);

  const [charges, setCharges] = useState([
    { label: "Delivery", amount: 0 },
    { label: "Discount", amount: 0 },
  ]);

  // 🔹 Fetch Order Data + Coupon


  // ...
  const fetchOrderData = async (id) => {
    if (!id) return;
    try {
      const orderRef = doc(db, "orders", id);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        alert("Order not found!");
        return;
      }

      const orderData = orderSnap.data();

      // Handle address type
      const invoiceName =
        orderData.addressType === "myself"
          ? orderData.customerName
          : orderData.friendFamilyName || "";
      const invoicePhone =
        orderData.addressType === "myself"
          ? orderData.phone
          : orderData.friendFamilyPhone || "";

      // 🔹 Lookup customer by phone
      let customerId = "";
      
      if (orderData.phone) {
        // documentId is same as phone
        const customerRef = doc(db, "customers", orderData.phone);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
          const fullCustomerId = customerSnap.data().customerId || "";
          const fetchedOrderCount = customerSnap.data().orderCount || 0;
          customerId = fullCustomerId.slice(-6); // last 6 chars
          setOrderCount(fetchedOrderCount );
        }
      }

      setOrder((prev) => ({
        ...prev,
        orderId: orderData.orderId || "",
        name: invoiceName,
        phone: invoicePhone,
        address: orderData.address || "",
        customerId: customerId || prev.customerId,
        date: prev.date,
      }));

      // Fill products
      setItems(
        (orderData.productList || []).map((p) => ({
          description: p.name + ' (' + p.weight + ')',
          quantity: p.quantity,
          rate: p.price,
        }))
      );

      // Delivery charge
      let delivery = Number(orderData.deliveryCharges || 0);

      // 🔹 Coupon check


      let couponCharge = null;
      if (orderData.couponCode) {
        const q = query(
          collection(db, "coupons"),
          where("code", "==", orderData.couponCode)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          alert("Coupon found ✅");
          const coupon = snap.docs[0].data();

          const subtotal = (orderData.productList || []).reduce(
            (sum, p) => sum + p.total,
            0
          );

          const totalBill = subtotal;
          if (totalBill >= coupon.minPurchase) {
            let discount = (coupon.discount * totalBill) / 100;
            if (discount > coupon.maxDiscount) { discount = coupon.maxDiscount; }

            couponCharge = { label: `Coupon (${coupon.code})`, amount: discount };
          } else {
            alert("Subtotal is less than minPurchase ❌");
          }
        } else {
          alert("Coupon NOT found ❌");
        }
      }

      // 🔹 Set charges in fixed order (coupon → delivery → discount)
      const updatedCharges = [
        ...(couponCharge ? [couponCharge] : []),
        { label: "Delivery", amount: delivery },
        { label: "Discount", amount: 0 },
      ];

      setCharges(updatedCharges);

      setCharges(updatedCharges);
    } catch (err) {
      console.error("Error fetching order:", err);
    }
  };

  useEffect(() => {
    if (orderIdFromQuery) {
      setOrder((prev) => ({ ...prev, orderId: orderIdFromQuery }));
      fetchOrderData(orderIdFromQuery); // now this will work
    }
  }, [orderIdFromQuery]);


  const handleOrderChange = (e) => {
    setOrder({ ...order, [e.target.name]: e.target.value });
  };

  const handleItemChange = (i, e) => {
    const newItems = [...items];
    newItems[i][e.target.name] = e.target.value;
    setItems(newItems);
  };

  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, rate: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const handleChargeChange = (i, e) => {
    const newCharges = [...charges];
    newCharges[i][e.target.name] = e.target.value;
    setCharges(newCharges);
  };

  const addCharge = () =>
    setCharges([...charges, { label: "", amount: 0 }]);
  const removeCharge = (i) => {
    const label = charges[i].label.toLowerCase();
    if (["delivery"].includes(label)) return;
    setCharges(charges.filter((_, idx) => idx !== i));
  };

  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.rate),
    0
  );
  const deliveryCharge = Number(
    charges.find((c) => (c.label || "").toLowerCase() === "delivery")?.amount || 0
  );

  const couponDiscount = Number(
    charges.find((c) => (c.label || "").toLowerCase().startsWith("coupon"))?.amount || 0
  );

  const discountAmount = Number(
    charges.find((c) => (c.label || "").toLowerCase() === "discount")?.amount || 0
  );

  const otherCharges = charges.filter(
    (c) =>
      !["delivery", "discount"].includes((c.label || "").toLowerCase()) &&
      !(c.label || "").toLowerCase().startsWith("coupon")
  );

  const otherChargesTotal = otherCharges.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  const finalTotal =
    itemsTotal + deliveryCharge + otherChargesTotal - discountAmount - couponDiscount;

  const capitalizeWords = (str) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

  // 🔹 Generate PDF
  const generatePDF = async () => {
    const pdfDoc = new jsPDF();
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const leftX = 14;
    const rightX = pageWidth - 14;

    // Header
    const logoWidth = 12;
    const logoHeight = 12;
    pdfDoc.addImage(logoBase64, "PNG", leftX, 12, logoWidth, logoHeight);
    pdfDoc.setFontSize(16);
    pdfDoc.setFont(undefined, "bold");
    pdfDoc.text("HabitUs", leftX + logoWidth + 4, 20);
    pdfDoc.text("Order Invoice", rightX, 20, { align: "right" });

    pdfDoc.setFontSize(12);

    // 🔹 "Invoice To:" label in bold
    pdfDoc.setFont(undefined, "bold");
    pdfDoc.text("Invoice To:", leftX, 38);

    // 🔹 Switch back to normal for details
    pdfDoc.setFont(undefined, "normal");
    pdfDoc.text(`Name: ${order.name}`, leftX, 46);

    const addressLines = pdfDoc.splitTextToSize(`Address: ${order.address}`, 80);
    pdfDoc.text(addressLines, leftX, 54);

    pdfDoc.text(`Phone: ${order.phone}`, leftX, 70);

    // Right-side fields remain same
    pdfDoc.text(`Order ID: ${order.orderId}`, leftX, 30);
    pdfDoc.text(`Total Bill: Rs ${finalTotal.toFixed(2)}`, rightX, 30, { align: "right" });
    pdfDoc.text(`Payment Mode: ${order.paymentMode}`, rightX, 38, { align: "right" });
    pdfDoc.text(`Customer ID: ${order.customerId}`, rightX, 46, { align: "right" });
    pdfDoc.text(`Date: ${order.date}`, rightX, 54, { align: "right" });

    autoTable(pdfDoc, {
      head: [["#", "Description", "Quantity (No./Grams)", "Rate (Rs)", "Total (Rs)"]],
      startY: 73,
      body: items.map((item, idx) => [
        idx + 1,
        capitalizeWords(item.description),
        item.quantity,
        Number(item.rate).toFixed(2),
        (item.quantity * item.rate).toFixed(2),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [26, 162, 72],
        textColor: [255, 255, 255],
        halign: "center",
      },
      styles: { fontSize: 11 },
      margin: { left: 14, right: 14 },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    let y = pdfDoc.lastAutoTable.finalY + 15;

    const addAmountLine = (label, amount, bold = false, bgColor = null) => {
      const value = `Rs ${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      })}`;

      const labelX = 120;
      const valueX = pdfDoc.internal.pageSize.getWidth() - 20;

      if (bgColor) {
        pdfDoc.setFillColor(...bgColor);
        pdfDoc.rect(labelX - 2, y - 6, valueX - labelX + 10, 10, "F");
      }

      pdfDoc.setFont(undefined, bold ? "bold" : "normal");
      pdfDoc.setTextColor(0, 0, 0);
      pdfDoc.text(label, labelX, y);
      pdfDoc.text(value, valueX, y, { align: "right" });

      y += 8;
    };

    addAmountLine("Subtotal", itemsTotal);
    charges.forEach((c) => addAmountLine(c.label, Number(c.amount)));
    addAmountLine("Total", finalTotal, true, [255, 252, 2]);

    // ✅ Save locally for user
    pdfDoc.save(`Invoice_${order.orderId || "order"}.pdf`);

    // ✅ Upload to Firebase Storage
    const pdfBlob = pdfDoc.output("blob");
    const billRef = ref(storage, `bills/${order.orderId}-bill.pdf`);

    try {
      await uploadBytes(billRef, pdfBlob);
      const orderBillUrl = await getDownloadURL(billRef);

      // ✅ Update Firestore in orders/{orderId}
      const orderRef = doc(db, "orders", order.orderId);
      await updateDoc(orderRef, { orderBillUrl });

      alert(`Bill uploaded & Firestore updated ✅`);

      sendWhatsAppReciptMessage(finalTotal, order, orderBillUrl);
    } catch (err) {
      console.error("Error uploading/updating bill:", err);
      alert("Failed to upload or update order with bill URL ❌");
    }


  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "2rem auto",
        padding: "2rem",
        background: "#1F2937",
        borderRadius: 12,
        color: "#fff",
      }}
    >
      <h2
        style={{
          fontSize: 28,
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        HabitUs Order Invoice Generator
      </h2>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <label>
            Order ID<br />
            <input
              name="orderId"
              value={order.orderId}
              onChange={handleOrderChange}
              className="input"
            />
          </label>
          <button
            onClick={() => fetchOrderData(order.orderId)}
            className="bg-blue-600 text-white px-3 py-1 rounded ml-2"
          >
            Fetch Order
          </button>

          <br />
          <label>
            Name<br />
            <input
              name="name"
              value={order.name}
              onChange={handleOrderChange}
              className="input"
            />
          </label>
          <br />
          <label>
            Address<br />
            <input
              name="address"
              value={order.address}
              onChange={handleOrderChange}
              className="input"
            />
          </label>
          <br />
          <label>
            Phone<br />
            <input
              name="phone"
              value={order.phone}
              onChange={handleOrderChange}
              className="input"
            />
          </label>
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <label>
            Total Bill<br />
            <input value={finalTotal.toFixed(2)} disabled className="input" />
          </label>
          <br />
          <div className="mb-1.5">
            <label className="block mb-2 font-semibold text-white">
              Payment Mode:
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="radio"
                  name="paymentMode"
                  value="Cash"
                  checked={order.paymentMode === "Cash"}
                  onChange={(e) =>
                    setOrder({ ...order, paymentMode: e.target.value })
                  }
                  className="accent-green-600 w-4 h-4"
                />
                Cash
              </label>
              <label className="flex items-center gap-2 text-white">
                <input
                  type="radio"
                  name="paymentMode"
                  value="UPI"
                  checked={order.paymentMode === "UPI"}
                  onChange={(e) =>
                    setOrder({ ...order, paymentMode: e.target.value })
                  }
                  className="accent-green-600 w-4 h-4"
                />
                UPI
              </label>
            </div>
          </div>
          <label>
            Customer ID (Order No: {orderCount})<br />
            <input
              name="customerId"
              value={order.customerId}
              onChange={handleOrderChange}
              className="input"
            />
          </label>

          <br />
          <label>
            Date<br />
            <input
              type="date"
              name="date"
              value={new Date(order.date.split("-").reverse().join("-"))
                .toISOString()
                .split("T")[0]}
              onChange={(e) => {
                const [yyyy, mm, dd] = e.target.value.split("-");
                setOrder({ ...order, date: `${dd}-${mm}-${yyyy}` });
              }}
              className="input"
            />
          </label>
        </div>
      </div>

      {/* Items */}
      <h3 style={{ marginTop: 32 }}>Items</h3>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <input
            name="description"
            placeholder="Description"
            value={item.description}
            onChange={(e) => handleItemChange(i, e)}
            className="input"
            style={{ flex: 2 }}
          />
          <input
            type="number"
            min={1}
            name="quantity"
            value={item.quantity}
            onChange={(e) => handleItemChange(i, e)}
            className="input"
            style={{ width: 80 }}
          />
          <input
            type="number"
            min={0}
            name="rate"
            value={item.rate}
            onChange={(e) => handleItemChange(i, e)}
            className="input"
            style={{ width: 80 }}
          />
          <span style={{ width: 80 }}>
            Rs {(item.quantity * item.rate).toFixed(2)}
          </span>
          <button
            onClick={() => removeItem(i)}
            disabled={items.length === 1}
            className="btn-danger"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition duration-200"
      >
        + Add Item
      </button>

      {/* Charges */}
      <h3 style={{ marginTop: 32 }}>Additional Charges</h3>
      {charges.map((charge, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <input
            name="label"
            value={charge.label}
            onChange={(e) => handleChargeChange(i, e)}
            className="input"
            style={{ flex: 2 }}
            disabled={["delivery", "discount"].includes(
              charge.label.toLowerCase()
            )}
          />
          <input
            type="number"
            min={0}
            name="amount"
            value={charge.amount}
            onChange={(e) => handleChargeChange(i, e)}
            className="input"
            style={{ width: 100 }}
          />
          <button
            onClick={() => removeCharge(i)}
            disabled={["delivery"].includes(
              charge.label.toLowerCase()
            )}
            className="btn-danger"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={addCharge}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition duration-200"
      >
        + Add Charge
      </button>

      {/* Totals */}
      <div style={{ textAlign: "right", marginTop: 32 }}>
        <div style={{ fontSize: 16 }}>
          Subtotal: Rs {itemsTotal.toFixed(2)}
        </div>
        {charges.map((c, i) => (
          <div key={i} style={{ fontSize: 16 }}>
            {c.label}: Rs {Number(c.amount).toFixed(2)}
          </div>
        ))}
        <div
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginTop: 10,
          }}
        >
          Total: Rs {finalTotal.toFixed(2)}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <button
          onClick={generatePDF}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition duration-200"
        >
          📄 Generate PDF
        </button>
      </div>

      {/* Styles */}
      <style jsx>{`
        .input {
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          width: 100%;
          font-size: 14px;
          background: #fff;
          color: #000;
        }
        .btn-danger {
          padding: 4px 8px;
          background: #dc2626;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
