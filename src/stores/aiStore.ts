import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIActionCardData } from '@/services/aiService';

export type AIProvider = 'ollama' | 'openai' | 'custom';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionCard?: AIActionCardData;
  actionExecuted?: boolean;
}

export interface AIConfig {
  provider: AIProvider;
  baseUrl: string;       // e.g. http://localhost:11434 for Ollama
  apiKey: string;        // for OpenAI or custom
  model: string;         // e.g. llama3.1:8b or gpt-4o-mini
}

interface AIState {
  config: AIConfig;
  conversations: AIMessage[];
  panelOpen: boolean;
  isLoading: boolean;

  setConfig: (config: Partial<AIConfig>) => void;
  addMessage: (msg: Omit<AIMessage, 'id' | 'timestamp'>) => AIMessage;
  markActionExecuted: (msgId: string) => void;
  clearConversation: () => void;
  setPanelOpen: (open: boolean) => void;
  setLoading: (v: boolean) => void;
}

function genId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      config: {
        provider: 'ollama',
        baseUrl: 'http://localhost:11434',
        apiKey: '',
        model: 'llama3.1:8b',
      },
      conversations: [],
      panelOpen: false,
      isLoading: false,

      setConfig: (c) => set(s => ({ config: { ...s.config, ...c } })),

      addMessage: (msg) => {
        const full: AIMessage = { ...msg, id: genId(), timestamp: new Date().toISOString() };
        set(s => ({ conversations: [...s.conversations, full] }));
        return full;
      },

      markActionExecuted: (msgId) => {
        set(s => ({
          conversations: s.conversations.map(m => m.id === msgId ? { ...m, actionExecuted: true } : m),
        }));
      },

      clearConversation: () => set({ conversations: [] }),
      setPanelOpen: (open) => set({ panelOpen: open }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'freshflow-ai',
      partialize: (s) => ({ config: s.config, conversations: s.conversations }),
    }
  )
);

