import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Playbook コレクション。
 * `src/content/playbook/*.md` を 1 ファイル＝1 セクション（スライド束）として扱う。
 */
const playbook = defineCollection({
  loader: glob({ base: "./src/content/playbook", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    summary: z.string().optional(),
    icon: z.string().optional(),
    // 既存ファイル群で使われているトークン。未定義値があっても落ちないよう緩めに。
    color: z
      .enum(["magenta", "cyan", "amber", "green", "phosphor"])
      .optional(),
    order: z.number().default(999),
    category: z.string().optional(),
    related: z.array(z.string()).optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
          group: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = { playbook };
