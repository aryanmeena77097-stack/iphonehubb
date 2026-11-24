
"use client";

import { useState } from "react";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment(e) {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          amount: paymentAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment could not be created.");
      }

      if (!data.checkout_url) {
        throw new Error("Checkout URL was not received.");
      }

      window.location.assign(data.checkout_url);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="main">
      <div className="payment-card">

        <div className="shield">✓</div>

        <div className="secure-label">
          SAFE & SECURE
        </div>

        <h1>Secure Payment</h1>

        <p className="subtitle">
          Fast, Simple & Secure Online Payments
        </p>

        <form onSubmit={handlePayment}>

          <label htmlFor="phone">
            Enter Number
          </label>

          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="Enter 10-digit mobile number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            maxLength={10}
            required
          />

          <label htmlFor="amount">
            Enter Amount (INR)
          </label>

          <div className="amount-input">
            <span>₹</span>
            <input
              id="amount"
              type="number"
              placeholder="Enter payment amount"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "PLEASE WAIT..." : "PAY NOW →"}
          </button>

        </form>

        <div className="payment-footer">
          <span>🔒 Secure Checkout</span>
          <span>UPI Payments</span>
        </div>

        <p className="powered">
          Payment processing by SunPay
        </p>

      </div>
    </main>
  );
}
