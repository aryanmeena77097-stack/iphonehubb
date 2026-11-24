
import { NextResponse } from "next/server";
import { createHmac, randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { phone, amount } = await request.json();

    // Validate mobile number
    if (!/^[6-9]\d{9}$/.test(phone || "")) {
      return NextResponse.json(
        { error: "Invalid mobile number." },
        { status: 400 }
      );
    }

    // Validate amount
    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      paymentAmount > 1000000
    ) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    const apiKey = process.env.PAYIN_API_KEY;
    const apiSecret = process.env.PAYIN_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 500 }
      );
    }

    // Create unique order ID
    const orderId = "ORD-" + randomUUID();

    // Exact JSON body used for signing
    const body = JSON.stringify({
      order_id: orderId,
      amount: paymentAmount,
      currency: "INR",
      method: "upi",
      customer_phone: phone
    });

    // HMAC SHA256 signature
    const signature = createHmac("sha256", apiSecret)
      .update(body, "utf8")
      .digest("hex");

    // Call SunPay API
    const response = await fetch(
      "https://ttpay.buzz/api/public/v1/payins",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-signature": signature
        },
        body,
        cache: "no-store"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("SunPay API error:", response.status);
      return NextResponse.json(
        { error: "Payment gateway rejected the request." },
        { status: 502 }
      );
    }

    // Accept only the documented checkout host
    const checkoutUrl = data.checkout_url;

    let parsedUrl;

    try {
      parsedUrl = new URL(checkoutUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid checkout URL received." },
        { status: 502 }
      );
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "ttpay.buzz"
    ) {
      return NextResponse.json(
        { error: "Untrusted checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: parsedUrl.toString(),
      order_id: orderId
    });

  } catch (error) {
    console.error("Payment creation error:", error);

    return NextResponse.json(
      { error: "Unable to create payment. Please try again." },
      { status: 500 }
    );
  }
}

