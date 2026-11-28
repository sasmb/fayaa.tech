import { SectionHeading } from "../../../client/design";
import type { LandingContent } from "../../../marketing/landingContent";
import {
  ExamplePresets,
  TEMPLATES,
  type TemplateItem,
} from "../../../video-studio/hf/components/studio/template-picker";

/** One-click presets that preload the studio. */
export function WorkflowTemplatesSection({
  content,
  onUseTemplate,
  ariaLabel,
}: {
  content: LandingContent["templates"];
  onUseTemplate: (template: TemplateItem) => void;
  ariaLabel: string;
}) {
  return (
    <section
      id="workflow-templates"
      aria-label={ariaLabel}
      className="mx-auto flex w-full max-w-[1440px] scroll-mt-20 flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <SectionHeading eyebrow={content.eyebrow} title={content.title} description={content.description} />
      <div className="fy-card p-4 sm:p-8">
        <ExamplePresets items={TEMPLATES} onUse={onUseTemplate} tryLabel={content.tryLabel} className="w-full" />
      </div>
    </section>
  );
}
