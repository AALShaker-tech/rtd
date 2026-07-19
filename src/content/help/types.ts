import type { Bilingual } from "@/lib/domain";

/**
 * Staff-facing Help Center content model — a single, typed source of truth for
 * the in-app usage guide shared by all three dashboards (admin, operations,
 * driver). Content is defined once here and role-filtered at render time; no
 * copy is duplicated per dashboard.
 *
 * Every reader-facing string is bilingual (`{ en, ar }`) and rendered through
 * `useI18n().pick`, so the guide inherits the app's RTL/LTR direction and
 * language toggle automatically — the same as the rest of the product.
 */

/** Which dashboard a reader belongs to. Mirrors the staff `UserRole`s that own
 * a dashboard (SUPERADMIN uses the admin dashboard, so it maps to `admin`). */
export type HelpRole = "admin" | "employee" | "driver";

/** A single rich-text block. Blocks (rather than raw HTML strings) keep the
 * content type-safe, XSS-free, and correct under RTL without any per-locale
 * markup — each block carries only bilingual text. */
export type HelpBlock =
  | { kind: "heading"; text: Bilingual }
  | { kind: "paragraph"; text: Bilingual }
  /** Ordered list — use for sequential instructions ("do this, then this"). */
  | { kind: "steps"; items: Bilingual[] }
  /** Unordered list — use for non-sequential points. */
  | { kind: "bullets"; items: Bilingual[] }
  /** Highlighted aside. `tone` picks the accent (defaults to `info`). */
  | { kind: "callout"; tone?: "info" | "tip" | "warning"; text: Bilingual }
  /** Deep link into a real screen (e.g. `/admin/requests`). Rendered as a
   * button so readers jump to the tool instead of hunting for it. */
  | { kind: "link"; href: string; label: Bilingual }
  /** A captioned screenshot. `file` is the basename under
   * `public/help/{locale}/…`; when the file is missing a labelled placeholder
   * renders instead (see `HelpImage`). */
  | { kind: "image"; file: string; caption: Bilingual; alt: Bilingual };

export interface HelpArticle {
  /** Stable, URL-safe id used in `/{dashboard}/help/[slug]`. */
  slug: string;
  title: Bilingual;
  /** One-line summary shown on the topics index. */
  summary: Bilingual;
  /** Which dashboards may see this article. Admin sees everything. */
  roles: HelpRole[];
  /** Sort order within the topics index (ascending). */
  order: number;
  body: HelpBlock[];
}
