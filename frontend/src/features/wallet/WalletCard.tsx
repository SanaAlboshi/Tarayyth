import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  Zap,
  ZapOff,
  Sparkles,
  History,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Info,
  AlertTriangle,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Modal } from "../../components/shared/Modal";
import { formatSAR, formatDate } from "../../lib/format";
import { useGoals, Goal } from "../goals/goalsStore";
import { useAnalysis } from "../analysis/analysisStore";
import { useWallet, WalletTransaction } from "./walletStore";

/* ------------------------------------------------------------------ */
/* Local palette — matches the rest of the SavingsPlan page            */
/* ------------------------------------------------------------------ */

const BANK = {
  paper:    "#fcf8f5",
  ink:      "#02151e",
  inkAlt:   "#002134",
  muted:    "#3f3c3e",
  accent:   "#d58d79",
  ai:       "#837fd8",
  paperEdge:"#EDE7DE",
} as const;

/* ==================================================================
   1) Wallet card — placed inside SavingsPlanPage.
   Same premium banking language as the existing cards on the page.
================================================================== */

export function WalletCard() {
  const {
    balance,
    autoSavingsEnabled,
    lastTransfer,
    setAutoSavingsEnabled,
  } = useWallet();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [setback, setSetback] = useState<SetbackData | null>(null);
  const [boost, setBoost] = useState<BoostData | null>(null);

  return (
    <>
      <section
        className="rounded-3xl p-5 shadow-card sm:p-6"
        style={{
          backgroundColor: "#FFFFFF",
          border: `1px solid ${BANK.paperEdge}`,
        }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${BANK.accent}18`,
                color: BANK.accent,
              }}
              aria-hidden="true"
            >
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: BANK.muted }}
              >
                محفظة الادخار
              </p>
              <h3
                className="mt-1 text-base font-bold sm:text-lg"
                style={{ color: BANK.ink }}
              >
                رصيدك المدّخر
              </h3>
              <p className="mt-0.5 text-[11px]" style={{ color: BANK.muted }}>
                إجمالي ما جمعته المحفظة لأهدافك النشطة.
              </p>
            </div>
          </div>

          {/* Auto savings pill */}
          <button
            type="button"
            onClick={() => {
              if (autoSavingsEnabled) setCancelOpen(true);
              else setAutoSavingsEnabled(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition hover:opacity-90"
            style={{
              backgroundColor: autoSavingsEnabled
                ? "#E4F1EC"
                : `${BANK.paperEdge}`,
              color: autoSavingsEnabled ? "#0A5A42" : BANK.muted,
            }}
            aria-label="حالة الادخار التلقائي"
          >
            {autoSavingsEnabled ? (
              <Zap className="h-3 w-3" />
            ) : (
              <ZapOff className="h-3 w-3" />
            )}
            {autoSavingsEnabled
              ? "الادخار التلقائي: مفعّل"
              : "الادخار التلقائي: متوقف"}
          </button>
        </div>

        {/* Balance + last transfer */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: BANK.paper,
              border: `1px solid ${BANK.paperEdge}`,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: BANK.muted }}
            >
              الرصيد الحالي
            </p>
            <p
              className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl"
              style={{ color: BANK.ink }}
            >
              {formatSAR(balance)}
            </p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: BANK.paper,
              border: `1px solid ${BANK.paperEdge}`,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: BANK.muted }}
            >
              آخر تحويل
            </p>
            {lastTransfer ? (
              <div className="mt-1 flex items-baseline gap-2">
                <p
                  className="text-lg font-bold tabular-nums"
                  style={{
                    color:
                      lastTransfer.amount > 0
                        ? "#0A5A42"
                        : lastTransfer.amount < 0
                        ? "#8A4A2F"
                        : BANK.ink,
                  }}
                >
                  {lastTransfer.amount > 0 ? "+" : ""}
                  {formatSAR(Math.abs(lastTransfer.amount))}
                </p>
                <span className="text-[10px]" style={{ color: BANK.muted }}>
                  {kindLabel(lastTransfer.kind)}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm" style={{ color: BANK.muted }}>
                لا توجد تحويلات بعد.
              </p>
            )}
            {lastTransfer?.goalName && (
              <p
                className="mt-1 truncate text-[10px]"
                style={{ color: BANK.muted }}
                title={lastTransfer.goalName}
              >
                هدف: {lastTransfer.goalName}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDepositOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-90"
            style={{ backgroundColor: BANK.inkAlt }}
          >
            <Plus className="h-3.5 w-3.5" />
            إضافة مبلغ
          </button>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BANK.accent }}
            disabled={balance <= 0}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            سحب مبلغ
          </button>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:bg-black/5"
            style={{
              border: `1px solid ${BANK.paperEdge}`,
              color: BANK.ink,
              backgroundColor: "#FFFFFF",
            }}
          >
            <History className="h-3.5 w-3.5" />
            استعراض السجل
          </button>
        </div>

        {/* Simulation caption */}
        <p
          className="mt-3 text-[10px] leading-relaxed"
          style={{ color: BANK.muted, opacity: 0.85 }}
        >
          الإيداعات الحالية تتم كمحاكاة حتى يتم ربط التطبيق بالبنك.
        </p>
      </section>

      {/* Modals */}
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onComplete={(data) => {
          setDepositOpen(false);
          setBoost(data);
        }}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onComplete={(data) => {
          setWithdrawOpen(false);
          setSetback(data);
        }}
      />
      <TransactionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
      <SetbackModal data={setback} onClose={() => setSetback(null)} />
      <DepositBoostModal data={boost} onClose={() => setBoost(null)} />
      <AutoSavingsCancelModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}

/* ==================================================================
   2) Withdraw modal
================================================================== */

interface SetbackData {
  goal: Goal;
  amountBefore: number;
  amountAfter: number;
  progressBefore: number;
  progressAfter: number;
  withdrawn: number;
  reason?: string;
}

function WithdrawModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (data: SetbackData) => void;
}) {
  const { balance, recordWithdraw } = useWallet();
  const { goals, activeGoals, editAllocation } = useGoals();

  const [goalId, setGoalId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // Reset the form on open only — using useEffect (not useMemo) so background
  // updates to activeGoals never clobber the user's live selection.
  useEffect(() => {
    if (!open) return;
    setGoalId((prev) => prev ?? activeGoals[0]?.id ?? null);
    setAmount(0);
    setReason("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedGoal = activeGoals.find((g) => g.id === goalId) ?? null;
  const perGoalCap = selectedGoal ? Math.max(0, selectedGoal.allocated) : 0;
  const walletCap = balance;

  // The wallet is a pooled amount; ensure we never over-draw either constraint.
  const maxWithdrawable = Math.min(perGoalCap, walletCap);

  let error: string | null = null;
  if (!selectedGoal) error = "لا يوجد هدف نشط لسحب المبلغ منه.";
  else if (amount <= 0) error = "المبلغ يجب أن يكون أكبر من صفر.";
  else if (amount > walletCap)
    error = "المبلغ يتجاوز رصيد المحفظة الحالي.";
  else if (amount > perGoalCap)
    error = "المبلغ يتجاوز المدّخر الحالي للهدف المختار.";

  const canConfirm = !error;

  const handleConfirm = () => {
    if (!canConfirm || !selectedGoal) return;

    // Re-read the goal from the store so `before` reflects the live allocation.
    const liveGoal = goals.find((g) => g.id === selectedGoal.id) ?? selectedGoal;

    const withdrawn = Math.round(amount);
    const before = Math.max(0, liveGoal.allocated);
    const target = liveGoal.targetPrice;
    const after = Math.max(0, before - withdrawn);

    // 1) Debit the wallet + record tx (goal-linked).
    recordWithdraw(liveGoal.id, liveGoal.name, withdrawn, reason);
    // 2) Reduce the goal's saved amount so progress/remaining recalculate.
    editAllocation(liveGoal.id, after);

    const progressBefore =
      target > 0 ? Math.round((before / target) * 100) : 0;
    const progressAfter =
      target > 0 ? Math.round((after / target) * 100) : 0;

    onComplete({
      goal: { ...liveGoal, allocated: after },
      amountBefore: before,
      amountAfter: after,
      progressBefore,
      progressAfter,
      withdrawn,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <>
      <Modal
        open={open && !confirmationOpen}
        onClose={onClose}
        title="سحب من محفظة الادخار"
        size="md"
      >
        {/* Wallet balance */}
        <div
          className="mb-5 flex items-start gap-3 rounded-2xl p-4"
          style={{
            backgroundColor: BANK.paper,
            border: `1px solid ${BANK.paperEdge}`,
          }}
        >
          <span
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${BANK.accent}18`,
              color: BANK.accent,
            }}
          >
            <Wallet className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: BANK.muted }}
            >
              رصيد المحفظة الحالي
            </p>
            <p
              className="mt-1 text-xl font-bold tabular-nums"
              style={{ color: BANK.ink }}
            >
              {formatSAR(balance)}
            </p>
          </div>
        </div>

        {/* Goal selection */}
        <div>
          <p
            className="mb-2 text-xs font-semibold"
            style={{ color: BANK.muted }}
          >
            اختر الهدف
          </p>
          {activeGoals.length === 0 ? (
            <p
              className="rounded-xl p-3 text-xs"
              style={{
                backgroundColor: BANK.paper,
                border: `1px dashed ${BANK.paperEdge}`,
                color: BANK.muted,
              }}
            >
              لا توجد أهداف نشطة لربطها بالسحب.
            </p>
          ) : (
            <ul className="space-y-2">
              {activeGoals.map((g) => {
                const active = g.id === goalId;
                const pct =
                  g.targetPrice > 0
                    ? Math.min(
                        100,
                        Math.round((g.allocated / g.targetPrice) * 100)
                      )
                    : 0;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => setGoalId(g.id)}
                      className="w-full rounded-xl px-3.5 py-2.5 text-right transition"
                      style={{
                        backgroundColor: active ? `${BANK.accent}10` : "#FFFFFF",
                        border: `1px solid ${
                          active ? BANK.accent : BANK.paperEdge
                        }`,
                        color: BANK.ink,
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className="text-sm font-bold"
                          style={{
                            color: active ? BANK.accent : BANK.ink,
                          }}
                        >
                          {g.name}
                        </p>
                        <p
                          className="text-[10px] tabular-nums"
                          style={{ color: BANK.muted }}
                        >
                          المدّخر:{" "}
                          <span
                            className="font-bold"
                            style={{ color: BANK.ink }}
                          >
                            {formatSAR(g.allocated)}
                          </span>{" "}
                          · {pct}%
                        </p>
                      </div>
                      <div
                        className="mt-1.5 h-1 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: BANK.paperEdge }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: BANK.inkAlt,
                          }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Amount */}
        <div className="mt-5">
          <label className="block">
            <span
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: BANK.muted }}
            >
              المبلغ المراد سحبه
            </span>
            <div
              className="flex items-center gap-2 rounded-xl px-3.5 transition"
              style={{
                height: 48,
                backgroundColor: BANK.paper,
                border: `1px solid ${
                  amount > 0 && amount > maxWithdrawable
                    ? BANK.accent
                    : BANK.paperEdge
                }`,
              }}
            >
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={amount || ""}
                onChange={(e) =>
                  setAmount(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="0"
                className="w-full bg-transparent text-base font-bold tabular-nums focus:outline-none"
                style={{ color: BANK.ink }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: BANK.muted }}
              >
                ر.س
              </span>
            </div>
            <p
              className="mt-1 text-[10px]"
              style={{ color: BANK.muted }}
            >
              الحد الأقصى للسحب من هذا الهدف: {formatSAR(maxWithdrawable)}
            </p>
          </label>
        </div>

        {/* Reason */}
        <div className="mt-4">
          <label className="block">
            <span
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: BANK.muted }}
            >
              سبب السحب (اختياري)
            </span>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: مصروف طارئ أو التزام غير متوقع"
              className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
              style={{
                backgroundColor: BANK.paper,
                border: `1px solid ${BANK.paperEdge}`,
                color: BANK.ink,
              }}
            />
          </label>
        </div>

        {error && amount > 0 && (
          <div
            className="mt-4 flex items-start gap-2 rounded-xl p-3 text-[11px] leading-relaxed"
            style={{
              backgroundColor: "#F9E7E2",
              border: `1px solid ${BANK.accent}`,
              color: "#8A2F2A",
            }}
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4"
          style={{ borderColor: BANK.paperEdge }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold transition hover:bg-black/5"
            style={{
              border: `1px solid ${BANK.paperEdge}`,
              color: BANK.ink,
              backgroundColor: "#FFFFFF",
            }}
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BANK.accent }}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            تأكيد السحب
          </button>
        </div>
      </Modal>
    </>
  );
}

