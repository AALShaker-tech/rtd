import { HelpArticleView } from "@/components/help/HelpArticleView";

export default async function AdminHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <HelpArticleView slug={slug} role="admin" basePath="/admin/help" />;
}
