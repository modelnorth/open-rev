import React, { useState } from 'react';
import { AIAgentEngine, RAGIndexer, ArtifactKnowledgeGraph } from '@openrev/core';

interface Props {
  graph: ArtifactKnowledgeGraph;
}

export const AiCopilot: React.FC<Props> = ({ graph }) => {
  const [prompt, setPrompt] = useState('Where is login implemented in the APK?');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your **OpenRev AI Copilot**. I query the **Artifact Knowledge Graph** and indexed RAG source snippets without needing to re-parse raw APKs.'
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const rag = new RAGIndexer(graph);
  const aiEngine = new AIAgentEngine({ provider: 'ollama', model: 'llama3' }, rag, graph);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const userMsg = prompt;
    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsGenerating(true);

    try {
      const response = await aiEngine.askCopilot(userMsg);
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Error generating response.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-purple">RAG AI Engine</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Provider: Ollama / OpenAI / Anthropic</span>
        </div>
        <span className="badge badge-blue">Knowledge Graph Query Active</span>
      </div>

      {/* Messages Stream */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              backgroundColor: m.role === 'user' ? '#1f6feb' : 'var(--bg-secondary)',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '8px',
              border: m.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
              fontSize: '12px',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}
          >
            {m.text}
          </div>
        ))}
        {isGenerating && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            AI Engine is querying Knowledge Graph and synthesizing response...
          </div>
        )}
      </div>

      {/* Input Form */}
      <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI to explain code, summarize endpoints, or draft Mermaid diagrams..."
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            outline: 'none'
          }}
        />
        <button onClick={handleSend} className="btn btn-primary">
          Send
        </button>
      </div>
    </div>
  );
};
