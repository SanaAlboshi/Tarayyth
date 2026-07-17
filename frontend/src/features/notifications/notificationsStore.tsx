import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NotificationItem } from "../../types";

const STORAGE = "trayyath.notifications";

interface Ctx {
  items: NotificationItem[];
  unread: number;
  markAllRead: () => void;
  push: (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
  remove: (id: string) => void;
}

const NotificationsContext = createContext<Ctx | null>(null);

function loadSeed(): NotificationItem[] {
  const now = Date.now();
  return [
    {
      id: "n-1",
      title: "أهلاً بك في Trayyath",
      body: "ابدأ بإجراء تحليلك المالي الأول لتفعيل لوحة القيادة والمدرّب المالي.",
      severity: "info",
      read: false,
      createdAt: new Date(now - 1000 * 60 * 10).toISOString(),
    },
    {
      id: "n-2",
      title: "نصيحة اليوم",
      body: "الحفاظ على نسبة الالتزامات أقل من 30% يرفع أهلية التمويل بشكل ملحوظ.",
      severity: "ok",
      read: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: "n-3",
      title: "تذكير: فحص أهلية التمويل",
      body: "بعد إتمام تحليلك المالي، جرّب فحص الأهلية لمعرفة استعدادك للتقدّم بطلب تمويل.",
      severity: "warn",
      read: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    },
  ];
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw));
      else {
        const seed = loadSeed();
        setItems(seed);
        localStorage.setItem(STORAGE, JSON.stringify(seed));
      }
    } catch {
      setItems(loadSeed());
    }
  }, []);

  useEffect(() => {
    if (items.length) localStorage.setItem(STORAGE, JSON.stringify(items));
  }, [items]);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const push = useCallback(
    (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => {
      const item: NotificationItem = {
        id: `n-${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
        ...n,
      };
      setItems((prev) => [item, ...prev]);
    },
    []
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      items,
      unread: items.filter((n) => !n.read).length,
      markAllRead,
      push,
      remove,
    }),
    [items, markAllRead, push, remove]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("NotificationsProvider missing");
  return ctx;
}
