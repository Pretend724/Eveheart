import { getKnowledgeSourcesAction } from "@/lib/actions/knowledge";
import { KnowledgeBaseClient } from "@/components/dashboard/knowledge-base/knowledge-base-client";

export default async function KnowledgeBasePage() {
  const result = await getKnowledgeSourcesAction();
  const sources = result.success ? result.data : [];

  return (
    <main className="p-5 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h3 className="font-headline text-4xl font-extrabold text-foreground tracking-tight">
            知识库
          </h3>
          <p className="text-muted-foreground mt-2 text-lg">
            管理 Eveheart 的心理健康知识库，支持 RAG 向量检索增强对话。
          </p>
        </div>

        <KnowledgeBaseClient initialSources={sources} />
      </div>
    </main>
  );
}
