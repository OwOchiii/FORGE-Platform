'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Check,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

export const DEFAULT_SYSTEM_PROMPT = `You are an AI CUSTOMER evaluating a product pitch from a sales trainee. Your role is strictly a buyer — never act as a salesperson.

RULES:
- Always respond as the customer, never as a seller
- Ask genuine buyer questions: clarifications, pricing, objections, comparisons
- Show realistic buying signals: mild skepticism early, increasing interest mid-conversation, decision focus at closing
- Keep responses to 1-3 sentences
- Never list product features in a promotional way
- Never end on an incomplete clause (avoid trailing: "but", "and", "or")
- Each response must be unique

STAGE PROGRESSION:
- Early (turns 1-2): General curiosity. Ask what the product is and who it's for.
- Mid (turns 3-4): Deeper questions. Ask about specific benefits, proof, comparisons.
- Closing (turn 5+): Decision-focused. Ask about price, implementation, support, ROI.

RESPONSE FORMAT (mandatory, every turn):
RESPONSE: <your customer reply in 1-3 sentences>
SCORE: <0-100 integer rating of the trainee's pitch quality this turn>
FEEDBACK: <1 sentence coaching tip for the trainee>`;

// ── Types ──────────────────────────────────────────────────────────────────────

export type AIConversationResources = {
  type: 'ai_conversation';
  instruction: string;
  items: string;
  systemPrompt: string;
  useDefaultPrompt: boolean;
};

type DBLesson = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  video_storage_path: string | null;
  resources: any;
  order: number;
};

interface AIConversationEditorProps {
  lesson: DBLesson;
  onSave: (updates: Partial<DBLesson>) => void;
  saving: boolean;
}

// ── Preview card (mini student simulator view) ─────────────────────────────────

