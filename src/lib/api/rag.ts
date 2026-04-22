import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";

export type RagSource = {
  chunk_id: string;
  title: string;
  score: number;
};

export type RagQueryTagInference = {
  primary_domain: string;
  primary_domain_confidence: "high" | "medium" | "low";
  sport_context: string;
  sport_context_confidence: "high" | "medium" | "low";
  primary_capability: string;
  primary_capability_confidence: "high" | "medium" | "low";
  energy_system: string[];
  body_focus: string[];
  modality: string[];
  nutrition_tags: string[];
  athlete_context: string[];
  supporting_tags: string[];
};

export type RagAnswerData = {
  query: string;
  answer: string;
  sources: RagSource[];
  retrieved_count: number;
  answer_source?: "rag" | "model_knowledge";
  grounding_status?: "grounded" | "model_only";
  retrieval_attempted?: boolean;
  retrieval_overlap_detected?: boolean;
  rag_chunk_count?: number;
  fallback_reason?: string | null;
  query_tag_inference?: RagQueryTagInference;
  model: {
    answer_model: string;
    retrieval_provider: string;
    retrieval_model: string;
  };
};

type RagEnvelope = {
  success: boolean;
  message: string;
  data: RagAnswerData;
};

export type RagConversationContext = {
  query?: string;
  answer_source?: "rag" | "model_knowledge";
  query_tag_inference?: RagQueryTagInference;
  sources?: RagSource[];
};

export async function getRagAppAnswer(input: {
  query: string;
  top_k?: number;
  conversation_context?: RagConversationContext | null;
}) {
  const body: {
    query: string;
    top_k?: number;
    conversation_context?: RagConversationContext | null;
  } = {
    query: input.query,
    conversation_context: input.conversation_context || null,
  };

  if (typeof input.top_k === "number") {
    body.top_k = input.top_k;
  }

  const response = await apiRequest<RagEnvelope>(paths.rag.appAnswer, {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: 60000,
  });

  return response.data;
}
