import crypto from "crypto";

export default async function handler(req, res) {
  // Sirf POST request allow karein
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, amount } = req.body;

    // Basic validation
    if (!phone || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid mobile number aur amount daalein" });
    }

    // Unique Order ID generate karein
    const orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    // Request payload (Docs ke mutabik)
    const payload = {
      order_id: orderId,
      amount: Number(amount),
      currency: "INR",
      method: "upi",
      customer_name: "Customer",
      customer_phone: String(phone).trim()
    };

    // Exact raw JSON string banayein (sign karne ke liye)
    const bodyString = JSON.stringify(payload);

    // HMAC-SHA256 signature generate karein
    const signature = crypto
      .createHmac("sha256", process.env.PAYIN_API_SECRET)
      .update(bodyString)
      .digest("hex");

    // Gateway API ko call karein
    const response = await fetch("https://ttpay.buzz/api/public/v1/payins", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.PAYIN_API_KEY,
        "x-signature": signature,
      },
      body: bodyString,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || "Payment gateway error",
        details: data
      });
    }

    // Checkout URL frontend ko wapas bhejein
    return res.status(200).json({
      success: true,
      checkout_url: data.checkout_url || data.payment_url,
      order_id: orderId
    });

  } catch (error) {
    console.error("Payment Error:", error);
    return res.status(500).json({ error: "Server error aaya hai, baad mein try karein" });
  }
}