/* ==================================================================
   3) Transaction history modal
================================================================== */

function TransactionHistoryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { transactions } = useWallet();

  return (
    <Modal open={open} onClose={onClose} title="سجل محفظة الادخار" size="md">
      {transactions.length === 0 ? (
        <p
          className="rounded-xl p-4 text-center text-xs"
          style={{
            backgroundColor: BANK.paper,
            border: `1px dashed ${BANK.paperEdge}`,
            color: BANK.muted,
          }}
        >
          لا توجد حركات في المحفظة بعد.
        </p>
      ) : (
        <ul className="space-y-2">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{
                backgroundColor: BANK.paper,
                border: `1px solid ${BANK.paperEdge}`,
              }}
            >
              <span
                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                style={txStyle(t)}
                aria-hidden="true"
              >
                {txIcon(t.kind)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p
                    className="text-xs font-bold"
                    style={{ color: BANK.ink }}
                  >
                    {kindLabel(t.kind)}
                  </p>
                  <p
                    className="text-sm font-bold tabular-nums"
                    style={{
                      color:
                        t.amount > 0
                          ? "#0A5A42"
                          : t.amount < 0
                          ? "#8A4A2F"
                          : BANK.ink,
                    }}
                  >
                    {t.amount > 0 ? "+" : t.amount < 0 ? "-" : ""}
                    {formatSAR(Math.abs(t.amount))}
                  </p>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                  <p
                    className="truncate text-[10px]"
                    style={{ color: BANK.muted }}
                  >
                    {formatDate(t.createdAt)}
                    {t.goalName ? ` · ${t.goalName}` : ""}
                  </p>
                  <p
                    className="text-[10px] tabular-nums"
                    style={{ color: BANK.muted }}
                  >
                    الرصيد بعد: {formatSAR(t.balanceAfter)}
                  </p>
                </div>
                {t.reason && (
                  <p
                    className="mt-1 text-[10px] leading-relaxed"
                    style={{ color: BANK.muted }}
                  >
                    {t.reason}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        className="mt-5 flex justify-end border-t pt-4"
        style={{ borderColor: BANK.paperEdge }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-xs font-semibold transition hover:bg-black/5"
          style={{
            border: `1px solid ${BANK.paperEdge}`,
            color: BANK.ink,
            backgroundColor: "#FFFFFF",
          }}
        >
          إغلاق
        </button>
      </div>
    </Modal>
  );
}

/* ==================================================================
   4) AI Setback + Recovery modal (post-withdraw)
================================================================== */

function SetbackModal({
  data,
  onClose,
}: {
  data: SetbackData | null;
  onClose: () => void;
}) {
  const { result } = useAnalysis();

  const analysis = useMemo(() => {
    if (!data) return null;
    return buildSetbackAnalysis({
      withdrawn: data.withdrawn,
      reason: data.reason,
      goal: data.goal,
      readinessScore: result?.readinessScore ?? 0,
      monthlyCapacity: Math.max(0, result?.monthlySavings ?? 0),
      debtRatio: result?.debtRatio ?? 100,
    });
  }, [data, result]);

  if (!data || !analysis) return null;

  return (
    <Modal open={!!data} onClose={onClose} title="تحليل الأثر" size="md">
      {/* Success line first — clear confirmation */}
      <div
        className="mb-4 flex items-start gap-3 rounded-xl p-3"
        style={{
          backgroundColor: "#E4F1EC",
          border: "1px solid rgba(184,219,203,0.6)",
          color: "#0A5A42",
        }}
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold">تم سحب المبلغ بنجاح</p>
          <p className="mt-0.5 text-[11px]">
            تم تحديث رصيد المحفظة وتقدم الهدف.
          </p>
        </div>
      </div>

      {/* AI setback header */}
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${BANK.ai}18`, color: BANK.ai }}
          aria-hidden="true"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.ai }}
          >
            رصد سلوكي من الذكاء الاصطناعي
          </p>
          <h4
            className="mt-1 text-base font-bold sm:text-lg"
            style={{ color: BANK.ink }}
          >
            لاحظنا تراجعاً في تقدم هدفك
          </h4>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: BANK.muted }}
          >
            تم سحب <b>{formatSAR(data.withdrawn)}</b> من مدخرات هدف "
            {data.goal.name}"، مما أدى إلى انخفاض التقدم من{" "}
            <b>{data.progressBefore}%</b> إلى <b>{data.progressAfter}%</b>.
          </p>
        </div>
      </div>

      {/* Before / after strip */}
      <div
        className="mt-4 grid gap-2 rounded-2xl p-3 sm:grid-cols-3"
        style={{
          backgroundColor: BANK.paper,
          border: `1px solid ${BANK.paperEdge}`,
        }}
      >
        <MiniStat
          label="المدّخر قبل"
          value={formatSAR(data.amountBefore)}
        />
        <MiniStat
          label="المدّخر بعد"
          value={formatSAR(data.amountAfter)}
          tone="warn"
        />
        <MiniStat
          label="تغيّر التقدم"
          value={`${data.progressBefore}% → ${data.progressAfter}%`}
        />
      </div>

      {/* Advice list */}
      <div className="mt-5">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: BANK.ai }}
        >
          نصائح مخصصة
        </p>
        <ul className="mt-2 space-y-2">
          {analysis.advice.map((a, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl p-3 text-[11px] leading-relaxed"
              style={{
                backgroundColor: BANK.paper,
                border: `1px solid ${BANK.paperEdge}`,
                color: BANK.muted,
              }}
            >
              <span
                className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: BANK.inkAlt }}
              >
                {i + 1}
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recovery */}
      <div
        className="mt-5 rounded-2xl p-4"
        style={{
          backgroundColor: `${BANK.ai}0F`,
          border: `1px solid ${BANK.ai}33`,
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: BANK.ai }}
        >
          خطة التعافي المقترحة
        </p>
        <p
          className="mt-2 text-sm font-semibold"
          style={{ color: BANK.ink }}
        >
          {analysis.primaryRecovery}
        </p>
        <p
          className="mt-2 text-[11px] leading-relaxed"
          style={{ color: BANK.muted }}
        >
          <b>بديل: </b>
          {analysis.alternativeRecovery}
        </p>
      </div>

      <div
        className="mt-6 flex justify-end border-t pt-4"
        style={{ borderColor: BANK.paperEdge }}
      >
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
          style={{ backgroundColor: BANK.inkAlt }}
        >
          فهمت
        </button>
      </div>
    </Modal>
  );
}

/* ==================================================================
   4b) Deposit modal + AI positive-feedback modal
================================================================== */

type DepositSource =
  | "salary_sim"
  | "manual"
  | "extra_income"
  | "bonus"
  | "other";

const SOURCE_LABELS: Record<DepositSource, string> = {
  salary_sim: "راتب (محاكاة)",
  manual: "إيداع يدوي",
  extra_income: "دخل إضافي",
  bonus: "مكافأة",
  other: "أخرى",
};

interface BoostData {
  goal: Goal;
  goalName: string;
  amount: number;
  progressBefore: number;
  progressAfter: number;
  amountBefore: number;
  amountAfter: number;
  source: DepositSource;
  sourceNote?: string;
}

function DepositModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (data: BoostData) => void;
}) {
  const { recordManualDeposit } = useWallet();
  const { goals, activeGoals, editAllocation } = useGoals();

  const [goalId, setGoalId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [source, setSource] = useState<DepositSource>("salary_sim");
  const [sourceNote, setSourceNote] = useState<string>("");

  // Reset each time the modal opens. Uses useEffect so it only runs on the
  // open transition — not on every render caused by the goals store updating
  // its activeGoals reference (which would silently reset the user's picks).
  useEffect(() => {
    if (!open) return;
    setGoalId((prev) => prev ?? activeGoals[0]?.id ?? null);
    setAmount(0);
    setSource("salary_sim");
    setSourceNote("");
    // Intentionally exclude activeGoals so the user's selection is preserved
    // as goals mutate in the background (e.g. when analysis re-runs).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedGoal = activeGoals.find((g) => g.id === goalId) ?? null;
  const remainingRoom = selectedGoal
    ? Math.max(0, selectedGoal.targetPrice - selectedGoal.allocated)
    : 0;

  let error: string | null = null;
  if (!selectedGoal) error = "لا يوجد هدف نشط لربط الإيداع به.";
  else if (amount <= 0) error = "المبلغ يجب أن يكون أكبر من صفر.";
  else if (remainingRoom > 0 && amount > remainingRoom)
    error = `المبلغ يتجاوز ما تبقّى لهذا الهدف (${formatSAR(remainingRoom)}).`;

  const canConfirm = !error;

  const handleConfirm = () => {
    if (!canConfirm || !selectedGoal) return;

    // Re-read the goal from the store at confirm time so we never compute
    // `after` off a stale closure — this is the source-of-truth allocation.
    const liveGoal = goals.find((g) => g.id === selectedGoal.id) ?? selectedGoal;

    const added = Math.round(amount);
    const before = Math.max(0, liveGoal.allocated);
    const target = liveGoal.targetPrice;
    const after = Math.min(target, before + added);

    // Compose the wallet transaction reason using the chosen source.
    const sourceLabel =
      source === "other" && sourceNote.trim()
        ? `${SOURCE_LABELS.other} — ${sourceNote.trim()}`
        : SOURCE_LABELS[source];

    // 1) Credit the wallet + log the transaction.
    recordManualDeposit(liveGoal.id, liveGoal.name, added, sourceLabel);

    // 2) Push the new saved amount onto the goal so progress, remaining,
    //    percentage and ETA all recalculate reactively across the app.
    editAllocation(liveGoal.id, after);

    const progressBefore =
      target > 0 ? Math.round((before / target) * 100) : 0;
    const progressAfter =
      target > 0 ? Math.round((after / target) * 100) : 0;

    onComplete({
      goal: { ...liveGoal, allocated: after },
      goalName: liveGoal.name,
      amount: added,
      amountBefore: before,
      amountAfter: after,
      progressBefore,
      progressAfter,
      source,
      sourceNote: sourceNote.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إضافة مبلغ إلى محفظة الادخار"
      size="md"
    >
      {/* Amount */}
      <label className="block">
        <span
          className="mb-1.5 block text-xs font-semibold"
          style={{ color: BANK.muted }}
        >
          المبلغ
        </span>
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 transition"
          style={{
            height: 48,
            backgroundColor: BANK.paper,
            border: `1px solid ${
              amount > 0 && remainingRoom > 0 && amount > remainingRoom
                ? BANK.accent
                : BANK.paperEdge
            }`,
          }}
        >
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={amount || ""}
            onChange={(e) =>
              setAmount(Math.max(0, Number(e.target.value) || 0))
            }
            placeholder="0"
            className="w-full bg-transparent text-base font-bold tabular-nums focus:outline-none"
            style={{ color: BANK.ink }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: BANK.muted }}
          >
            ر.س
          </span>
        </div>
      </label>

      {/* Goal dropdown */}
      <div className="mt-4">
        <label className="block">
          <span
            className="mb-1.5 block text-xs font-semibold"
            style={{ color: BANK.muted }}
          >
            اختر الهدف
          </span>
          {activeGoals.length === 0 ? (
            <p
              className="rounded-xl p-3 text-xs"
              style={{
                backgroundColor: BANK.paper,
                border: `1px dashed ${BANK.paperEdge}`,
                color: BANK.muted,
              }}
            >
              لا توجد أهداف نشطة لربط الإيداع بها.
            </p>
          ) : (
            <PremiumSelect
              value={goalId ?? ""}
              onChange={(v) => setGoalId(v)}
              options={activeGoals.map((g) => ({
                value: g.id,
                label: g.name,
              }))}
            />
          )}
        </label>
        {selectedGoal && (
          <p
            className="mt-1 text-[10px]"
            style={{ color: BANK.muted }}
          >
            المدّخر حالياً:{" "}
            <span className="font-bold" style={{ color: BANK.ink }}>
              {formatSAR(selectedGoal.allocated)}
            </span>{" "}
            من {formatSAR(selectedGoal.targetPrice)}
          </p>
        )}
      </div>

      {/* Source dropdown */}
      <div className="mt-4">
        <label className="block">
          <span
            className="mb-1.5 block text-xs font-semibold"
            style={{ color: BANK.muted }}
          >
            مصدر الإيداع
          </span>
          <PremiumSelect
            value={source}
            onChange={(v) => setSource(v as DepositSource)}
            options={(Object.keys(SOURCE_LABELS) as DepositSource[]).map(
              (k) => ({ value: k, label: SOURCE_LABELS[k] })
            )}
          />
        </label>

        {source === "other" && (
          <div className="mt-3">
            <label className="block">
              <span
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: BANK.muted }}
              >
                وصف المصدر
              </span>
              <input
                type="text"
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                placeholder="مثال: بيع شيء / هدية"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                style={{
                  backgroundColor: BANK.paper,
                  border: `1px solid ${BANK.paperEdge}`,
                  color: BANK.ink,
                }}
              />
            </label>
          </div>
        )}
      </div>

      {error && amount > 0 && (
        <div
          className="mt-4 flex items-start gap-2 rounded-xl p-3 text-[11px] leading-relaxed"
          style={{
            backgroundColor: "#F9E7E2",
            border: `1px solid ${BANK.accent}`,
            color: "#8A2F2A",
          }}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4"
        style={{ borderColor: BANK.paperEdge }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-xs font-semibold transition hover:bg-black/5"
          style={{
            border: `1px solid ${BANK.paperEdge}`,
            color: BANK.ink,
            backgroundColor: "#FFFFFF",
          }}
        >
          إلغاء
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: BANK.inkAlt }}
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة للمحفظة
        </button>
      </div>
    </Modal>
  );
}

/* Simple premium <select> using the app's design tokens. */
function PremiumSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl px-3.5 py-2.5 pl-9 text-sm font-medium focus:outline-none"
        style={{
          backgroundColor: BANK.paper,
          border: `1px solid ${BANK.paperEdge}`,
          color: BANK.ink,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: BANK.muted }}
      />
    </div>
  );
}

/* AI positive-feedback modal shown after a successful manual deposit. */
function DepositBoostModal({
  data,
  onClose,
}: {
  data: BoostData | null;
  onClose: () => void;
}) {
  const { result } = useAnalysis();

  const insight = useMemo(() => {
    if (!data) return null;
    return buildBoostInsight({
      amount: data.amount,
      goal: data.goal,
      progressBefore: data.progressBefore,
      progressAfter: data.progressAfter,
      readinessScore: result?.readinessScore ?? 0,
      monthlyCapacity: Math.max(0, result?.monthlySavings ?? 0),
    });
  }, [data, result]);

  if (!data || !insight) return null;

  return (
    <Modal open={!!data} onClose={onClose} title="تحليل الإيداع" size="md">
      {/* Success line */}
      <div
        className="mb-4 flex items-start gap-3 rounded-xl p-3"
        style={{
          backgroundColor: "#E4F1EC",
          border: "1px solid rgba(184,219,203,0.6)",
          color: "#0A5A42",
        }}
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold">تم إضافة المبلغ بنجاح</p>
          <p className="mt-0.5 text-[11px]">
            تم تحديث رصيد المحفظة وتقدم الهدف.
          </p>
        </div>
      </div>

      {/* AI header */}
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${BANK.ai}18`, color: BANK.ai }}
          aria-hidden="true"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.ai }}
          >
            رصد إيجابي من الذكاء الاصطناعي
          </p>
          <h4
            className="mt-1 text-base font-bold sm:text-lg"
            style={{ color: BANK.ink }}
          >
            رائع! لقد اقتربت أكثر من هدفك
          </h4>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: BANK.muted }}
          >
            تمت إضافة <b>{formatSAR(data.amount)}</b> إلى هدف "{data.goalName}
            ". ارتفعت نسبة الإنجاز من <b>{data.progressBefore}%</b> إلى{" "}
            <b>{data.progressAfter}%</b>.
          </p>
        </div>
      </div>

      {/* Before / after */}
      <div
        className="mt-4 grid gap-2 rounded-2xl p-3 sm:grid-cols-3"
        style={{
          backgroundColor: BANK.paper,
          border: `1px solid ${BANK.paperEdge}`,
        }}
      >
        <MiniStat label="المدّخر قبل" value={formatSAR(data.amountBefore)} />
        <MiniStat
          label="المدّخر بعد"
          value={formatSAR(data.amountAfter)}
          tone="good"
        />
        <MiniStat
          label="تغيّر التقدم"
          value={`${data.progressBefore}% → ${data.progressAfter}%`}
        />
      </div>

      {/* Encouragement + advice */}
      <p
        className="mt-5 text-sm leading-relaxed"
        style={{ color: BANK.muted }}
      >
        {insight.encouragement}
      </p>
      <ul className="mt-3 space-y-2">
        {insight.advice.map((a, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-xl p-3 text-[11px] leading-relaxed"
            style={{
              backgroundColor: BANK.paper,
              border: `1px solid ${BANK.paperEdge}`,
              color: BANK.muted,
            }}
          >
            <span
              className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: BANK.inkAlt }}
            >
              {i + 1}
            </span>
            <span>{a}</span>
          </li>
        ))}
      </ul>

      {/* Estimated completion */}
      {insight.completionNote && (
        <div
          className="mt-5 rounded-2xl p-4"
          style={{
            backgroundColor: `${BANK.ai}0F`,
            border: `1px solid ${BANK.ai}33`,
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.ai }}
          >
            التوقع الحالي
          </p>
          <p
            className="mt-2 text-sm font-semibold"
            style={{ color: BANK.ink }}
          >
            {insight.completionNote}
          </p>
        </div>
      )}

      <div
        className="mt-6 flex justify-end border-t pt-4"
        style={{ borderColor: BANK.paperEdge }}
      >
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
          style={{ backgroundColor: BANK.inkAlt }}
        >
          استمر بالتقدّم
        </button>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/* AI boost logic                                                      */