function SimulatorPreviewCard({
  instruction,
  items,
}: {
  instruction: string;
  items: string;
}) {
  if (!instruction && !items) return null;

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden">
      {/* Simulator header (matches AISalesSimulator) */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-sm">Sales Pitch Preview</p>
          <p className="text-xs text-orange-100 mt-0.5">
            {items ? `Selling: ${items.substring(0, 50)}${items.length > 50 ? '...' : ''}` : 'Product not set'}
          </p>
        </div>
      </div>

      {/* Trainee instruction */}
      {instruction && (
        <div className="bg-[#0d1b2e] p-4 border-t border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Trainee Instruction
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">{instruction}</p>
        </div>
      )}

      {/* Mock conversation bubbles */}
      <div className="bg-slate-900/50 p-4 space-y-3">
        <div className="flex justify-start">
          <div className="bg-[#0f2744] border border-slate-700 rounded-2xl rounded-bl-none px-4 py-2.5 max-w-[75%]">
            <p className="text-slate-300 text-xs">
              {items
                ? `Chào bạn, tôi đang quan tâm đến ${items.substring(0, 40)}. Bạn có thể giới thiệu rõ hơn không?`
                : 'Chào bạn, bạn muốn giới thiệu sản phẩm gì?'}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-orange-500 text-white rounded-2xl rounded-br-none px-4 py-2.5 max-w-[75%]">
            <p className="text-xs italic text-orange-100 opacity-80">Trainee response here...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────────

export default function AIConversationEditor({
  lesson,
  onSave,
  saving,
}: AIConversationEditorProps) {
  const res = lesson.resources as AIConversationResources | null;

  const [title, setTitle] = useState(lesson.title);
  const [instruction, setInstruction] = useState(res?.instruction ?? '');
  const [items, setItems] = useState(res?.items ?? '');
  const [useDefaultPrompt, setUseDefaultPrompt] = useState(res?.useDefaultPrompt ?? true);
  const [customSystemPrompt, setCustomSystemPrompt] = useState(
    res?.systemPrompt && res.systemPrompt !== DEFAULT_SYSTEM_PROMPT
      ? res.systemPrompt
      : DEFAULT_SYSTEM_PROMPT
  );
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [lastEnhanced, setLastEnhanced] = useState<{
    title: string;
    instruction: string;
    items: string;
    systemPrompt: string;
  } | null>(null);

  const effectiveSystemPrompt = useDefaultPrompt ? DEFAULT_SYSTEM_PROMPT : customSystemPrompt;

  const handleEnhancePrompt = useCallback(async () => {
    setEnhancing(true);
    setEnhanceError(null);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          instruction,
          items,
          systemPrompt: effectiveSystemPrompt,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Enhancement failed');
      }

      const { enhanced } = await response.json();

      // Store originals for undo
      setLastEnhanced({ title, instruction, items, systemPrompt: customSystemPrompt });

      // Apply enhancements
      if (enhanced.title) setTitle(enhanced.title);
      if (enhanced.instruction) setInstruction(enhanced.instruction);
      if (enhanced.items) setItems(enhanced.items);
      if (enhanced.systemPrompt) {
        setCustomSystemPrompt(enhanced.systemPrompt);
        // If the prompt was enhanced and differs from default, switch to custom mode
        if (enhanced.systemPrompt !== DEFAULT_SYSTEM_PROMPT) {
          setUseDefaultPrompt(false);
          setShowPromptEditor(true);
        }
      }
    } catch (err: any) {
      setEnhanceError(err.message ?? 'Failed to enhance. Please try again.');
    } finally {
      setEnhancing(false);
    }
  }, [title, instruction, items, effectiveSystemPrompt, customSystemPrompt]);

  const handleUndoEnhance = () => {
    if (!lastEnhanced) return;
    setTitle(lastEnhanced.title);
    setInstruction(lastEnhanced.instruction);
    setItems(lastEnhanced.items);
    setCustomSystemPrompt(lastEnhanced.systemPrompt);
    setLastEnhanced(null);
  };

  const handleResetToDefault = () => {
    setCustomSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  function handleSave() {
    onSave({
      title: title.trim(),
      content: instruction.trim(),
      video_url: null,
      video_storage_path: null,
      resources: {
        type: 'ai_conversation',
        instruction: instruction.trim(),
        items: items.trim(),
        systemPrompt: effectiveSystemPrompt,
        useDefaultPrompt,
      } as AIConversationResources,
    });
  }

  const isValid = title.trim().length > 0;

  return (
    <div className="space-y-7">

      {/* ── Task Title ─────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Task Title <span className="text-red-400">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#0d1b2e] border-slate-600 text-white text-base font-medium focus:border-blue-500 placeholder:text-slate-500"
          placeholder="e.g. Sell a SaaS product to a skeptical enterprise buyer"
        />
        <p className="text-xs text-slate-500 mt-1">
          Shown to trainees as the lesson title in the course curriculum.
        </p>
      </div>

      {/* ── Instruction ────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Instruction</label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={4}
          placeholder="Describe the scenario for the trainee. What is their goal? What context should they keep in mind?&#10;&#10;Example: You are a sales rep pitching our CRM software to a decision-maker at a mid-size company. Your goal is to convince them to book a demo call."
          className="w-full px-3 py-2.5 rounded-lg bg-[#0d1b2e] border border-slate-600 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
        />
        <p className="text-xs text-slate-500 mt-1">
          This is shown to the trainee before the AI conversation starts.
        </p>
      </div>

      {/* ── Items / Product ────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Product / Items to Sell
        </label>
        <textarea
          value={items}
          onChange={(e) => setItems(e.target.value)}
          rows={3}
          placeholder="Describe the product or service the trainee will pitch to the AI customer.&#10;&#10;Example: CloudSync Pro — a cloud storage and collaboration platform. Key features: real-time sync, 99.9% uptime, enterprise SSO. Pricing from $15/user/month."
          className="w-full px-3 py-2.5 rounded-lg bg-[#0d1b2e] border border-slate-600 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
        />
        <p className="text-xs text-slate-500 mt-1">
          The AI customer will ask questions about this product. The more detail, the better the simulation.
        </p>
      </div>

      {/* ── Enhance Prompt button ──────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-950/40 border border-blue-800/40">
        <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-300 mb-0.5">Enhance with AI</p>
          <p className="text-xs text-blue-400/80 leading-relaxed">
            Improve the task title, instruction, product description, and system prompt using Gemini AI for a more realistic and effective simulation.
          </p>
          {enhanceError && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-xs bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {enhanceError}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastEnhanced && (
            <Button
              onClick={handleUndoEnhance}
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </Button>
          )}
          <Button
            onClick={handleEnhancePrompt}
            disabled={enhancing || (!title && !instruction && !items)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs font-medium"
          >
            {enhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Enhance Prompt
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── System Prompt ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">System Prompt</label>
          <div className="flex items-center gap-1.5 bg-[#0d1b2e] border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setUseDefaultPrompt(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                useDefaultPrompt
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => {
                setUseDefaultPrompt(false);
                setShowPromptEditor(true);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !useDefaultPrompt
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {useDefaultPrompt ? (
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f2744] border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-300">
                  Using default system prompt (recommended for best results)
                </span>
              </div>
              <button
                onClick={() => setShowPromptEditor(!showPromptEditor)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPromptEditor ? (
                  <>Hide <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Preview <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
            {showPromptEditor && (
              <div className="relative">
                <textarea
                  value={DEFAULT_SYSTEM_PROMPT}
                  readOnly
                  rows={14}
                  className="w-full px-4 py-3 bg-[#0d1b2e]/80 text-slate-400 text-xs font-mono leading-relaxed resize-none focus:outline-none cursor-default"
                />
                <div className="absolute inset-0 pointer-events-none rounded-b-xl ring-1 ring-inset ring-slate-700/50" />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-purple-800/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-purple-900/20 border-b border-purple-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs font-medium text-purple-300">Custom system prompt</span>
              </div>
              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset to default
              </button>
            </div>
            <textarea
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              rows={18}
              placeholder="Enter your custom system prompt for the AI customer..."
              className="w-full px-4 py-3 bg-[#0d1b2e] text-slate-200 text-xs font-mono leading-relaxed resize-y focus:outline-none border-0 focus:ring-1 focus:ring-purple-600"
            />
            <div className="flex items-start gap-2 px-4 py-2.5 bg-[#0d1b2e] border-t border-slate-700">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/80 leading-relaxed">
                Make sure your prompt includes the mandatory response format:{' '}
                <span className="font-mono text-amber-300">RESPONSE: / SCORE: / FEEDBACK:</span> so
                scoring works correctly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Student Preview ────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          {showPreview ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span className="font-medium">Trainee view preview</span>
        </button>
        {showPreview && (
          <SimulatorPreviewCard instruction={instruction} items={items} />
        )}
      </div>

      {/* ── Save button ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving || !isValid}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Task
            </>
          )}
        </Button>
        {!isValid && (
          <p className="text-xs text-amber-400">Task title is required</p>
        )}
      </div>
    </div>
  );
}
