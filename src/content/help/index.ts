import { HELP_ARTICLES } from "./articles";
import type { HelpArticle, HelpBlock, HelpRole } from "./types";

export type { HelpArticle, HelpBlock, HelpRole } from "./types";
export { HELP_ARTICLES } from "./articles";

/** Articles a given dashboard may see, in display order. */
export function articlesForRole(role: HelpRole): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.roles.includes(role)).sort((a, b) => a.order - b.order);
}

/** A single article, but only if the role is allowed to see it (else undefined,
 * so a driver can't deep-link into an admin-only slug). */
export function articleForRole(slug: string, role: HelpRole): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug && a.roles.includes(role));
}

/** Every screenshot the guide references, for the capture checklist. */
export function referencedScreenshots(): { slug: string; file: string; block: Extract<HelpBlock, { kind: "image" }> }[] {
  const out: { slug: string; file: string; block: Extract<HelpBlock, { kind: "image" }> }[] = [];
  for (const article of HELP_ARTICLES) {
    for (const block of article.body) {
      if (block.kind === "image") out.push({ slug: article.slug, file: block.file, block });
    }
  }
  return out;
}
