import { CONTROL, EXPERIMENTS, type HomepageData } from "./content";

/**
 * CSS that swaps variant content and section order based on the
 * data-x-<experiment> attributes the boot script sets on <html>.
 */
export function experimentCss(home?: HomepageData): string {
  const rules: string[] = [];
  for (const exp of EXPERIMENTS) {
    for (const variant of exp.variants) {
      if (variant.id === CONTROL) continue;
      const on = `html[data-x-${exp.id}="${variant.id}"]`;
      rules.push(`${on} [data-exp="${exp.id}"][data-variant="${CONTROL}"]{display:none}`);
      rules.push(`${on} [data-exp="${exp.id}"][data-variant="${variant.id}"]{display:contents}`);
    }
  }
  if (home) {
    const controlOrder = home.content.layout;
    controlOrder.forEach((id, i) => rules.push(`#${id}{order:${i}}`));
    for (const [key, content] of Object.entries(home.variants)) {
      const [expId, variantId] = key.split(":");
      if (content.layout.join() === controlOrder.join()) continue;
      content.layout.forEach((id, i) =>
        rules.push(`html[data-x-${expId}="${variantId}"] #${id}{order:${i}}`)
      );
    }
  }
  return rules.join("\n");
}

export function experimentBootDefs() {
  return EXPERIMENTS.map((e) => ({
    id: e.id,
    status: e.status,
    ...(e.winner ? { winner: e.winner } : {}),
    variants: e.variants.map((v) => ({ id: v.id, weight: v.weight })),
  }));
}
