import { HOMEPAGE_TEMPLATES_CONFIG } from "../../homepageConfig";
import { HeroComposition } from "../../../video-studio/hf/components/studio/hero-composition";
import {
  ExamplePresets,
  TEMPLATES,
  type TemplateItem,
} from "../../../video-studio/hf/components/studio/template-picker";

interface WorkflowTemplatesSectionProps {
  onUseTemplate: (template: TemplateItem) => void;
  ariaLabel?: string;
}

/**
 * Row 5 one-click Studio workflow presets section.
 */
export function WorkflowTemplatesSection({
  onUseTemplate,
  ariaLabel = "1-Click Genjutsu Templates",
}: WorkflowTemplatesSectionProps) {
  return (
    <section
      id="workflow-templates"
      aria-label={ariaLabel}
      className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0F0F11] p-6 sm:p-10"
    >
      <HeroComposition
        images={HOMEPAGE_TEMPLATES_CONFIG.heroImages}
        alt={HOMEPAGE_TEMPLATES_CONFIG.heroAlt}
      />

      <div className="flex max-w-2xl flex-col items-center gap-2 text-center">
        <span className="rounded-full border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-0.5 text-xs font-bold tracking-wider text-[#C8FF00] uppercase">
          {HOMEPAGE_TEMPLATES_CONFIG.badgeLabel}
        </span>
        <h2 className="text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
          {HOMEPAGE_TEMPLATES_CONFIG.heading}
        </h2>
        <p className="text-sm text-zinc-400">
          {HOMEPAGE_TEMPLATES_CONFIG.descriptionPrefix}{" "}
          <code className="text-[#C8FF00]">
            {HOMEPAGE_TEMPLATES_CONFIG.descriptionHighlight}
          </code>{" "}
          {HOMEPAGE_TEMPLATES_CONFIG.descriptionSuffix}
        </p>
      </div>

      <ExamplePresets
        items={TEMPLATES}
        onUse={onUseTemplate}
        tryLabel={HOMEPAGE_TEMPLATES_CONFIG.tryLabel}
        className="w-full max-w-5xl"
      />
    </section>
  );
}
