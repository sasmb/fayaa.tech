import aiReadyDark from "../client/static/assets/aiready-dark.webp";
import aiReady from "../client/static/assets/aiready.webp";
import { HighlightedFeature } from "./components/HighlightedFeature";

export function AIReady() {
  return (
    <HighlightedFeature
      name="Motion Control: Copy Any Choreography"
      description="Record a quick video on your phone—dancing, gesturing, or walking—and transfer those exact movements to your digital character instantly. Maintain fluid movement, natural physics, and authentic lighting without 3D animation skills or green screens."
      highlightedComponent={<AIReadyExample />}
      direction="row-reverse"
    />
  );
}

function AIReadyExample() {
  return (
    <div className="w-full">
      <img
        src={aiReady}
        alt="AI Ready"
        loading="lazy"
        className="dark:hidden"
      />
      <img
        src={aiReadyDark}
        alt="AI Ready"
        loading="lazy"
        className="hidden dark:block"
      />
    </div>
  );
}
