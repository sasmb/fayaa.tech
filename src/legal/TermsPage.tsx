import React, { useEffect } from "react";
import { LegalLayout } from "./LegalLayout";

export function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms and conditions carefully before using the FAYAA video generation platform."
      lastUpdated="November 6, 2026"
      activePath="/terms"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          1. Agreement to Terms
        </h2>
        <p>
          These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and <strong>nexusbizz</strong> ("FAYAA", "we", "us", or "our"), governing your access to and use of the FAYAA website, web applications, APIs, Model Context Protocol (MCP) services, and generative video tools (collectively, the "Service").
        </p>
        <p>
          By creating an account, accessing, or using the Service, you signify that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. If you do not agree, you must immediately discontinue use of the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          2. Merchant of Record & Payment Reseller
        </h2>
        <p>
          Our order process, payment processing, subscription management, and invoicing are conducted by our online reseller and Merchant of Record, <strong>Paddle.com Market Ltd</strong> ("Paddle").
        </p>
        <p>
          Paddle is responsible for transaction processing, VAT and applicable local sales tax collection, and customer service inquiries related to payment processing. When purchasing subscriptions or credit top-up packs on FAYAA, you enter into a commercial relationship with Paddle subject to Paddle’s Terms of Use.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          3. Description of Service
        </h2>
        <p>
          FAYAA provides an all-in-one AI content creation platform specializing in motion-transfer video synthesis, portrait animation, and generative video editing powered by deep learning models including Higgsfield Genjutsu. Users can upload source choreography videos and reference portrait images to render synthesized output videos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          4. Eligibility & User Accounts
        </h2>
        <p>
          You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to create an account and purchase subscriptions. You agree to provide accurate, current, and complete registration information and to maintain the security of your account credentials. You are solely responsible for all activities that occur under your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          5. Subscriptions, Credits, and Billing
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-[#a1a1aa]">
          <li>
            <strong>Credit Economics:</strong> FAYAA charges video generation in credits. Each render deducts credits based on the model (such as Genjutsu Light, Genjutsu Pro or Seedance), output resolution (480p, 720p, 1080p) and duration in billable seconds. The cost is shown before you generate, and failed renders are refunded.
          </li>
          <li>
            <strong>Subscription Cycles:</strong> Subscriptions (such as FAYAA Plus and FAYAA Ultra) are billed in advance on a recurring monthly or annual basis depending on your selection.
          </li>
          <li>
            <strong>Automatic Renewal:</strong> Your subscription will automatically renew at the end of each billing cycle unless cancelled prior to the renewal date.
          </li>
          <li>
            <strong>Cancellation:</strong> You may cancel your subscription at any time directly through your Account settings or via the Paddle Customer Portal. Upon cancellation, your subscription remains active until the end of your current paid billing period.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          6. Acceptable Use & Prohibited Content
        </h2>
        <p>
          You agree not to use FAYAA to generate, upload, distribute, or facilitate any of the following:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[#a1a1aa]">
          <li>Non-consensual sexual, intimate, or defamatory deepfakes of real individuals.</li>
          <li>Content that depicts child sexual exploitation or abuse.</li>
          <li>Hate speech, harassment, incitement of violence, or terrorism.</li>
          <li>Infringement of third-party copyrights, trademarks, or publicity rights without explicit authorization.</li>
          <li>Malicious automated scripts, scrapers, or reverse engineering of FAYAA or underlying model architectures.</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate any account found in violation of these safety principles without prior notice or refund.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          7. Intellectual Property & Output Ownership
        </h2>
        <p>
          <strong>Your Inputs:</strong> You retain all ownership rights in the source images, choreography videos, and audio clips you upload to the Service. You grant FAYAA a worldwide, non-exclusive license solely to process and render your requests.
        </p>
        <p>
          <strong>Rendered Videos:</strong> Between you and FAYAA, you own the videos rendered through your account, subject to your compliance with these Terms and applicable laws. You may use your generated videos for personal, creative, and commercial purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          8. Disclaimer of Warranties & Limitation of Liability
        </h2>
        <p>
          THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXUSBIZZ AND PADDLE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white tracking-tight border-b border-[#1f1f28] pb-2">
          9. Contact Us
        </h2>
        <p>
          If you have questions regarding these Terms, please contact:
        </p>
        <div className="p-4 rounded-xl bg-[#131317] border border-[#22222b] space-y-1 text-xs">
          <p className="font-semibold text-white">nexusbizz (FAYAA)</p>
          <p>Email: <a href="mailto:sam@nepocommerce.com" className="text-fy-accent hover:underline">sam@nepocommerce.com</a></p>
          <p>Website: <a href="https://fayaa-studio-client.fly.dev" className="text-fy-accent hover:underline">https://fayaa-studio-client.fly.dev</a></p>
        </div>
      </section>
    </LegalLayout>
  );
}

