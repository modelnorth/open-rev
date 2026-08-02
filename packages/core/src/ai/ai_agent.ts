/**
 * OpenRev RAG-Backed AI Copilot & Autonomous Agent Engine
 * 
 * Supports OpenAI, Anthropic, Ollama, vLLM, LM Studio, and LiteLLM providers.
 * Queries Knowledge Graph & RAG index instead of raw APK files.
 *
 * STATUS: EXPERIMENTAL — requires an LLM provider (API key or local model).
 * The real provider call is NOT implemented. These methods never fabricate
 * analysis findings: without a configured, working provider they return an
 * honest error instead of canned "results". See docs/RELEASE_CRITERIA.md gate G14.
 */

import { RAGIndexer } from '../rag/rag_indexer';
import { ArtifactKnowledgeGraph } from '../graph/knowledge_graph';
import { OpenRevError, OpenRevErrorCode } from '../errors/openrev_error';

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'vllm' | 'lmstudio' | 'litellm';
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

export class AIAgentEngine {
  private config: AIProviderConfig;
  private rag: RAGIndexer;
  private graph: ArtifactKnowledgeGraph;

  constructor(config: AIProviderConfig, rag: RAGIndexer, graph: ArtifactKnowledgeGraph) {
    this.config = config;
    this.rag = rag;
    this.graph = graph;
  }

  public get configuredProvider(): string {
    return this.config.provider;
  }

  public async askCopilot(userPrompt: string): Promise<string> {
    console.error(`[AIAgentEngine] Copilot requested for prompt: "${userPrompt}" via provider: ${this.config.provider}`);
    if (!this.config.apiKey) {
      throw new OpenRevError({
        code: OpenRevErrorCode.CAPABILITY_NOT_FOUND,
        message: `AI copilot is experimental and not configured: no apiKey for provider "${this.config.provider}".`,
        cause: 'The real LLM provider call is not implemented.',
        remediation: 'Set an LLM provider config or use the real pipeline tools instead (analyze/graph/search/report).'
      });
    }
    throw new OpenRevError({
      code: OpenRevErrorCode.CAPABILITY_NOT_FOUND,
      message: `AI copilot is experimental; real provider calls are not implemented (provider "${this.config.provider}").`,
      cause: 'No HTTP integration with the LLM provider exists yet.',
      remediation: 'Use the real pipeline tools instead (analyze/graph/search/report).'
    });
  }

  public async runAutonomousAgentPlan(goal: string): Promise<{ plan: string[]; executionLog: string[] }> {
    throw new OpenRevError({
      code: OpenRevErrorCode.CAPABILITY_NOT_FOUND,
      message: `Autonomous agent loop is experimental and not implemented (goal: "${goal}").`,
      cause: 'No real multi-step agent execution exists.',
      remediation: 'Drive the pipeline steps yourself via analyze/graph/search/report tools.'
    });
  }
}