/* ================================================================== */

interface BoostInsight {
  encouragement: string;
  advice: string[];
  completionNote: string;
}

function buildBoostInsight(params: {
  amount: number;
  goal: Goal;
  progressBefore: number;
  progressAfter: number;
  readinessScore: number;
  monthlyCapacity: number;
}): BoostInsight {
  const {
    amount,
    goal,
    progressBefore,
    progressAfter,
    readinessScore,
    monthlyCapacity,
  } = params;

  const remaining = Math.max(0, goal.targetPrice - goal.allocated);
  const monthly = Math.max(0, goal.monthlyAllocation ?? 0);
  const priorityHigh = goal.priority === "high";
  const readinessGood = readinessScore >= 55;
  const bigDelta = progressAfter - progressBefore >= 10;

  // ---- Encouragement copy — personalized ----
  let encouragement: string;
  if (progressAfter >= 100) {
    encouragement =
      "مبروك! هذه الإضافة أوصلت الهدف إلى 100%. اعتبره منجزاً وابنِ فوق هذا الزخم لأهدافك القادمة.";
  } else if (bigDelta && priorityHigh) {
    encouragement =
      "قفزة ملموسة في هدف عالي الأولوية. الاستمرار بهذا الإيقاع سيقرّب موعد الإنجاز بشكل واضح.";
  } else if (bigDelta) {
    encouragement =
      "خطوة قوية نحو الهدف — قفزتك في نسبة الإنجاز تعكس التزاماً حقيقياً بخطة الادخار.";
  } else if (readinessGood) {
    encouragement =
      "استمرارك بهذا المعدل قد يساعدك على تحقيق الهدف قبل الموعد المتوقع، مع الحفاظ على جاهزيتك المالية.";
  } else {
    encouragement =
      "كل إيداع يقرّبك من الهدف. استمرارك على هذا النمط سيبني عادة مالية سليمة على المدى الطويل.";
  }

  // ---- Practical advice ----
  const advice: string[] = [];

  if (priorityHigh) {
    advice.push(
      "بما أن هذا هدف عالي الأولوية، حاول أن يكون جزء من دخلك الشهري القادم مخصصاً له مباشرة."
    );
  }
  if (monthly > 0 && readinessGood) {
    advice.push(
      "ثبّت الادخار الشهري لهذا الهدف عبر تحويل تلقائي في بداية كل شهر لتضمن استمرارية التقدم."
    );
  } else if (monthly <= 0 && monthlyCapacity > 0) {
    advice.push(
      "خصص مبلغاً شهرياً محدداً لهذا الهدف داخل خطتك — الانتظام يتفوق على الإيداعات الكبيرة المتباعدة."
    );
  }
  if (readinessScore < 55) {
    advice.push(
      "احرص على الحفاظ على صندوق طوارئ منفصل حتى لا تضطر لسحب هذا المبلغ لاحقاً."
    );
  } else {
    advice.push(
      "استمر بمراجعة أهدافك شهرياً — ضبط الأولويات يبقيك على مسار الإنجاز."
    );
  }
  if (progressAfter >= 75 && progressAfter < 100) {
    advice.push(
      "أنت في المرحلة الأخيرة من الهدف — تجنب سحب أي مبلغ منه في هذه الفترة للحفاظ على الزخم."
    );
  }

  const trimmed = advice.slice(0, 3);

  // ---- Completion projection ----
  let completionNote = "";
  if (progressAfter >= 100) {
    completionNote = "الهدف مكتمل بفضل هذه الإضافة.";
  } else if (monthly > 0 && remaining > 0) {
    const monthsLeft = Math.max(1, Math.ceil(remaining / monthly));
    const proj = new Date();
    proj.setMonth(proj.getMonth() + monthsLeft);
    const label = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
      month: "long",
      year: "numeric",
    }).format(proj);
    completionNote = `بمعدل ${formatSAR(monthly)} شهرياً، الإنجاز المتوقع خلال ${monthsLeft} ${
      monthsLeft <= 10 ? "أشهر" : "شهراً"
    } تقريباً (${label}).`;
  } else if (monthlyCapacity > 0 && remaining > 0) {
    const monthsLeft = Math.max(1, Math.ceil(remaining / monthlyCapacity));
    completionNote = `اعتمد ادخاراً شهرياً منتظماً — بقدرتك الحالية يمكن إنجاز الهدف خلال حوالي ${monthsLeft} ${
      monthsLeft <= 10 ? "أشهر" : "شهراً"
    }.`;
  }

  // Reference amount so TypeScript keeps it in scope (helps future tuning).
  void amount;

  return { encouragement, advice: trimmed, completionNote };
}

