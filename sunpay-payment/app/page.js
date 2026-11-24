
"use client";

import { useState } from "react";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function payNow(e) {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const value = Number(amount);

    if (!Number.isFinite(value) || value < 1 || value > 1000000) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          amount: value
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment request failed.");
      }

      if (!data.checkout_url) {
        throw new Error("Checkout URL not received.");
      }

      window.location.href = data.checkout_url;

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="main">
      <div className="payment-card">

        <div className="shield">✓</div>

        <div className="safe">SAFE & SECURE</div>

        <h1>Secure Payment</h1>

        <p className="subtitle">
          Fast, Simple & Secure Online Payments
        </p>

        <form onSubmit={payNow}>

          <label>Enter Number</label>

          <input
            type="tel"
            inputMode="numeric"
            placeholder="Enter 10-digit mobile number"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value.replace(/\D/g, "").slice(0, 10)
              )
            }
            required
          />

          <label>Enter Amount</label>

          <div className="amount-box">
            <span>₹</span>
            <input
              type="number"
              placeholder="Enter amount"
              min="1"
              max="1000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error">{error}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "PLEASE WAIT..." : "PAY NOW →"}
          </button>

        </form>

        <div className="footer">
          <span>🔒 Secure Checkout</span>
          <span>UPI Payment</span>
        </div>

        <p className="powered">
          Payment processing by SunPay
        </p>

      </div>
    </main>
  );
}
