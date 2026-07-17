import { useState } from "react";
import { Coins, Target, Calendar, StickyNote } from "lucide-react";
import { Modal } from "../../components/shared/Modal";
import { Button } from "../../components/shared/Button";
import { Input } from "../../components/shared/Input";
import { cn } from "../../lib/format";
import { GoalCategory, GoalPriority, useGoals } from "./goalsStore";
import { AIDecisionDialog } from "./AIDecisionDialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS: { key: GoalCategory; label: string; emoji: string }[] = [
  { key: "wedding", label: "الزواج", emoji: "💍" },
  { key: "home", label: "شراء منزل", emoji: "🏠" },
  { key: "car", label: "شراء سيارة", emoji: "🚗" },
  { key: "travel", label: "السفر", emoji: "✈️" },
  { key: "education", label: "التعليم", emoji: "🎓" },
  { key: "business", label: "بدء مشروع", emoji: "🚀" },
  { key: "other", label: "أخرى", emoji: "🎯" },
];

const PRIORITY_OPTIONS: { key: GoalPriority; label: string; tone: string }[] = [
  { key: "high", label: "عالية", tone: "border-danger/40 bg-danger-light text-danger-dark" },
  { key: "medium", label: "متوسطة", tone: "border-warn/40 bg-warn-light text-warn-dark" },
  { key: "low", label: "منخفضة", tone: "border-primary/30 bg-primary-light text-primary-dark" },
];

type Draft = Parameters<ReturnType<typeof useGoals>["addGoal"]>[0];

export function AddGoalModal({ open, onClose }: Props) {
  const { addGoal } = useGoals();

  const [category, setCategory] = useState<GoalCategory>("home");
  const [name, setName] = useState<string>("شراء منزل");
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [targetDate, setTargetDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);

  const reset = () => {
    setCategory("home");
    setName("شراء منزل");
    setTargetPrice(0);
    setPriority("medium");
    setTargetDate("");
    setNotes("");
    setError(null);
    setPendingDraft(null);
  };

  const handleCategory = (cat: GoalCategory) => {
    setCategory(cat);
    // Sync the name with the category label unless the user typed a custom name.
    const match = CATEGORY_OPTIONS.find((c) => c.key === cat);
    if (match && CATEGORY_OPTIONS.some((c) => c.label === name)) {
      setName(match.label);
    } else if (match && !name) {
      setName(match.label);
    }
  };

  const buildDraft = (): Draft => ({
    name: name.trim(),
    targetPrice,
    priority,
    category,
    targetDate: targetDate || undefined,
    notes: notes || undefined,
    // Intentional: no initial allocation. AI will suggest the split next.
    allocated: 0,
  });

  const commit = (draft: Draft) => {
    addGoal(draft);
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("اسم الهدف مطلوب.");
      return;
    }
    if (!(targetPrice > 0)) {
      setError("المبلغ المستهدف يجب أن يكون أكبر من صفر.");
      return;
    }

    // Every goal must go through the AI Purchase Motivation step + the
    // Psychological Analysis modal before it is created. The dialog handles
    // the actual commit through onConfirm — nothing is saved yet here.
    setPendingDraft(buildDraft());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <>
      {/* AI Decision Analysis — appears only for major goals */}
      <AIDecisionDialog
        open={!!pendingDraft}
        input={pendingDraft ? { draft: pendingDraft } : null}
        onCancel={() => setPendingDraft(null)}
        onConfirm={() => {
          if (pendingDraft) commit(pendingDraft);
        }}
      />

    <Modal open={open && !pendingDraft} onClose={handleClose} title="إضافة هدف جديد" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">فئة الهدف</label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {CATEGORY_OPTIONS.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => handleCategory(c.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[10px] font-semibold transition",
                    active
                      ? "border-primary bg-primary-light text-primary-dark shadow-card"
                      : "border-outline bg-card text-ink-soft hover:border-primary/40"
                  )}
                  title={c.label}
                >
                  <span className="text-base leading-none">{c.emoji}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <Input
          label="اسم الهدف"
          icon={<Target className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: شراء منزل"
          required
        />

        {/* Target amount */}
        <Input
          label="المبلغ المستهدف"
          type="number"
          min={0}
          inputMode="numeric"
          icon={<Coins className="h-4 w-4" />}
          suffix="ر.س"
          value={targetPrice || ""}
          onChange={(e) => setTargetPrice(Math.max(0, Number(e.target.value) || 0))}
          required
        />

        {/* Priority */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">الأولوية</label>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITY_OPTIONS.map((p) => {
              const active = priority === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-bold transition",
                    active
                      ? p.tone
                      : "border-outline bg-card text-ink-soft hover:border-primary/30"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target date (optional) */}
        <Input
          label="تاريخ الاستحقاق (اختياري)"
          type="date"
          icon={<Calendar className="h-4 w-4" />}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />

        {/* Notes (optional) */}
        <Input
          label="ملاحظات (اختياري)"
          icon={<StickyNote className="h-4 w-4" />}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي ملاحظة تساعدك على تذكر تفاصيل الهدف"
        />

        <div className="rounded-xl border border-primary/20 bg-primary-light/40 p-3 text-[11px] leading-relaxed text-primary-dark">
          بعد الحفظ، سيقوم الذكاء الاصطناعي بإعادة توزيع مدخراتك وقدرتك الشهرية على أهدافك النشطة.
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger-light p-3 text-xs text-danger-dark">
            {error}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-outline pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button type="submit" icon={<Target className="h-4 w-4" />}>
            إضافة الهدف
          </Button>
        </div>
      </form>
    </Modal>
    </>
  );
}
