import { useState, useRef, useEffect, useCallback } from 'react';
import { useAIStore } from '@/stores/aiStore';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { sendAIMessage, buildSystemPrompt, type AIActionCardData } from '@/services/aiService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Trash2, Settings, Bot, User,
  Loader2, AlertCircle, Sparkles, CheckCircle2, GitBranch, ClipboardList, ShoppingCart, Plus,
} from 'lucide-react';
import { format } from 'date-fns';

export function AIAssistantPanel() {
  const { config, conversations, panelOpen, isLoading, addMessage, markActionExecuted, clearConversation, setPanelOpen, setLoading, setConfig } = useAIStore();
  const { addWorkflow, addOperation, addPurchaseRequest, addActivity, addNotification, currentUserId } = useAppStore();
  const { t, isRTL, language } = useTranslation();
  const isFa = language === 'fa';

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (panelOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [panelOpen]);

  const suggestedQuestions = isFa ? [
    'ایجاد گردش‌کار تخفیف خودکار لبنیات',
    'تخصیص ارزیابی موجودی به سارا برای فردا',
    'درخواست خرید شیر کامل و ماست یونانی',
    'چه محصولاتی به زودی منقضی می‌شوند؟',
  ] : [
    'Create discount workflow for dairy products',
    'Assign inventory audit to Sarah tomorrow',
    'Create purchase request for Whole Milk',
    'Which products are expiring soon?',
  ];

  const handleSend = useCallback(async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isLoading) return;

    setInput('');
    setError(null);

    const systemMsg = { role: 'system' as const, content: buildSystemPrompt(language) };
    addMessage({ role: 'user', content: message });

    const allMessages = [
      systemMsg,
      ...conversations.map(m => ({ ...m })),
      { id: '', role: 'user' as const, content: message, timestamp: '' },
    ];

    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const reply = await sendAIMessage(config, allMessages as import('@/stores/aiStore').AIMessage[], abortRef.current.signal, language);
      addMessage({
        role: 'assistant',
        content: reply.text || (isFa ? 'پاسخی دریافت نشد.' : 'No response received.'),
        actionCard: reply.actionCard,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      const friendlyMsg = isFa
        ? `خطا در اتصال به ${config.provider}. آدرس و تنظیمات را بررسی کنید.\n\nجزئیات: ${msg}`
        : `Failed to connect to ${config.provider}. Check your settings.\n\nDetails: ${msg}`;
      setError(friendlyMsg);
      addMessage({ role: 'assistant', content: friendlyMsg });
    } finally {
      setLoading(false);
    }
  }, [input, isLoading, conversations, config, language, addMessage, setLoading, isFa]);

  function handleExecuteAction(msgId: string, actionCard: AIActionCardData) {
    if (actionCard.type === 'create-workflow') {
      addWorkflow({
        name: actionCard.title,
        description: actionCard.details.action ?? 'AI Generated Workflow',
        status: 'active',
        nodes: [
          { id: 'n1', type: 'trigger', position: { x: 50, y: 100 }, data: { nodeType: 'expiry-approaching', category: 'trigger', label: actionCard.details.trigger ?? 'Expiry < 5 days', description: 'Trigger on near expiry', config: {} } },
          { id: 'n2', type: 'condition', position: { x: 50, y: 220 }, data: { nodeType: 'product-category', category: 'condition', label: actionCard.details.condition ?? 'Category = Dairy', description: 'Condition filter', config: {} } },
          { id: 'n3', type: 'action', position: { x: 50, y: 340 }, data: { nodeType: 'create-operation', category: 'action', label: actionCard.details.action ?? 'Create Operation', description: 'Action execution', config: {} } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n2', target: 'n3' },
        ],
        createdBy: currentUserId,
      });

      addNotification({
        type: 'workflow-executed',
        title: isFa ? `گردش‌کار جدید ایجاد شد` : `New Workflow Created`,
        message: `${actionCard.title} ${isFa ? 'ایجاد شد و فعال گردید.' : 'was created and activated.'}`,
        isRead: false,
        relatedEntityId: null,
        relatedEntityType: 'workflow',
      });
    } else if (actionCard.type === 'create-operation') {
      addOperation({
        title: actionCard.title,
        description: isFa ? 'عملیات ایجاد شده توسط دستیار هوش مصنوعی' : 'Operation created by AI Copilot assistant',
        type: 'batch-inspect',
        priority: (actionCard.details.priority as any) ?? 'high',
        status: 'pending',
        productId: null,
        batchId: null,
        assignedUserId: 'user-002',
        dueDate: actionCard.details.dueDate ? new Date(actionCard.details.dueDate).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        sourceWorkflowId: null,
        sourceWorkflowName: 'AI Copilot',
        completedAt: null,
        completedBy: null,
        notes: null,
      });

      addNotification({
        type: 'operation-assigned',
        title: isFa ? `عملیات جدید اضافه شد` : `New Operation Added`,
        message: actionCard.title,
        isRead: false,
        relatedEntityId: null,
        relatedEntityType: 'operation',
      });
    } else if (actionCard.type === 'create-purchase-request') {
      addPurchaseRequest({
        productId: 'prod-001',
        productName: actionCard.details.productName ?? 'Whole Milk',
        supplierId: 'sup-001',
        supplierName: actionCard.details.supplier ?? 'Meadow Fresh Dairy',
        quantity: actionCard.details.quantity ?? 40,
        reason: isFa ? 'درخواست خرید ایجاد شده توسط دستیار AI' : 'Purchase request created by AI Copilot',
        priority: (actionCard.details.priority as any) ?? 'high',
        expectedDelivery: new Date(Date.now() + 172800000).toISOString(),
        requester: 'Emma Wilson',
        assignee: null,
        status: 'pending',
      });

      addNotification({
        type: 'low-stock',
        title: isFa ? `درخواست خرید ثبت شد` : `Purchase Request Created`,
        message: `${actionCard.details.productName ?? 'Product'} (${actionCard.details.quantity ?? 40} units)`,
        isRead: false,
        relatedEntityId: null,
        relatedEntityType: 'product',
      });
    }

    markActionExecuted(msgId);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function saveSettings() {
    setConfig(localConfig);
    setShowSettings(false);
  }

  const labels = {
    title:         isFa ? 'دستیار هوش مصنوعی Copilot' : 'AI Copilot Assistant',
    placeholder:   isFa ? 'سؤالی بپرسید یا نشانی دهید…' : 'Ask a question or request an action…',
    clear:         isFa ? 'پاک کردن' : 'Clear',
    settings:      isFa ? 'تنظیمات' : 'Settings',
    save:          isFa ? 'ذخیره' : 'Save',
    cancel:        isFa ? 'لغو' : 'Cancel',
    provider:      isFa ? 'سرویس‌دهنده' : 'Provider',
    baseUrl:       isFa ? 'آدرس API' : 'Base URL',
    apiKey:        isFa ? 'کلید API' : 'API Key',
    model:         isFa ? 'مدل' : 'Model',
    thinking:      isFa ? 'در حال تحلیل و تولید پاسخ…' : 'Analyzing & generating response…',
    emptyTitle:    isFa ? 'دستیار عملیاتی FreshFlow ready' : 'FreshFlow Operational Copilot ready',
    emptySubtitle: isFa ? 'می‌توانید درخواست ساخت گردش‌کار، عملیات، یا سفارش خرید دهید.' : 'Ask questions or instruct AI to build workflows, ops & purchase requests.',
    stop:          isFa ? 'توقف' : 'Stop',
    ollamaHint:    isFa ? 'مثال: http://localhost:11434' : 'e.g. http://localhost:11434',
    openaiHint:    isFa ? 'مثال: https://api.openai.com' : 'e.g. https://api.openai.com',
  };

  return (
    <>
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden bg-black/20"
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              initial={{ x: isRTL ? '-100%' : '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? '-100%' : '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              dir={isRTL ? 'rtl' : 'ltr'}
              className={cn(
                'fixed top-0 h-full w-[380px] max-w-[95vw] bg-[#0f0f12] text-white z-50 flex flex-col shadow-2xl',
                isRTL ? 'left-0 border-r border-white/10' : 'right-0 border-l border-white/10'
              )}
            >
              {/* Header */}
              <div className={cn('flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0', isRTL && 'flex-row-reverse')}>
                <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                  <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center shadow-md">
                    <Sparkles size={14} />
                  </div>
                  <div className={cn(isRTL && 'text-right')}>
                    <p className="text-sm font-semibold">{labels.title}</p>
                    <p className="text-[11px] text-white/40">{config.model}</p>
                  </div>
                </div>
                <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                  {conversations.length > 0 && (
                    <button onClick={clearConversation}
                      className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      title={labels.clear}>
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button onClick={() => setShowSettings(!showSettings)}
                    className={cn('p-1.5 rounded-md transition-colors', showSettings ? 'text-green-400 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/10')}
                    title={labels.settings}>
                    <Settings size={14} />
                  </button>
                  <button onClick={() => setPanelOpen(false)}
                    className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Settings panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-white/10 flex-shrink-0"
                  >
                    <div className={cn('p-4 space-y-3', isRTL && 'text-right')}>
                      <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">{labels.settings}</p>

                      <div>
                        <label className="text-xs text-white/60 block mb-1">{labels.provider}</label>
                        <select
                          value={localConfig.provider}
                          onChange={e => setLocalConfig(c => ({ ...c, provider: e.target.value as import('@/stores/aiStore').AIProvider }))}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          className="w-full bg-white/10 border border-white/20 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="ollama">Ollama (local)</option>
                          <option value="openai">OpenAI / Compatible</option>
                          <option value="custom">Custom API</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-white/60 block mb-1">{labels.baseUrl}</label>
                        <input
                          type="text"
                          value={localConfig.baseUrl}
                          onChange={e => setLocalConfig(c => ({ ...c, baseUrl: e.target.value }))}
                          placeholder={localConfig.provider === 'ollama' ? labels.ollamaHint : labels.openaiHint}
                          dir="ltr"
                          className="w-full bg-white/10 border border-white/20 rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>

                      {localConfig.provider !== 'ollama' && (
                        <div>
                          <label className="text-xs text-white/60 block mb-1">{labels.apiKey}</label>
                          <input
                            type="password"
                            value={localConfig.apiKey}
                            onChange={e => setLocalConfig(c => ({ ...c, apiKey: e.target.value }))}
                            placeholder="sk-…"
                            dir="ltr"
                            className="w-full bg-white/10 border border-white/20 rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-white/60 block mb-1">{labels.model}</label>
                        <input
                          type="text"
                          value={localConfig.model}
                          onChange={e => setLocalConfig(c => ({ ...c, model: e.target.value }))}
                          placeholder={localConfig.provider === 'ollama' ? 'llama3.1:8b' : 'gpt-4o-mini'}
                          dir="ltr"
                          className="w-full bg-white/10 border border-white/20 rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>

                      <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
                        <button onClick={saveSettings}
                          className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors">
                          {labels.save}
                        </button>
                        <button onClick={() => { setShowSettings(false); setLocalConfig(config); }}
                          className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-md transition-colors">
                          {labels.cancel}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {conversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-6">
                    <div className="w-14 h-14 rounded-2xl bg-green-600/20 border border-green-600/30 flex items-center justify-center shadow-lg">
                      <Sparkles size={24} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90">{labels.emptyTitle}</p>
                      <p className="text-xs text-white/40 mt-1">{labels.emptySubtitle}</p>
                    </div>
                    <div className={cn('grid grid-cols-1 gap-1.5 w-full mt-2', isRTL && 'text-right')}>
                      {suggestedQuestions.map(q => (
                        <button key={q} onClick={() => handleSend(q)}
                          className="text-xs text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-colors text-left hover:text-white flex items-center gap-2">
                          <Sparkles size={11} className="text-green-400 flex-shrink-0" />
                          <span className="truncate">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {conversations.filter(m => m.role !== 'system').map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex gap-2.5', msg.role === 'user' ? (isRTL ? 'flex-row' : 'flex-row-reverse') : (isRTL ? 'flex-row-reverse' : 'flex-row'))}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      msg.role === 'user' ? 'bg-green-600' : 'bg-white/10'
                    )}>
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} className="text-green-400" />}
                    </div>

                    <div className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-2',
                      msg.role === 'user'
                        ? 'bg-green-700 text-white rounded-tr-sm'
                        : 'bg-white/8 text-white/90 rounded-tl-sm border border-white/10',
                      isRTL && msg.role === 'user' && '!rounded-tl-sm !rounded-tr-2xl',
                      isRTL && msg.role === 'assistant' && '!rounded-tr-sm !rounded-tl-2xl',
                    )}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Interactive Action Card */}
                      {msg.actionCard && (
                        <div className="bg-slate-950/80 border border-green-500/30 rounded-xl p-3 space-y-2 mt-2">
                          <div className="flex items-center gap-2 text-green-400 font-semibold text-xs border-b border-white/10 pb-1.5">
                            {msg.actionCard.type === 'create-workflow' && <GitBranch size={14} />}
                            {msg.actionCard.type === 'create-operation' && <ClipboardList size={14} />}
                            {msg.actionCard.type === 'create-purchase-request' && <ShoppingCart size={14} />}
                            <span>{msg.actionCard.title}</span>
                          </div>

                          <div className="space-y-1 text-[11px] text-white/70">
                            {msg.actionCard.details.trigger && (
                              <div><span className="text-white/40">Trigger:</span> {msg.actionCard.details.trigger}</div>
                            )}
                            {msg.actionCard.details.condition && (
                              <div><span className="text-white/40">Condition:</span> {msg.actionCard.details.condition}</div>
                            )}
                            {msg.actionCard.details.action && (
                              <div><span className="text-white/40">Action:</span> {msg.actionCard.details.action}</div>
                            )}
                            {msg.actionCard.details.assignedUser && (
                              <div><span className="text-white/40">Assignee:</span> {msg.actionCard.details.assignedUser}</div>
                            )}
                            {msg.actionCard.details.productName && (
                              <div><span className="text-white/40">Product:</span> {msg.actionCard.details.productName} ({msg.actionCard.details.quantity} units)</div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {msg.actionExecuted ? (
                              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 py-1 font-medium w-full justify-center">
                                <CheckCircle2 size={13} />
                                <span>{isFa ? 'ایجاد شد و در سیستم ثبت گردید' : 'Created & Recorded in System'}</span>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleExecuteAction(msg.id, msg.actionCard!)}
                                  className="flex items-center gap-1 text-[11px] font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg px-2.5 py-1 transition-colors"
                                >
                                  <Plus size={12} />
                                  <span>
                                    {msg.actionCard.type === 'create-workflow' ? (isFa ? 'ایجاد گردش‌کار' : 'Create Workflow') :
                                     msg.actionCard.type === 'create-operation' ? (isFa ? 'ایجاد عملیات' : 'Create Operation') :
                                     (isFa ? 'ایجاد درخواست خرید' : 'Create Purchase Request')}
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <p className={cn('text-[10px] opacity-40', msg.role === 'user' ? 'text-right' : 'text-left')}>
                        {format(new Date(msg.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className={cn('flex gap-2.5', isRTL && 'flex-row-reverse')}>
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Bot size={12} className="text-green-400" />
                    </div>
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin text-green-400" />
                      <span className="text-xs text-white/50">{labels.thinking}</span>
                      <button
                        onClick={() => { abortRef.current?.abort(); setLoading(false); }}
                        className="text-[10px] text-white/30 hover:text-white/60 border border-white/10 rounded px-1.5 py-0.5 ml-1"
                      >
                        {labels.stop}
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={cn('px-4 py-3 border-t border-white/10 flex-shrink-0')}>
                <div className={cn('flex items-end gap-2', isRTL && 'flex-row-reverse')}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={labels.placeholder}
                    rows={1}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-xs text-white',
                      'placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-green-500',
                      'disabled:opacity-50 max-h-32 overflow-y-auto',
                      isRTL && 'text-right'
                    )}
                    style={{ minHeight: '36px' }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <Send size={13} className={cn(isRTL && 'rotate-180')} />
                  </button>
                </div>
                <p className="text-[10px] text-white/20 mt-1.5 text-center">
                  {config.provider} · {config.model}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
