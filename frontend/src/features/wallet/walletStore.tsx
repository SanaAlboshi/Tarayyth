import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/authStore";

export type WalletTxKind =
  | "auto_deposit"
  | "manual_deposit"
  | "withdraw"
  | "refund"
  | "plan_edit";

export interface WalletTransaction {
  id: string;
  createdAt: string;
  kind: WalletTxKind;
  /** Positive = credit, negative = debit. Signed. */
  amount: number;
  balanceAfter: number;
  goalId?: string;
  goalName?: string;
  reason?: string;
}

interface WalletState {
  balance: number;
  autoSavingsEnabled: boolean;
  transactions: WalletTransaction[];
}

interface Ctx {
  balance: number;
  autoSavingsEnabled: boolean;
  transactions: WalletTransaction[];
  lastTransfer: WalletTransaction | null;
  /**
   * Simulate an automatic salary-based deposit routed to a goal.
   * Adds the amount to the wallet AND records the tx. The caller is
   * responsible for reflecting the allocation onto the actual goal.
   */
  recordAutoDeposit: (goalId: string, goalName: string, amount: number) => void;
  recordManualDeposit: (
    goalId: string,
    goalName: string,
    amount: number,
    reason?: string
  ) => void;
  /**
   * Debit the wallet + record the tx. The caller is responsible for
   * reflecting the withdrawal onto the actual goal's allocated amount.
   */
  recordWithdraw: (
    goalId: string,
    goalName: string,
    amount: number,
    reason?: string
  ) => WalletTransaction | null;
  /**
   * Full refund of a linked goal — records a positive refund transaction.
   */
  recordRefund: (goalId: string, goalName: string, amount: number) => void;
  /** Record a "plan edit" tx entry for the history (no balance change). */
  recordPlanEdit: (goalId: string, goalName: string, note: string) => void;
  setAutoSavingsEnabled: (enabled: boolean) => void;
  /**
   * Cancel any auto-savings and optionally sweep the wallet. Returns the
   * amount that was returned to the user (0 for keep-in-wallet).
   */
  cancelAutoSavings: (
    mode:
      | "stop_only"
      | "partial_withdraw"
      | "full_refund"
      | "keep_in_wallet",
    payload?: { amount?: number; goalId?: string; goalName?: string }
  ) => number;
}

const WalletContext = createContext<Ctx | null>(null);
const STORAGE_PREFIX = "trayyath.wallet::";

const keyFor = (email: string | null | undefined) =>
  email ? `${STORAGE_PREFIX}${email.toLowerCase()}` : null;

