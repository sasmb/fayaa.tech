/** Remove Wasp's static fallback title so the React 19 route title is unique. */
export function removeWaspFallbackTitle(
  html: string,
  fallbackTitle: string,
): string {
  const escapedTitle = fallbackTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(`<title>${escapedTitle}<\\/title>`), "");
}
