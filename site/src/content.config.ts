import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().max(170),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default("FAYAA Team"),
    tags: z.array(z.string()).default([]),
    /** Clip id from MEDIA_CLIPS shown at the top of the post. */
    clip: z.string().optional(),
    /** Landing page slug to link as the main CTA. */
    cta: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
