function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

// Utility to open WhatsApp Web with pre-filled message
function whatsappMessage(phone, message) {
  if (!phone) {
    alert("No phone number provided!");
    return;
  }

  phone = phone.toString().replace(/\D/g, "");
  if (!phone.startsWith("91")) {
    phone = "91" + phone;
  }

  window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, "_blank");
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


export function sendOrderConfirmation(order) {
  if (!order.phone) {
    alert("No phone number found for this order!");
    return;
  }
  const greet = getGreeting();

  const productsText = order.productList?.length
    ? order.productList.map(
      (p, i) => `${i + 1}. ${p.name} (${p.weight}) x${p.quantity} = ₹${p.total}`
    ).join('\n')
    : 'No products'
  const friends_family = order.addressType === 'friends_family' ? `\nDeliver to:\n👫 Friend/Family: ${order.friendFamilyName} (${order.friendFamilyPhone})\n` : '';
  const message = `
🛒 *Order  Confirmation*

👤 Name: ${order.name}
📞 Phone: ${order.phone}
📍 Address: ${order.address}
${friends_family}  
🎁 Coupon: ${order.couponCode || 'None'}
🚚 Delivery: ${order.deliveryType || 'Standard'}
💡 Suggestions: ${order.suggestions || 'None'}
  
📦 *Products*:
${productsText}
  
💰 *Total Price*: ₹${order.totalPrice}/- only
  
We are processing your order and will update you soon! 🚀
Thank you for choosing HabitUs! 💚💛
`;

  const phoneNumber = order.phone || "9140019817"

  whatsappMessage(phoneNumber, message)

}


// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Send WhatsApp receipt message after bill upload

export const sendWhatsAppReciptMessage = async (finalTotal, order, orderBillUrl) => {
  if (!order?.phone) {
    alert("No phone number found for this order!");
    return;
  }

  const message = `
Hello *${order.name}*,

✅ Here is your Order receipt! 

🧾 Order ID: ${order.orderId}  
💰 Total: *₹${finalTotal}/-* 

🔗 Download your invoice here: ${orderBillUrl}

Your order soon to be delivered 🚀

Thank you for ordering with HabitUs💚💛 
`;

  let phone = order.phone.toString().replace(/\D/g, "");
  if (!phone.startsWith("91")) {
    phone = "91" + phone;
  }

  whatsappMessage(phone, message)

}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Send feedback request message with dynamic Google Form link

export const sendFeedback = async (order) => {
  let targetNumber;
  let targetName;

  if (order?.addressType === "friends_family") {
    targetNumber = order?.friendFamilyPhone || order?.phone;
    targetName = order?.friendFamilyName || order?.name;
  } else {
    targetNumber = order?.phone;
    targetName = order?.customerName;
  }

  if (!targetNumber) {
    alert("No valid number found for this order");
    return;
  }
  if (!targetName) {
    targetName = "Customer";
  }

  const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdu0SGEANpTCgRLCWMweyRfOAcZEp4LTa2CuRs69xxy8Lf_rg/viewform?usp=pp_url';
  const params = new URLSearchParams({
    'entry.430839610': targetName,
    'entry.1953884861': targetNumber,
    'entry.250283115': order.id
  });

  const formUrl = `${baseUrl}&${params.toString()}`;


  const message = `
Hello *${targetName}*, 

Thanks for ordering with HabitUs! 🙌

We'd love to hear your feedback about your recent order *(ID: ${order.id})*.

Please fill below form with your *thoughts or any suggestions* you have to help us improve our service. Your feedback is invaluable to us! 💚💛
Looking forward to hearing from you! 😊

*Feedback Form*: ${formUrl}

Warm regards,
Team *HabitUs* 💚💛`;

  whatsappMessage(targetNumber, message);
};
