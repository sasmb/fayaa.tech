/**
 * SEO landing pages, one per search intent. Each becomes /<slug> through
 * src/pages/[landing].astro. Add a page by adding an entry here; clip ids
 * come from MEDIA_CLIPS in src/landing-page/homepageConfig.ts.
 */
export interface LandingPage {
  slug: string;
  /** Short label for nav and footer. */
  nav: string;
  /** <title>, ~60 characters, leads with the keyword. */
  title: string;
  /** Meta description, ~150 characters. */
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  /** Prefilled studio prompt for the main CTA. */
  prompt: string;
  heroClipId: string;
  clipIds: string[];
  steps: { title: string; body: string }[];
  useCases: { title: string; body: string }[];
  faq: { q: string; a: string }[];
}

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "ai-dance-video-generator",
    nav: "AI dance videos",
    title: "AI Dance Video Generator: Join Any Trend in Seconds",
    description:
      "Put yourself in any trending dance with one photo. FAYAA copies every move, beat and camera angle, then exports a 9:16 video ready for TikTok and Reels.",
    eyebrow: "AI dance video generator",
    h1: "Join any dance trend with one photo.",
    intro:
      "Pick a trending dance or upload the clip you want to copy. Add a photo of yourself, your character or your mascot, and FAYAA recreates every step on the beat, with the same camera moves and timing that made the original take off.",
    prompt: "Put me in this trending dance, same moves, neon rooftop",
    heroClipId: "trend-dance",
    clipIds: ["trend-dance", "ember-dance", "snap-transition", "gym-spin"],
    steps: [
      { title: "Pick the dance", body: "Start from a trending template or paste the clip you want to copy." },
      { title: "Add your photo", body: "Upload one clear photo. Add up to four references to lock face and outfit." },
      { title: "Post it", body: "Get a vertical 720p or 1080p MP4, ready for TikTok, Reels and Shorts." },
    ],
    useCases: [
      { title: "Creators", body: "Jump on a trend the same day it starts, without learning the choreography." },
      { title: "Brands and mascots", body: "Put your mascot or virtual creator in the dance everyone is doing this week." },
      { title: "Choreographers", body: "Preview a routine on different dancers and settings before the shoot." },
    ],
    faq: [
      {
        q: "Do I need to film myself dancing?",
        a: "No. One clear photo is enough. FAYAA takes the motion from the source dance and applies it to the person in your photo.",
      },
      {
        q: "Will it keep the beat of the original?",
        a: "Yes. The motion and timing come from the source clip, so every step lands where it did in the original.",
      },
      {
        q: "How long can the video be?",
        a: "Short clips are the fastest. Longer edits can run past two minutes and come back as one MP4.",
      },
    ],
  },
  {
    slug: "ai-product-video-ads",
    nav: "AI product ads",
    title: "AI Product Video Ads: Swap Your Product Into Viral Shots",
    description:
      "Turn one product photo into scroll-stopping video ads. FAYAA drops your product into clips that already work and keeps the hands, light and motion.",
    eyebrow: "AI product video ads",
    h1: "Your product, in the shot that already went viral.",
    intro:
      "Upload a product photo and pick a clip that already performs. FAYAA swaps your sneaker, bottle, outfit or logo into the shot and keeps the hands, lighting and camera exactly as filmed, so you get a native-looking ad in seconds instead of a studio day.",
    prompt: "Turn my product into a 3-second hook that stops the scroll",
    heroClipId: "sneaker-hook",
    clipIds: ["sneaker-hook", "perfume-spin", "sneaker-unbox", "burger-drop"],
    steps: [
      { title: "Pick a winning clip", body: "Choose a product hook template or bring a clip from your own feed." },
      { title: "Add your product", body: "Upload a clean product photo. Mention it in the prompt as @Image1." },
      { title: "Test variations", body: "Make several hooks from the same shot and keep the one that converts." },
    ],
    useCases: [
      { title: "E-commerce brands", body: "Ship fresh ad creative every week without booking a shoot." },
      { title: "UGC marketers", body: "Turn one strong creator clip into versions for every product in the catalog." },
      { title: "Agencies", body: "Mock up a campaign in an afternoon and show clients motion, not storyboards." },
    ],
    faq: [
      {
        q: "Can I use the videos in paid ads?",
        a: "Yes. Paid plans include commercial usage rights for what you generate.",
      },
      {
        q: "What kind of product photo works best?",
        a: "A sharp, well-lit photo of the product on its own. Plain backgrounds give the cleanest swap.",
      },
      {
        q: "Does the rest of the clip change?",
        a: "No. FAYAA keeps the hands, background, lighting and camera from the source clip and only replaces what you ask it to.",
      },
    ],
  },
  {
    slug: "ai-video-style-transfer",
    nav: "AI video restyle",
    title: "AI Video Style Transfer: Restyle Any Clip in Seconds",
    description:
      "Turn a plain clip into an anime opening, a movie trailer or a night-city edit. FAYAA restyles your footage and keeps the timing that made it work.",
    eyebrow: "AI video style transfer",
    h1: "Same clip. Brand-new look.",
    intro:
      "Restyle footage you already have. Describe the look you want, from 90s anime to film noir to a neon city at night, and FAYAA repaints every frame while keeping the motion, framing and rhythm of the original.",
    prompt: "Make this street clip look like a movie trailer",
    heroClipId: "grwm-anime",
    clipIds: ["grwm-anime", "street-interview", "ember-rooftop", "night-market-pov"],
    steps: [
      { title: "Upload your clip", body: "Any phone clip works. Short, steady shots give the cleanest results." },
      { title: "Describe the look", body: "Write the style in plain words, or add a reference image." },
      { title: "Export and post", body: "Download a vertical MP4 at up to 1080p." },
    ],
    useCases: [
      { title: "Series creators", body: "Give every episode the same signature look without an editor." },
      { title: "Musicians", body: "Turn a single performance take into a stylized music video." },
      { title: "Marketers", body: "Rework old footage for a new campaign instead of reshooting." },
    ],
    faq: [
      {
        q: "Does restyling change the motion?",
        a: "No. The motion and timing come from your clip. Only the look changes.",
      },
      {
        q: "Can I match a specific style?",
        a: "Yes. Describe it in the prompt or add a reference image for FAYAA to follow.",
      },
      {
        q: "What resolution do I get?",
        a: "720p or 1080p, in vertical 9:16 for short-form platforms.",
      },
    ],
  },
  {
    slug: "ai-tiktok-video-maker",
    nav: "AI TikTok maker",
    title: "AI TikTok Video Maker: Viral Short-Form Video in Seconds",
    description:
      "Make TikToks, Reels and Shorts with AI. Start from a trending format, add yourself or your product, and get a vertical video ready to post in seconds.",
    eyebrow: "AI TikTok video maker",
    h1: "Make the TikTok. Skip the editing.",
    intro:
      "FAYAA starts from formats that already go viral, like snap transitions, POV runs, street interviews and product hooks. Add yourself or your product, and get a vertical video that is ready to post, with no timeline, keyframes or editing skills needed.",
    prompt: "Snap transition from hoodie to an evening look on a neon street",
    heroClipId: "snap-transition",
    clipIds: ["snap-transition", "night-market-pov", "skate-dog", "cliff-freeze"],
    steps: [
      { title: "Start from a format", body: "Pick a template built on a format that already performs." },
      { title: "Make it yours", body: "Add a photo, a product or a line of text describing your twist." },
      { title: "Post in 9:16", body: "Download and post to TikTok, Reels and Shorts." },
    ],
    useCases: [
      { title: "Solo creators", body: "Post every day without spending every evening editing." },
      { title: "Small businesses", body: "Show up on short-form with content that looks native to the feed." },
      { title: "Social teams", body: "Test many hooks quickly and double down on the ones that work." },
    ],
    faq: [
      {
        q: "Do I need editing skills?",
        a: "No. There is no timeline or keyframing. You pick a format, add yourself or your product, and FAYAA handles the edit.",
      },
      {
        q: "Which platforms is it for?",
        a: "Videos come out in vertical 9:16, which fits TikTok, Instagram Reels and YouTube Shorts.",
      },
      {
        q: "Is it free to try?",
        a: "Yes. New accounts start with free credits, so you can make your first video before choosing a plan.",
      },
    ],
  },
  {
    slug: "ai-motion-transfer",
    nav: "AI motion transfer",
    title: "AI Motion Transfer: Copy Any Movement Onto Anyone",
    description:
      "Copy the motion from any video onto a new person, character or product. FAYAA Genjutsu keeps identity locked from the first frame to the last.",
    eyebrow: "AI motion transfer",
    h1: "Copy any motion onto anyone.",
    intro:
      "Motion transfer takes the movement, camera and timing from one video and applies it to a different subject. FAYAA Genjutsu reads the source clip, then recreates it with the face, outfit or character you provide, and keeps that identity steady across every frame.",
    prompt: "Copy this motion onto @Image1 and keep the camera move",
    heroClipId: "ember-sprint",
    clipIds: ["ember-sprint", "gym-spin", "ember-skate", "trend-dance"],
    steps: [
      { title: "Upload the motion", body: "Any clip with the movement you want: a dance, a sport move, a walk-in." },
      { title: "Add the subject", body: "Up to four reference images lock the face, body and outfit." },
      { title: "Pick Light or Pro", body: "Light is fast. Pro adds cinematic detail for complex moves and cloth." },
    ],
    useCases: [
      { title: "Virtual creators", body: "Keep one consistent character across every post." },
      { title: "Sports and fitness", body: "Show a move performed by anyone, anywhere." },
      { title: "Film and previs", body: "Block out a scene with stand-in footage, then recast it." },
    ],
    faq: [
      {
        q: "What is the difference between Genjutsu Light and Pro?",
        a: "Light is built for speed and stable identity. Pro is studio-grade, with finer cloth dynamics and complex camera moves.",
      },
      {
        q: "How many reference images can I use?",
        a: "Up to four, for example a face, a full-body shot and two outfit details.",
      },
      {
        q: "Are failed renders charged?",
        a: "No. Credits for failed renders are refunded automatically.",
      },
    ],
  },
];

export function getLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}
