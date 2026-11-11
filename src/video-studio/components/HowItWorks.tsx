import React from "react";

export function HowItWorks() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-lg font-bold text-white">How Genjutsu Motion Control Works</h2>
      <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <h3 className="font-bold text-lime-400">1. Upload 1 Character Photo</h3>
          <p>
            Genjutsu locks your avatar's face, body proportions, clothing, and textures in a single latent representation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <h3 className="font-bold text-lime-400">2. Select Any Driving Motion (Templates)</h3>
          <p>
            Pick a viral routine from the Motion Library or upload a custom 4-30s video. The AI extracts body kinematics, bone joints, and camera shake.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <h3 className="font-bold text-lime-400">3. Scene Control (Video vs Image Background)</h3>
          <p>
            Toggle whether you want your character placed inside the original video's environment, or keep the photo's original backdrop!
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <h3 className="font-bold text-lime-400">4. The Restaurant Buzzer</h3>
          <p>
            Instead of your browser lagging while refreshing every few seconds, the job renders safely in the cloud. As soon as it finishes, your buzzer flashes and your video is ready!
          </p>
        </div>
      </div>
    </div>
  );
}
