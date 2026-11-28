import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { useGenjutsuWorkspace } from "./hf/generation/stores/genjutsu-workspace";
import { StudioTemplate } from "./hf/layouts/studio";

export function VideoStudioPage() {
  usePromptFromUrl();
  return (
    <StudioTemplate
      title="FAYAA Studio"
      headline="Genjutsu Motion Transfer Studio"
    />
  );
}

/**
 * /studio?prompt=... prefills the prompt. The marketing site (fayaa.tech)
 * links here from its prompt bar and "Remix this" buttons.
 */
function usePromptFromUrl() {
  const [params, setParams] = useSearchParams();
  const hydrateFromRemix = useGenjutsuWorkspace((s) => s.hydrateFromRemix);
  const prompt = params.get("prompt");

  useEffect(() => {
    if (!prompt) return;
    hydrateFromRemix({ prompt: prompt.slice(0, 2000), resolution: "720p" });
    const next = new URLSearchParams(params);
    next.delete("prompt");
    setParams(next, { replace: true });
  }, [prompt, params, setParams, hydrateFromRemix]);
}
