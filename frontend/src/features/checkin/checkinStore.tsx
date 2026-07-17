import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CheckinRecord } from "../../types";
import { useAuth } from "../auth/authStore";
import { useNotifications } from "../notifications/notificationsStore";

const STORAGE_PREFIX = "trayyath.checkins::";
const REMINDER_PREFIX = "trayyath.checkin-reminder::";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type MonthlyUpdateState = "before" | "due" | "overdue" | "completed";

export interface MonthlyUpdateStatus {
  state: MonthlyUpdateState;
  /** Signed day difference from now to next due date; negative = overdue. */
  daysDelta: number;
  /** Positive absolute days count for the UI. */
  daysDisplay: number;
  /** ISO date of the next update due after the latest check-in. */
  nextDueISO: string;
  /** Arabic month name for the most recently completed check-in (if any). */
  completedMonthLabel: string | null;
  /** Days until the following update after a fresh completion. */
  nextInDays: number;
}

interface Ctx {
  history: CheckinRecord[];
  currentMonthKey: string;
  hasCurrentMonth: boolean;
  monthlyStatus: MonthlyUpdateStatus;
  add: (record: Omit<CheckinRecord, "id" | "createdAt" | "monthKey"> & { at?: Date }) => CheckinRecord;
}

const AR_MONTHS_LOCAL = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/** Return `d` shifted forward by one calendar month. */
function plusOneCalendarMonth(d: Date): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + 1);
  return result;
}

/** Zero out h/m/s/ms so day-diff math is stable. */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function computeMonthlyStatus(
  history: CheckinRecord[],
  now: Date,
  currentMonthKey: string
): MonthlyUpdateStatus {
  const sorted = [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const last = sorted[sorted.length - 1] ?? null;
  const today = startOfDay(now);

  // Fallback for first-ever run — treat as due today.
  const anchor = last ? new Date(last.createdAt) : now;
  const nextDue = plusOneCalendarMonth(anchor);
  const nextDueDay = startOfDay(nextDue);
  const daysDelta = Math.round((nextDueDay.getTime() - today.getTime()) / MS_PER_DAY);

  // Just-completed = the latest record is in the current month (or newer)
  // AND we're still before the next due date.
  const justCompleted =
    !!last && last.monthKey === currentMonthKey && daysDelta > 0;

  let state: MonthlyUpdateState;
  if (justCompleted) state = "completed";
  else if (daysDelta > 0) state = "before";
  else if (daysDelta === 0) state = "due";
  else state = "overdue";

  const completedMonthLabel = last
    ? AR_MONTHS_LOCAL[Math.max(0, Math.min(11, new Date(last.createdAt).getMonth()))]
    : null;

  return {
    state,
    daysDelta,
    daysDisplay: Math.abs(daysDelta),
    nextDueISO: nextDueDay.toISOString(),
    completedMonthLabel,
    nextInDays: Math.max(0, daysDelta),
  };
}

const CheckinContext = createContext<Ctx | null>(null);

const keyFor = (email: string | null | undefined) =>
  email ? `${STORAGE_PREFIX}${email.toLowerCase()}` : null;

export function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function CheckinProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { push } = useNotifications();
  const storageKey = keyFor(user?.email);
  const reminderKey = user?.email
    ? `${REMINDER_PREFIX}${user.email.toLowerCase()}`
    : null;
  const [history, setHistory] = useState<CheckinRecord[]>([]);
  const currentMonthKey = monthKey(new Date());

  useEffect(() => {
    if (!storageKey) {
      setHistory([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      setHistory(raw ? (JSON.parse(raw) as CheckinRecord[]) : []);
    } catch {
      setHistory([]);
    }
  }, [storageKey]);

  // Compute monthly update state — shared source of truth for the card + notification
  const monthlyStatus = useMemo(
    () => computeMonthlyStatus(history, new Date(), currentMonthKey),
    [history, currentMonthKey]
  );

  // Fire the "due" notification exactly once per due date per user.
  // Keyed by the ISO due-date so we never send duplicates while it's still due.
  useEffect(() => {
    if (!user || !reminderKey) return;
    if (monthlyStatus.state !== "due" && monthlyStatus.state !== "overdue") return;

    const key = monthlyStatus.nextDueISO.slice(0, 10); // YYYY-MM-DD
    const lastReminded = localStorage.getItem(reminderKey);
    if (lastReminded === key) return;

    push({
      title: "📅 حان وقت تسجيل ادخارك لهذا الشهر",
      body: "حدّث تقدمك في الادخار خلال دقيقة لإبقاء خطتك دقيقة.",
      severity: "info",
    });
    localStorage.setItem(reminderKey, key);
  }, [user, reminderKey, monthlyStatus.state, monthlyStatus.nextDueISO, push]);

  const add = useCallback<Ctx["add"]>(
    (payload) => {
      const at = payload.at ?? new Date();
      const record: CheckinRecord = {
        id: `chk-${at.getTime()}`,
        createdAt: at.toISOString(),
        monthKey: monthKey(at),
        savedThisMonth: payload.savedThisMonth,
        incomeChanged: payload.incomeChanged,
        newObligations: payload.newObligations,
        goalChanged: payload.goalChanged,
        feedback: payload.feedback,
        allocations: payload.allocations,
      };
      setHistory((prev) => {
        const next = [...prev.filter((r) => r.monthKey !== record.monthKey), record].sort(
          (a, b) => a.monthKey.localeCompare(b.monthKey)
        );
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
      return record;
    },
    [storageKey]
  );

  const value = useMemo<Ctx>(
    () => ({
      history,
      currentMonthKey,
      hasCurrentMonth: history.some((r) => r.monthKey === currentMonthKey),
      monthlyStatus,
      add,
    }),
    [history, currentMonthKey, monthlyStatus, add]
  );

  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}

export function useCheckin() {
  const ctx = useContext(CheckinContext);
  if (!ctx) throw new Error("CheckinProvider missing");
  return ctx;
}