/* ==================================================================
   5) Cancel auto-savings modal — four options
================================================================== */

function AutoSavingsCancelModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { balance, cancelAutoSavings } = useWallet();
  const { activeGoals, editAllocation } = useGoals();
  const [mode, setMode] =
    useState<"stop_only" | "partial_withdraw" | "full_refund" | "keep_in_wallet">(
      "stop_only"
    );
  const [partial, setPartial] = useState<number>(0);

  const primaryGoal = activeGoals[0] ?? null;

  const handleConfirm = () => {
    const payload = primaryGoal
      ? {
          amount: partial,
          goalId: primaryGoal.id,
          goalName: primaryGoal.name,
        }
      : { amount: partial };
    const returned = cancelAutoSavings(mode, payload);
    // If we swept the wallet, reduce the linked goal's allocation to match.
    if (returned > 0 && primaryGoal) {
      const next = Math.max(0, primaryGoal.allocated - returned);
      editAllocation(primaryGoal.id, next);
    }
    onClose();
  };

  const options: {
    key: typeof mode;
    label: string;
    desc: string;
  }[] = [
    {
      key: "stop_only",
      label: "إيقاف التحويلات المستقبلية فقط",
      desc: "تُبقى الأموال داخل المحفظة ولا تُخصم من هدفك.",
    },
    {
      key: "keep_in_wallet",
      label: "الإبقاء على الأموال داخل المحفظة",
      desc: "إيقاف التلقائي مع الاحتفاظ بالرصيد الحالي للاستخدام لاحقاً.",
    },
    {
      key: "partial_withdraw",
      label: "سحب جزء من المدخرات",
      desc: "اختر مبلغاً لسحبه من الرصيد الحالي وإرجاعه لك.",
    },
    {
      key: "full_refund",
      label: "استرجاع كامل المدخرات",
      desc: `إرجاع كامل الرصيد (${formatSAR(balance)}) وتصفير المحفظة.`,
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إلغاء الادخار التلقائي"
      size="md"
    >
      <p
        className="mb-4 text-xs leading-relaxed"
        style={{ color: BANK.muted }}
      >
        اختر ما ترغب في فعله بالأموال المدّخرة داخل المحفظة قبل الإلغاء. لن
        يُسحب أي مبلغ دون تأكيدك.
      </p>

      <ul className="space-y-2">
        {options.map((o) => {
          const active = mode === o.key;
          return (
            <li key={o.key}>
              <button
                type="button"
                onClick={() => setMode(o.key)}
                className="w-full rounded-xl px-3.5 py-3 text-right transition"
                style={{
                  backgroundColor: active ? `${BANK.accent}10` : "#FFFFFF",
                  border: `1px solid ${
                    active ? BANK.accent : BANK.paperEdge
                  }`,
                }}
              >
                <p
                  className="text-sm font-bold"
                  style={{ color: active ? BANK.accent : BANK.ink }}
                >
                  {o.label}
                </p>
                <p
                  className="mt-0.5 text-[11px]"
                  style={{ color: BANK.muted }}
                >
                  {o.desc}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {mode === "partial_withdraw" && (
        <div className="mt-4">
          <label className="block">
            <span
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: BANK.muted }}
            >
              المبلغ المراد سحبه
            </span>
            <div
              className="flex items-center gap-2 rounded-xl px-3.5"
              style={{
                height: 44,
                backgroundColor: BANK.paper,
                border: `1px solid ${BANK.paperEdge}`,
              }}
            >
              <input
                type="number"
                min={0}
                max={balance}
                value={partial || ""}
                onChange={(e) =>
                  setPartial(
                    Math.max(0, Math.min(balance, Number(e.target.value) || 0))
                  )
                }
                placeholder="0"
                className="w-full bg-transparent text-sm font-bold tabular-nums focus:outline-none"
                style={{ color: BANK.ink }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: BANK.muted }}
              >
                ر.س
              </span>
            </div>
            <p
              className="mt-1 text-[10px]"
              style={{ color: BANK.muted }}
            >
              الحد الأقصى: {formatSAR(balance)}
            </p>
          </label>
        </div>
      )}

      <div
        className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4"
        style={{ borderColor: BANK.paperEdge }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-xs font-semibold transition hover:bg-black/5"
          style={{
            border: `1px solid ${BANK.paperEdge}`,
            color: BANK.ink,
            backgroundColor: "#FFFFFF",
          }}
        >
          إلغاء
        </button>
        <button
          type="button"
          disabled={
            mode === "partial_withdraw" && (partial <= 0 || partial > balance)
          }
          onClick={handleConfirm}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: BANK.inkAlt }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          تأكيد
        </button>
      </div>
    </Modal>
  );
}

/* ==================================================================
   Small helpers
================================================================== */

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn" | "good";
}) {
  const color =
    tone === "warn" ? "#8A4A2F" : tone === "good" ? "#0A5A42" : BANK.ink;
  return (
    <div>
      <p
        className="text-[9px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: BANK.muted }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}

function kindLabel(k: WalletTransaction["kind"]): string {
  switch (k) {
    case "auto_deposit":
      return "إيداع تلقائي";
    case "manual_deposit":
      return "إيداع يدوي";
    case "withdraw":
      return "سحب";
    case "refund":
      return "استرجاع";
    case "plan_edit":
      return "تعديل خطة";
  }
}

function txIcon(k: WalletTransaction["kind"]): React.ReactNode {
  const cls = "h-4 w-4";
  switch (k) {
    case "auto_deposit":
      return <Zap className={cls} />;
    case "manual_deposit":
      return <TrendingUp className={cls} />;
    case "withdraw":
      return <TrendingDown className={cls} />;
    case "refund":
      return <RefreshCw className={cls} />;
    case "plan_edit":
      return <Info className={cls} />;
  }
}

function txStyle(t: WalletTransaction): React.CSSProperties {
  if (t.kind === "withdraw") {
    return { backgroundColor: "#FBEDE5", color: "#8A4A2F" };
  }
  if (t.kind === "refund") {
    return {
      backgroundColor: `${BANK.ai}18`,
      color: BANK.ai,
    };
  }
  if (t.kind === "plan_edit") {
    return {
      backgroundColor: "rgba(0,33,52,0.06)",
      color: BANK.inkAlt,
    };
  }
  return { backgroundColor: "#E4F1EC", color: "#0A5A42" };
}

/* ==================================================================
   AI setback + recovery logic
================================================================== */

interface SetbackAnalysis {
  advice: string[];
  primaryRecovery: string;
  alternativeRecovery: string;
}

function buildSetbackAnalysis(params: {
  withdrawn: number;
  reason?: string;
  goal: Goal;
  readinessScore: number;
  monthlyCapacity: number;
  debtRatio: number;
}): SetbackAnalysis {
  const {
    withdrawn,
    reason,
    goal,
    readinessScore,
    monthlyCapacity,
    debtRatio,
  } = params;

  // Signals
  const remaining = Math.max(0, goal.targetPrice - goal.allocated);
  const monthlyGoal = Math.max(0, goal.monthlyAllocation ?? 0);
  const isHighPriority = goal.priority === "high";
  const readinessLow = readinessScore < 55;
  const commitmentsHigh = debtRatio > 40;
  const hasDeadline = !!goal.targetDate;
  const reasonHasFinancing = /قرض|تمويل|فوري|بطاقة|ائتمان/.test(reason ?? "");

  // ---- Advice ----
  const advice: string[] = [];

  if (monthlyCapacity > 0) {
    advice.push(
      "زد مبلغ الادخار الشهري بشكل مؤقت خلال الأشهر القادمة لتعويض التراجع دون إجهاد ماليتك."
    );
  }
  if (hasDeadline) {
    advice.push(
      "فكّر في تمديد مدة الهدف بضعة أشهر لتجنّب رفع مبلغ الادخار الشهري إلى مستوى ضاغط."
    );
  }
  if (commitmentsHigh) {
    advice.push(
      "قلّل المصروفات غير الأساسية خلال الشهر القادم — أثر بسيط شهرياً يعوّض التراجع تدريجياً."
    );
  }
  if (readinessLow || reasonHasFinancing) {
    advice.push(
      "تجنّب تعويض المبلغ باستخدام تمويل أو قرض غير مناسب — التمويل الآن قد يوسّع الفجوة على المدى الطويل."
    );
  }
  if (
    goal.priority === "low" ||
    (goal.priority === "medium" && readinessLow)
  ) {
    advice.push(
      "راجع أولوية هذا الهدف مقابل أهدافك الأخرى إذا تكرر السحب منه — إعادة الترتيب قد تخفف الضغط."
    );
  }
  advice.push(
    "حافظ على صندوق طوارئ منفصل عن مدخرات الأهداف حتى لا تضطر للسحب منها عند أي مصروف طارئ."
  );

  // Keep the list focused — up to 4 lines.
  const trimmed = advice.slice(0, 4);

  // ---- Recovery ----
  // Primary: bump monthly savings by X for N months to recover the withdrawn amount.
  // If the goal has an explicit monthly plan, target 10-12 months as a comfortable window.
  const recoveryMonths = Math.max(
    3,
    Math.min(12, monthlyGoal > 0 ? 10 : Math.ceil(withdrawn / 300))
  );
  const perMonth = Math.max(50, Math.ceil(withdrawn / recoveryMonths));
  const primaryRecovery = `لعودة هدفك إلى مساره السابق، يمكنك إضافة ${formatSAR(
    perMonth
  )} شهرياً لمدة ${recoveryMonths} ${recoveryMonths <= 10 ? "أشهر" : "شهراً"}.`;

  // Alternative: extend goal duration.
  const currentMonthsLeft =
    monthlyGoal > 0
      ? Math.ceil(remaining / monthlyGoal)
      : Math.ceil(remaining / Math.max(1, monthlyCapacity));
  const extraMonths = Math.max(
    2,
    Math.ceil(withdrawn / Math.max(1, monthlyGoal || monthlyCapacity || 300))
  );
  const alternativeRecovery = isHighPriority
    ? `الاحتفاظ بمستوى الادخار الحالي وتمديد المدة ${extraMonths} أشهر إضافية للحفاظ على أولوية الهدف دون ضغط شهري.`
    : `يمكنك تمديد مدة الهدف ${extraMonths} أشهر ${
        currentMonthsLeft > 0 ? "بدلاً من رفع الادخار الشهري" : ""
      } لتجنّب الضغط المالي.`;

  return { advice: trimmed, primaryRecovery, alternativeRecovery };
}

export type { WalletTransaction };
