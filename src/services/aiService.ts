import type { AIConfig, AIMessage } from '@/stores/aiStore';

// ── Ollama ────────────────────────────────────────────────────────────────────
async function callOllama(config: AIConfig, messages: AIMessage[], signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  const data = await res.json() as { message?: { content?: string } };
  return data?.message?.content ?? '';
}

// ── OpenAI-compatible (OpenAI, Together, Groq, LM Studio, etc.) ───────────────
async function callOpenAI(config: AIConfig, messages: AIMessage[], signal?: AbortSignal): Promise<string> {
  const baseUrl = config.baseUrl.endsWith('/')
    ? config.baseUrl.slice(0, -1)
    : config.baseUrl;
  const endpoint = baseUrl.includes('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    signal,
    body: JSON.stringify({
      model: config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${err}`);
  }
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data?.choices?.[0]?.message?.content ?? '';
}

// ── Main dispatcher ───────────────────────────────────────────────────────────
export async function sendAIMessage(
  config: AIConfig,
  messages: AIMessage[],
  signal?: AbortSignal,
): Promise<string> {
  switch (config.provider) {
    case 'ollama':
      return callOllama(config, messages, signal);
    case 'openai':
    case 'custom':
      return callOpenAI(config, messages, signal);
    default:
      throw new Error('Unknown AI provider');
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────
export function buildSystemPrompt(lang: 'en' | 'fa'): string {
  if (lang === 'fa') {
    return `شما دستیار هوش مصنوعی FreshFlow هستید — یک سامانه هوشمند مدیریت عملیات فروشگاه‌های مواد غذایی.
تخصص شما در این حوزه‌هاست:
- مدیریت موجودی و تاریخ انقضا (FEFO)
- کاهش اتلاف مواد غذایی
- عملیات فروشگاهی و اتوماسیون گردش‌کار
- تحلیل داده‌های فروشگاهی

همیشه به فارسی روان و حرفه‌ای پاسخ دهید. پاسخ‌های کوتاه، مفید و کاربردی بدهید.`;
  }
  return `You are the FreshFlow AI assistant — a smart operations platform for grocery stores.
Your expertise covers:
- Inventory management and expiry tracking (FEFO)
- Food waste reduction strategies
- Store operations and workflow automation
- Retail analytics and insights

Always respond in clear, professional English. Keep answers concise and actionable.`;
}
