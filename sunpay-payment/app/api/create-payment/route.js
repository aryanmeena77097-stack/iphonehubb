
import { NextResponse } from "next/server";
import { createHmac, randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { phone, amount } = await request.json();

    if (!/^[6-9]\d{9}$/.test(phone || "")) {
      return NextResponse.json(
        { error: "Invalid mobile number." },
        { status: 400 }
      );
    }

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount < 1 ||
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
        { error: "Payment API credentials are missing." },
        { status: 500 }
      );
    }

    const orderId = "ORD-" + randomUUID();

    const body = JSON.stringify({
      order_id: orderId,
      amount: paymentAmount,
      currency: "INR",
      method: "upi",
      customer_phone: phone
    });

    const signature = createHmac("sha256", apiSecret)
      .update(body, "utf8")
      .digest("hex");

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
      console.error("SunPay response status:", response.status);

      return NextResponse.json(
        { error: "Payment gateway rejected the request." },
        { status: 502 }
      );
    }

    let checkout;

    try {
      checkout = new URL(data.checkout_url);
    } catch {
      return NextResponse.json(
        { error: "Invalid checkout URL received." },
        { status: 502 }
      );
    }

    if (
      checkout.protocol !== "https:" ||
      checkout.hostname !== "ttpay.buzz"
    ) {
      return NextResponse.json(
        { error: "Untrusted checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: checkout.toString(),
      order_id: orderId
    });

  } catch (error) {
    console.error("Payment error:", error);

    return NextResponse.json(
      { error: "Unable to create payment. Please try again." },
      { status: 500 }
    );
  }
}