const uid = () => `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const EMPTY: WalletState = {
  balance: 0,
  autoSavingsEnabled: true,
  transactions: [],
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = keyFor(user?.email);
  const [state, setState] = useState<WalletState>(EMPTY);

  // Load per-user wallet on session change.
  useEffect(() => {
    if (!storageKey) {
      setState(EMPTY);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setState(EMPTY);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<WalletState>;
      setState({
        balance: Number(parsed.balance) || 0,
        autoSavingsEnabled: parsed.autoSavingsEnabled ?? true,
        transactions: Array.isArray(parsed.transactions)
          ? parsed.transactions
          : [],
      });
    } catch {
      setState(EMPTY);
    }
  }, [storageKey]);

  // Persist on any change.
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [storageKey, state]);

  const push = useCallback(
    (deltaSigned: number, tx: Omit<WalletTransaction, "id" | "createdAt" | "balanceAfter">) => {
      setState((prev) => {
        const nextBalance = Math.max(0, prev.balance + deltaSigned);
        const full: WalletTransaction = {
          id: uid(),
          createdAt: new Date().toISOString(),
          balanceAfter: nextBalance,
          ...tx,
        };
        return {
          ...prev,
          balance: nextBalance,
          transactions: [full, ...prev.transactions],
        };
      });
    },
    []
  );

  const recordAutoDeposit = useCallback<Ctx["recordAutoDeposit"]>(
    (goalId, goalName, amount) => {
      const a = Math.max(0, Math.round(amount));
      if (a <= 0) return;
      push(a, {
        kind: "auto_deposit",
        amount: a,
        goalId,
        goalName,
      });
    },
    [push]
  );

  const recordManualDeposit = useCallback<Ctx["recordManualDeposit"]>(
    (goalId, goalName, amount, reason) => {
      const a = Math.max(0, Math.round(amount));
      if (a <= 0) return;
      push(a, {
        kind: "manual_deposit",
        amount: a,
        goalId,
        goalName,
        reason: reason?.trim() ? reason.trim() : undefined,
      });
    },
    [push]
  );

  const recordWithdraw = useCallback<Ctx["recordWithdraw"]>(
    (goalId, goalName, amount, reason) => {
      const a = Math.max(0, Math.round(amount));
      if (a <= 0) return null;
      // Compute the exact post-transaction row synchronously so the caller
      // can hand it off to the AI setback UI without waiting for state.
      let created: WalletTransaction | null = null;
      setState((prev) => {
        if (a > prev.balance) {
          // Guard: never let the wallet go negative; caller is expected to
          // validate before calling but keep this as a safety belt.
          return prev;
        }
        const nextBalance = prev.balance - a;
        created = {
          id: uid(),
          createdAt: new Date().toISOString(),
          kind: "withdraw",
          amount: -a,
          balanceAfter: nextBalance,
          goalId,
          goalName,
          reason: reason?.trim() ? reason.trim() : undefined,
        };
        return {
          ...prev,
          balance: nextBalance,
          transactions: [created, ...prev.transactions],
        };
      });
      return created;
    },
    []
  );

  const recordRefund = useCallback<Ctx["recordRefund"]>(
    (goalId, goalName, amount) => {
      const a = Math.max(0, Math.round(amount));
      if (a <= 0) return;
      push(a, {
        kind: "refund",
        amount: a,
        goalId,
        goalName,
      });
    },
    [push]
  );

  const recordPlanEdit = useCallback<Ctx["recordPlanEdit"]>(
    (goalId, goalName, note) => {
      // Zero-amount informational entry.
      setState((prev) => {
        const full: WalletTransaction = {
          id: uid(),
          createdAt: new Date().toISOString(),
          kind: "plan_edit",
          amount: 0,
          balanceAfter: prev.balance,
          goalId,
          goalName,
          reason: note,
        };
        return { ...prev, transactions: [full, ...prev.transactions] };
      });
    },
    []
  );

  const setAutoSavingsEnabled = useCallback<Ctx["setAutoSavingsEnabled"]>(
    (enabled) => {
      setState((prev) => ({ ...prev, autoSavingsEnabled: enabled }));
    },
    []
  );

  const cancelAutoSavings = useCallback<Ctx["cancelAutoSavings"]>(
    (mode, payload) => {
      let returned = 0;
      setState((prev) => {
        let nextBalance = prev.balance;
        const nextTxs = [...prev.transactions];
        const now = new Date().toISOString();

        const disable: WalletState = {
          ...prev,
          autoSavingsEnabled: false,
        };

        if (mode === "stop_only" || mode === "keep_in_wallet") {
          // Nothing else happens — money stays in the wallet.
          return disable;
        }

        if (mode === "partial_withdraw") {
          const a = Math.max(0, Math.round(payload?.amount ?? 0));
          const use = Math.min(a, prev.balance);
          if (use <= 0) return disable;
          nextBalance = prev.balance - use;
          nextTxs.unshift({
            id: uid(),
            createdAt: now,
            kind: "withdraw",
            amount: -use,
            balanceAfter: nextBalance,
            goalId: payload?.goalId,
            goalName: payload?.goalName,
            reason: "إلغاء الادخار التلقائي — سحب جزئي",
          });
          returned = use;
        } else if (mode === "full_refund") {
          const use = prev.balance;
          if (use <= 0) return disable;
          nextBalance = 0;
          nextTxs.unshift({
            id: uid(),
            createdAt: now,
            kind: "refund",
            amount: -use,
            balanceAfter: 0,
            goalId: payload?.goalId,
            goalName: payload?.goalName,
            reason: "إلغاء الادخار التلقائي — استرجاع كامل",
          });
          returned = use;
        }

        return {
          autoSavingsEnabled: false,
          balance: nextBalance,
          transactions: nextTxs,
        };
      });
      return returned;
    },
    []
  );

  const lastTransfer = useMemo<WalletTransaction | null>(() => {
    return state.transactions.length > 0 ? state.transactions[0] : null;
  }, [state.transactions]);

  const value = useMemo<Ctx>(
    () => ({
      balance: state.balance,
      autoSavingsEnabled: state.autoSavingsEnabled,
      transactions: state.transactions,
      lastTransfer,
      recordAutoDeposit,
      recordManualDeposit,
      recordWithdraw,
      recordRefund,
      recordPlanEdit,
      setAutoSavingsEnabled,
      cancelAutoSavings,
    }),
    [
      state.balance,
      state.autoSavingsEnabled,
      state.transactions,
      lastTransfer,
      recordAutoDeposit,
      recordManualDeposit,
      recordWithdraw,
      recordRefund,
      recordPlanEdit,
      setAutoSavingsEnabled,
      cancelAutoSavings,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("WalletProvider missing");
  return ctx;
}
