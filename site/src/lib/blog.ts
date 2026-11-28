import { getCollection } from "astro:content";

export async function getPosts() {
  const posts = await getCollection("blog", ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
