/**
 * Public prices for the marketing pricing page.
 *
 * Checkout itself happens in the app (app.fayaa.tech/pricing, Paddle), so
 * these numbers are display copy. They mirror the studio's pricing panel
 * (src/video-studio/hf/components/studio/subscription-panel.tsx) and
 * src/payment/plans.ts. Change prices there first, then here.
 */
import { creditCostForResolution } from "../../../src/video-studio/taskSync";

export const LIGHT_720_5S = creditCostForResolution("720p", "light", 5);
export const PRO_720_5S = creditCostForResolution("720p", "pro", 5);

export interface Plan {
  id: string;
  name: string;
  blurb: string;
  monthly: number;
  annualPerMonth: number;
  creditsMonthly: number;
  creditsAnnual: number;
  highlighted?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "plus",
    name: "Plus",
    blurb: "For creators posting every week.",
    monthly: 49,
    annualPerMonth: 39,
    creditsMonthly: 1470,
    creditsAnnual: 1170,
    features: [
      "Genjutsu Light and Pro",
      "Up to 4 reference images (face and outfit lock)",
      "4 videos generating at once",
      "Up to 1080p, vertical 9:16",
      "Commercial usage rights",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    blurb: "For studios, agencies and daily posting.",
    monthly: 129,
    annualPerMonth: 109,
    creditsMonthly: 3900,
    creditsAnnual: 3270,
    highlighted: true,
    features: [
      "Everything in Plus",
      "8 videos generating at once",
      "Priority GPU queue",
      "Lowest cost per credit",
      "Commercial monetization license",
    ],
  },
];

export const CREDIT_PACKS = [
  { id: "starter", name: "Starter pack", credits: 360, price: 12 },
  { id: "creator", name: "Creator pack", credits: 1170, price: 39 },
  { id: "studio", name: "Studio pack", credits: 2670, price: 89 },
];

export const videosFor = (credits: number, cost: number) => Math.floor(credits / Math.max(1, cost));

export const PRICING_FAQ = [
  {
    q: "Is FAYAA free to try?",
    a: "Yes. New accounts get free credits to make their first videos. You only pay when you want more credits or a plan.",
  },
  {
    q: "How do credits work?",
    a: `Every video uses credits based on the model, resolution and length, and the exact cost shows before you generate. A 5-second Genjutsu Light video costs ${LIGHT_720_5S} credits at 720p and a 5-second Genjutsu Pro video costs ${PRO_720_5S} credits. Failed renders are refunded automatically.`,
  },
  {
    q: "How many videos do I get each month?",
    a: `On Plus, about ${videosFor(1470, LIGHT_720_5S)} five-second Light videos or ${videosFor(1470, PRO_720_5S)} Pro videos at 720p. On Ultra, about ${videosFor(3900, LIGHT_720_5S)} Light or ${videosFor(3900, PRO_720_5S)} Pro videos.`,
  },
  {
    q: "Do top-up credits expire?",
    a: "No. Credit packs are one-time purchases and stay on your balance while your account is active. Plan credits refresh every billing cycle.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Plans renew automatically, and you can cancel or switch plans at any time from your account.",
  },
];
