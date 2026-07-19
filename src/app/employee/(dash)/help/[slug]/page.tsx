import { HelpArticleView } from "@/components/help/HelpArticleView";

export default async function EmployeeHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <HelpArticleView slug={slug} role="employee" basePath="/employee/help" />;
}
