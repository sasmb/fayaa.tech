import React, { useEffect } from "react";
import { LegalLayout } from "./LegalLayout";

export function RefundsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalLayout
      title="Refund Policy"
      subtitle="Our transparent policy on compute credits, subscription cancellations, and refund eligibility."
      lastUpdated="November 6, 2026"
      activePath="/refunds"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          1. Overview
        </h2>
        <p>
          At <strong>FAYAA</strong> (operated by <strong>nexusbizz</strong>), customer satisfaction and fair pricing are central to our platform. Because video synthesis incurs substantial GPU computation costs in real time, our refund policy reflects both digital consumption and consumer rights.
        </p>
        <p>
          All payments and refunds are processed securely by our Merchant of Record, <strong>Paddle.com</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          2. Automatic System Failure Credit Protection
        </h2>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#d4d4d8] space-y-2">
          <h3 className="text-sm font-bold text-emerald-400">
            Zero-Waste Guarantee for Failed Generations
          </h3>
          <p className="text-xs leading-relaxed">
            If any motion transfer or video synthesis task fails to render due to a backend technical error, GPU timeout, or engine failure, <strong>100% of the deducted compute credits are automatically refunded to your account wallet immediately</strong>. You are never charged for incomplete or failed renders.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          3. Subscriptions (FAYAA Plus & FAYAA Ultra)
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-[#a1a1aa]">
          <li>
            <strong>14-Day Initial Cooling-Off Period:</strong> If you purchased a recurring subscription and have not utilized any of the plan’s compute credits to generate videos, you are eligible for a full refund within 14 days of your initial purchase date.
          </li>
          <li>
            <strong>Partially Used Subscriptions:</strong> Once compute credits have been consumed to render videos, the subscription becomes non-refundable for that billing cycle due to irrevocable GPU computing costs.
          </li>
          <li>
            <strong>Cancellation Anytime:</strong> You can cancel your subscription at any time with one click from your Account dashboard or via the Paddle Customer Portal. There are no cancellation fees. Upon cancellation, your subscription remains active until the end of your current paid billing period, and you will not be billed again.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          4. One-Time Credit Top-Up Packs
        </h2>
        <p>
          One-time credit pack purchases (Starter, Creator, and Studio packs) are eligible for a full refund within 14 days of purchase provided that <strong>no credits from the purchased pack have been consumed</strong>. If any credits from the pack have been used for video synthesis, the pack is non-refundable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          5. How to Request a Refund
        </h2>
        <p>
          To request a refund, please follow either of these methods:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
          <div className="p-4 rounded-xl bg-[#141419] border border-[#23232f] space-y-2">
            <h4 className="font-semibold text-white text-xs">Method 1: Contact FAYAA Support</h4>
            <p className="text-xs text-[#8e8e96]">
              Email our support team with your registered email and Paddle transaction ID:
            </p>
            <a
              href="mailto:sam@nepocommerce.com"
              className="inline-block text-xs font-bold text-fy-accent hover:underline"
            >
              sam@nepocommerce.com →
            </a>
          </div>

          <div className="p-4 rounded-xl bg-[#141419] border border-[#23232f] space-y-2">
            <h4 className="font-semibold text-white text-xs">Method 2: Paddle Buyer Portal</h4>
            <p className="text-xs text-[#8e8e96]">
              Lookup your order directly on Paddle's consumer support platform:
            </p>
            <a
              href="https://paddle.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-bold text-fy-accent hover:underline"
            >
              paddle.net →
            </a>
          </div>
        </div>
        <p className="text-xs text-[#71717a]">
          Once approved, refunds are credited back to your original payment method (Credit Card, PayPal, Apple Pay, Google Pay) by Paddle within 5 to 10 business days depending on your financial institution.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          6. Contact Us
        </h2>
        <div className="p-4 rounded-xl bg-[#131317] border border-[#22222b] space-y-1 text-xs">
          <p className="font-semibold text-white">nexusbizz (FAYAA)</p>
          <p>Email: <a href="mailto:sam@nepocommerce.com" className="text-fy-accent hover:underline">sam@nepocommerce.com</a></p>
          <p>Website: <a href="https://fayaa-studio-client.fly.dev" className="text-fy-accent hover:underline">https://fayaa-studio-client.fly.dev</a></p>
        </div>
      </section>
    </LegalLayout>
  );
}

