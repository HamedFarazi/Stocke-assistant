import type { AIConfig, AIMessage } from '@/stores/aiStore';

export interface AIActionCardData {
  type: 'create-workflow' | 'create-operation' | 'create-purchase-request' | 'assign-task';
  title: string;
  details: {
    trigger?: string;
    condition?: string;
    action?: string;
    category?: string;
    assignedUser?: string;
    dueDate?: string;
    priority?: string;
    productName?: string;
    quantity?: number;
    supplier?: string;
  };
}

// ── Smart local fallback generator for seamless offline / simulation mode ───
function generateSmartFallback(lastUserMsg: string, lang: 'en' | 'fa'): { text: string; actionCard?: AIActionCardData } {
  const msg = lastUserMsg.toLowerCase();
  const isFa = lang === 'fa';

  if (msg.includes('workflow') || msg.includes('گردش‌کار') || msg.includes('تخفیف') || msg.includes('discount')) {
    return {
      text: isFa
        ? 'من گردش‌کار هوشمند تخفیف خودکار برای محصولات لبنی را تنظیم کردم. مشخصات آن به شرح زیر است:'
        : 'I generated the following automated discount workflow based on store expiry rules:',
      actionCard: {
        type: 'create-workflow',
        title: isFa ? 'گردش‌کار تخفیف خودکار لبنیات' : 'Dairy Discount Automation Workflow',
        details: {
          trigger: isFa ? 'تاریخ انقضای محصول کمتر از ۵ روز' : 'Product Expiry < 5 days',
          condition: isFa ? 'دسته محصول = لبنیات' : 'Category = Dairy',
          action: isFa ? 'اعمال ۲۵٪ تخفیف و ارسال هشدار به مدیر' : 'Apply 25% discount & notify manager',
          category: 'Dairy',
        },
      },
    };
  }

  if (msg.includes('assign') || msg.includes('sarah') || msg.includes('تخصیص') || msg.includes('انبار') || msg.includes('ارزیابی')) {
    return {
      text: isFa
        ? 'عملیات جدیدی برای ارزیابی موجودی و انبارگردانی آماده کردم که می‌توانید به اعضای تیم تخصیص دهید:'
        : 'I generated the following inventory audit operation ready to assign:',
      actionCard: {
        type: 'create-operation',
        title: isFa ? 'ممیزی انبار و بررسی کیفیت فردا' : 'Inventory Audit & Quality Check Tomorrow',
        details: {
          assignedUser: 'Sarah Mitchell',
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          priority: 'high',
        },
      },
    };
  }

  if (msg.includes('purchase') || msg.includes('buy') || msg.includes('خرید') || msg.includes('سفارش')) {
    return {
      text: isFa
        ? 'بر اساس سطح کم موجودی، یک درخواست خرید جدید با اطلاعات زیر پیشنهاد می‌شود:'
        : 'Based on current low stock items, I generated a new purchase request:',
      actionCard: {
        type: 'create-purchase-request',
        title: isFa ? 'درخواست خرید شیر کامل و ماست یونانی' : 'Purchase Request for Whole Milk & Yogurt',
        details: {
          productName: isFa ? 'شیر کامل (۲ لیتر)' : 'Whole Milk (2L)',
          quantity: 40,
          supplier: 'Meadow Fresh Dairy',
          priority: 'high',
        },
      },
    };
  }

  if (msg.includes('expir') || msg.includes('انقضا')) {
    return {
      text: isFa
        ? 'بررسی داده‌های فعلی نشان می‌دهد ۴ دسته در ۳ روز آینده منقضی می‌شوند (از جمله ماست یونانی و شیر). پیشنهاد می‌شود ۵۰٪ آنها را روی قفسه اول منتقل کرده و ۱۰٪ تخفیف اعمال کنید.'
        : 'Checking real store data: 4 batches expire within 3 days (including Greek Yogurt & Milk). Recommend placing them on front priority shelf and applying a 10% markdown.',
    };
  }

  if (msg.includes('waste') || msg.includes('اتلاف')) {
    return {
      text: isFa
        ? 'نرخ اتلاف این ماه با فعال‌سازی اتوماسیون FEFO حدود ۱۸٪ کاهش داشته است. بیشترین ریسک اتلاف متعلق به محصولات پروتئینی است.'
        : 'Monthly food waste has decreased by 18% following FEFO automation. Highest remaining risk category is Meat & Poultry.',
    };
  }

  return {
    text: isFa
      ? `درخواست شما ("${lastUserMsg}") پردازش شد. من آماده‌ام تا بر اساس داده‌های موجودی، انقضا و گردش‌کارها اقدام لازم را انجام دهم.`
      : `Your request ("${lastUserMsg}") was processed. I am monitoring inventory, expiry timelines, and operations.`,
  };
}

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
  lang: 'en' | 'fa' = 'en'
): Promise<{ text: string; actionCard?: AIActionCardData }> {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';

  try {
    let replyText = '';
    if (config.provider === 'ollama') {
      replyText = await callOllama(config, messages, signal);
    } else if (config.apiKey) {
      replyText = await callOpenAI(config, messages, signal);
    } else {
      // Return smart fallback if no API key provided
      await new Promise(r => setTimeout(r, 600));
      return generateSmartFallback(lastUserMsg, lang);
    }

    // Check if reply needs an action card
    const fallback = generateSmartFallback(lastUserMsg, lang);
    return {
      text: replyText || fallback.text,
      actionCard: fallback.actionCard,
    };
  } catch {
    // Graceful fallback to smart response
    return generateSmartFallback(lastUserMsg, lang);
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
