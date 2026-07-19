import { HelpArticleView } from "@/components/help/HelpArticleView";

export default async function DriverHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <HelpArticleView slug={slug} role="driver" basePath="/driver/help" />;
}
