"use client";

import { DashboardGate } from "@/components/layout/DashboardGate";
import { dashboardPanelClass } from "@/lib/auth-ui";
import {
  getRagAppAnswer,
  type RagAnswerData,
  type RagConversationContext,
} from "@/lib/api/rag";
import { FormEvent, useState } from "react";

export default function RagPage() {
  const [query, setQuery] = useState("How should golfers warm up before a round?");
  const [topK, setTopK] = useState(5);
  const [result, setResult] = useState<RagAnswerData | null>(null);
  const [previousResolvedContext, setPreviousResolvedContext] = useState<RagConversationContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await getRagAppAnswer({
        query,
        top_k: topK,
        conversation_context: previousResolvedContext,
      });
      setResult(response);
      setPreviousResolvedContext({
        query: response.query,
        answer_source: response.answer_source,
        query_tag_inference: response.query_tag_inference,
        sources: response.sources,
      });
    } catch (e) {
      const message =
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string"
          ? ((e as { message: string }).message || "Failed to fetch grounded answer")
          : "Failed to fetch grounded answer";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardGate>
      <div className="w-full max-w-4xl space-y-4">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">RAG Test</h2>
          <p className="mt-1 text-sm text-gray-500">Endpoint: /rag/app/answer</p>
        </header>

        <section className={dashboardPanelClass}>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-900">Query</span>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-neutral-900 outline-none focus:ring-2 focus:ring-[#046A38]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-900">Top K (optional)</span>
              <input
                type="number"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-neutral-900 outline-none focus:ring-2 focus:ring-[#046A38]"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#046A38] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#035532] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : "Get Answer"}
            </button>
          </form>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </section>

        {result ? (
          <section className={dashboardPanelClass}>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-neutral-700">
              <p>
                answer_source: <span className="font-medium">{result.answer_source || "unknown"}</span>
              </p>
              <p>
                grounding_status: <span className="font-medium">{result.grounding_status || "unknown"}</span>
              </p>
            </div>

            <h3 className="text-lg font-semibold text-neutral-900">Answer</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{result.answer}</p>

            {result.answer_source === "rag" && result.sources.length > 0 ? (
              <>
                <h4 className="mt-6 text-base font-semibold text-neutral-900">Sources</h4>
                <ul className="mt-2 space-y-2">
                  {result.sources.map((source) => (
                    <li key={source.chunk_id} className="rounded-lg border border-gray-200 p-3 text-sm">
                      <p className="font-medium text-neutral-900">{source.title}</p>
                      <p className="text-gray-500">chunk_id: {source.chunk_id}</p>
                      <p className="text-gray-500">score: {source.score}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {result.answer_source === "model_knowledge" ? (
              <p className="mt-4 text-sm text-gray-600">
                No retrieved sources are shown because this answer used model knowledge fallback.
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </DashboardGate>
  );
}
