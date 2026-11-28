import { useEffect } from "react";

/**
 * FAYAA is a dark, cinema-first product. Pages that render outside the
 * studio shell call this to switch the shared theme tokens to dark while
 * they are mounted, and restore whatever was there on unmount.
 */
export function useDarkSurface() {
  useEffect(() => {
    const html = document.documentElement;
    const prevTheme = html.getAttribute("data-theme");
    const hadDark = html.classList.contains("dark");
    html.setAttribute("data-theme", "default-dark");
    html.classList.add("dark");
    return () => {
      if (prevTheme) html.setAttribute("data-theme", prevTheme);
      else html.removeAttribute("data-theme");
      if (!hadDark) html.classList.remove("dark");
    };
  }, []);
}
