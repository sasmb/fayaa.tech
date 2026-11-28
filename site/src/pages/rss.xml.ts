import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { getPosts } from "../lib/blog";

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: "FAYAA blog",
    description: "Guides to making viral short-form video with AI.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: `/blog/${post.id}`,
    })),
  });
}
