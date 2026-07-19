"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { articleForRole, type HelpRole } from "@/content/help";
import { HelpBody } from "./HelpBody";

/** A single help article for one role. Renders a not-found notice (rather than
 * leaking content) if the slug is unknown or off-limits for the role. */
export function HelpArticleView({
  slug,
  role,
  basePath,
}: {
  slug: string;
  role: HelpRole;
  basePath: string;
}) {
  const { t, pick } = useI18n();
  const article = articleForRole(slug, role);

  const backLink = (
    <Link href={basePath} className="btn-ghost mb-1 px-2 py-1 text-xs">
      <span aria-hidden>←</span> {pick(t.help.backToTopics)}
    </Link>
  );

  if (!article) {
    return (
      <div className="space-y-4">
        {backLink}
        <p className="luxe-card p-8 text-center text-sm text-charcoal/50">{pick(t.help.notFound)}</p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <div>
        {backLink}
        <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(article.title)}</h1>
        <p className="mt-1 text-sm text-charcoal/55">{pick(article.summary)}</p>
      </div>
      <div className="gold-rule" />
      <HelpBody body={article.body} />
    </article>
  );
}
