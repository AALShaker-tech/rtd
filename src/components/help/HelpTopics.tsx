"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { articlesForRole, type HelpRole } from "@/content/help";

/**
 * Help landing page: a searchable, task-first topics index for one role.
 * Content is the single shared registry, filtered to what this role may see.
 */
export function HelpTopics({ role, basePath }: { role: HelpRole; basePath: string }) {
  const { t, pick, locale } = useI18n();
  const [query, setQuery] = useState("");

  const articles = useMemo(() => articlesForRole(role), [role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => {
      const hay = `${a.title[locale]} ${a.summary[locale]} ${a.title.en} ${a.title.ar}`.toLowerCase();
      return hay.includes(q);
    });
  }, [articles, query, locale]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-charcoal">{pick(t.help.title)}</h1>
        <p className="mt-1 text-sm text-charcoal/55">{pick(t.help.subtitle)}</p>
      </div>

      {articles.length > 3 && (
        <div className="relative max-w-md">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick(t.help.searchPlaceholder)}
            aria-label={pick(t.help.searchPlaceholder)}
            className="field-input ps-10"
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-charcoal/30"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="luxe-card p-8 text-center text-sm text-charcoal/40">
          {articles.length === 0 ? pick(t.help.empty) : pick(t.help.noResults)}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((a) => (
            <Link
              key={a.slug}
              href={`${basePath}/${a.slug}`}
              className="luxe-card luxe-card-hover group flex flex-col p-5"
            >
              <h2 className="font-serif text-base font-semibold text-charcoal group-hover:text-gold-dark">
                {pick(a.title)}
              </h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-charcoal/55">{pick(a.summary)}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold-dark">
                {pick(t.help.readMore)}
                <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
