import React, { useEffect } from "react";
import { LegalLayout } from "./LegalLayout";

export function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How FAYAA collects, uses, protects, and handles your personal information and uploaded media."
      lastUpdated="November 6, 2026"
      activePath="/privacy"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          1. Introduction
        </h2>
        <p>
          This Privacy Policy explains how <strong>nexusbizz</strong> ("FAYAA", "we", "us", or "our") collects, uses, shares, and protects information about you when you use our website, web platform, APIs, Model Context Protocol (MCP) server, and video synthesis services.
        </p>
        <p>
          We are committed to respecting your privacy and protecting the security of your uploaded creative assets and personal information in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          2. Information We Collect
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-[#a1a1aa]">
          <li>
            <strong>Account Data:</strong> When you register an account, we collect your email address, username, display name, profile avatar, and authentication identifiers.
          </li>
          <li>
            <strong>Uploaded Media Content:</strong> We temporarily store portrait photographs, reference images, source motion videos, and text prompts submitted to synthesize videos.
          </li>
          <li>
            <strong>Payment & Billing Data:</strong> All financial transactions, subscriptions, and credit pack payments are handled exclusively by our Merchant of Record, <strong>Paddle.com</strong>. FAYAA does not collect, receive, or store your credit card numbers, CVVs, or bank account details. We only retain anonymized customer tokens, plan status, and transaction IDs required to manage your compute wallet balance.
          </li>
          <li>
            <strong>Log & Device Data:</strong> We automatically collect standard technical access logs, IP addresses, browser types, device form factors, and generation status timestamps.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          3. How We Use Your Information
        </h2>
        <p>We use the collected information for the following purposes:</p>
        <ul className="list-disc pl-5 space-y-2 text-[#a1a1aa]">
          <li>To render and generate synthesized motion-transfer videos requested through the Studio or Claude MCP server.</li>
          <li>To manage user accounts, authenticate sessions, and track credit balances.</li>
          <li>To prevent fraudulent activity, security abuses, and non-consensual deepfake generation.</li>
          <li>To provide customer support and respond to inquiries.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          4. Third-Party Service Providers
        </h2>
        <p>We work with trusted third-party service providers who process data strictly under our direction:</p>
        <ul className="list-disc pl-5 space-y-2 text-[#a1a1aa]">
          <li>
            <strong>Paddle.com:</strong> Payment processing, fraud detection, VAT collection, and subscription invoicing as Merchant of Record.
          </li>
          <li>
            <strong>Higgsfield AI:</strong> Deep learning inference engine for Genjutsu motion transfer video rendering.
          </li>
          <li>
            <strong>Amazon Web Services (AWS):</strong> Encrypted cloud object storage (S3) and CloudFront CDN for streaming media files.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          5. Data Retention & Deletion
        </h2>
        <p>
          We retain your account data and video generation history as long as your account remains active. You may delete any past video generation directly from your account gallery or request complete account erasure at any time by emailing us at <a href="mailto:sam@nepocommerce.com" className="text-fy-accent hover:underline">sam@nepocommerce.com</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          6. Your Privacy Rights (GDPR & CCPA)
        </h2>
        <p>
          Depending on your location, you have statutory rights concerning your personal data, including the right to access, rectify, export, or delete your information, and the right to object to or restrict certain processing activities. To exercise any of these rights, please contact us.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          7. Security
        </h2>
        <p>
          We implement industry-standard technical and organizational security measures, including HTTPS encryption in transit, cryptographic password hashing, role-based access controls, and signed S3 upload URLs to protect your personal information against unauthorized access, alteration, or disclosure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          8. Contact Information
        </h2>
        <div className="p-4 rounded-xl bg-[#131317] border border-[#22222b] space-y-1 text-xs">
          <p className="font-semibold text-white">Data Protection Officer / nexusbizz</p>
          <p>Email: <a href="mailto:sam@nepocommerce.com" className="text-fy-accent hover:underline">sam@nepocommerce.com</a></p>
          <p>Website: <a href="https://fayaa-studio-client.fly.dev" className="text-fy-accent hover:underline">https://fayaa-studio-client.fly.dev</a></p>
        </div>
      </section>
    </LegalLayout>
  );
}

