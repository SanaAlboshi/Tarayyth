import { AnimatePresence, motion } from "framer-motion";
import { Bell, X, CheckCheck, AlertTriangle, Info, ShieldAlert, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "./notificationsStore";
import { relativeTime, cn } from "../../lib/format";

const iconFor = (severity: string) => {
  switch (severity) {
    case "danger":
      return <ShieldAlert className="h-4 w-4" />;
    case "warn":
      return <AlertTriangle className="h-4 w-4" />;
    case "ok":
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const toneFor = (severity: string) => {
  switch (severity) {
    case "danger":
      return "bg-danger-light text-danger-dark";
    case "warn":
      return "bg-warn-light text-warn-dark";
    case "ok":
      return "bg-ok-light text-ok-dark";
    default:
      return "bg-info-light text-info";
  }
};

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const { items, unread, markAllRead, remove } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-outline bg-card text-ink-soft transition hover:text-primary"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="absolute left-0 top-12 z-40 w-[380px] overflow-hidden rounded-2xl border border-outline bg-card shadow-elevated"
            >
              <div className="flex items-center justify-between border-b border-outline p-4">
                <div>
                  <p className="text-sm font-bold">مركز الإشعارات</p>
                  <p className="text-[11px] text-ink-mute">{unread} إشعار غير مقروء</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-primary hover:bg-primary-light"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> تعليم الكل كمقروء
                  </button>
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="p-6 text-center text-sm text-ink-mute">لا توجد إشعارات حالياً.</p>
                ) : (
                  items.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 border-b border-outline/70 p-4 transition hover:bg-surface-alt/40",
                        !n.read && "bg-primary-light/30"
                      )}
                    >
                      <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl", toneFor(n.severity))}>
                        {iconFor(n.severity)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{n.title}</p>
                        <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>
                        <p className="mt-1 text-[10px] text-ink-mute">{relativeTime(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => remove(n.id)}
                        className="text-ink-mute hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
