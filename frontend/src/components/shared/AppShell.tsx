import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  Gauge,
  Target,
  CalendarCheck,
} from "lucide-react";
import { Logo } from "./Logo";
import { NotificationsButton } from "../../features/notifications/NotificationsPanel";
import { useAuth } from "../../features/auth/authStore";
import { useTheme } from "../../features/theme/themeStore";
import { cn } from "../../lib/format";
import { ChatAssistant } from "../../features/chat/ChatAssistant";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { to: "/app/financial-analysis", label: "التحليل المالي", icon: <BarChart3 className="h-4 w-4" /> },
  { to: "/app/savings-plan", label: "خطة الادخار الذكية", icon: <Target className="h-4 w-4" /> },
  { to: "/app/checkin", label: "التحديث الشهري", icon: <CalendarCheck className="h-4 w-4" /> },
  { to: "/app/readiness", label: "فحص أهلية التمويل", icon: <Gauge className="h-4 w-4" /> },
  { to: "/app/profile", label: "الملف الشخصي", icon: <User className="h-4 w-4" /> },
];

/* Sidebar-only bank palette (matches the rest of the redesigned app) */
const SIDEBAR = {
  paper:    "#fcf8f5",
  ink:      "#02151e",
  inkAlt:   "#002134",
  muted:    "#3f3c3e",
  accent:   "#d58d79",
  paperEdge:"#EDE7DE",
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.fullName ?? "ضيف";
  const initials =
    displayName?.split(" ").slice(0, 2).map((s) => s[0]).join("") || "T";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface text-ink">
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-72 flex-col transition-transform duration-200 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
        style={{
          backgroundColor: SIDEBAR.paper,
          borderLeft: `1px solid ${SIDEBAR.paperEdge}`,
          boxShadow: "0 1px 2px rgba(15,42,46,0.02), 0 8px 24px rgba(15,42,46,0.04)",
        }}
      >
        {/* Logo header */}
        <div
          className="flex items-center justify-between px-6 pb-6 pt-7"
          style={{ borderBottom: `1px solid ${SIDEBAR.paperEdge}` }}
        >
          <Logo size="md" />
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 transition duration-200 hover:bg-black/5 lg:hidden"
            style={{ color: SIDEBAR.muted }}
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section eyebrow */}
        <div className="px-6 pb-3 pt-6">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: SIDEBAR.muted }}
          >
            المدرّب المالي الشخصي
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 pb-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app/financial-analysis"}
              onClick={() => setMobileOpen(false)}
              className="group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200"
              style={({ isActive }) => ({
                backgroundColor: isActive ? "rgba(213,141,121,0.12)" : "transparent",
                color: isActive ? SIDEBAR.accent : SIDEBAR.ink,
              })}
            >
              {({ isActive }) => (
                <>
                  {/* Active accent line (right edge in RTL) */}
                  {isActive && (
                    <span
                      className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full"
                      style={{ backgroundColor: SIDEBAR.accent }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className="flex flex-shrink-0 items-center justify-center transition-opacity duration-200"
                    style={{
                      color: isActive ? SIDEBAR.accent : SIDEBAR.ink,
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          {/* Hover style — coral tint on inactive items */}
          <style>{`
            aside nav a:not([aria-current="page"]):hover {
              background-color: rgba(213,141,121,0.08) !important;
            }
          `}</style>
        </nav>

        {/* Profile card */}
        <div
          className="m-4 rounded-2xl p-4"
          style={{
            backgroundColor: "#FFFFFF",
            border: `1px solid ${SIDEBAR.paperEdge}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: SIDEBAR.accent }}
            >
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: SIDEBAR.ink }}
              >
                {displayName}
              </p>
              <p
                className="truncate text-[11px]"
                style={{ color: SIDEBAR.muted }}
              >
                حساب شخصي
              </p>
            </div>
          </div>

          {/* Logout — outline coral pill, fills on hover */}
          <button
            onClick={handleLogout}
            onMouseEnter={(e) => {
              const t = e.currentTarget;
              t.style.backgroundColor = SIDEBAR.accent;
              t.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget;
              t.style.backgroundColor = "transparent";
              t.style.color = SIDEBAR.accent;
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200"
            style={{
              border: `1px solid ${SIDEBAR.accent}`,
              color: SIDEBAR.accent,
              backgroundColor: "transparent",
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="lg:mr-72">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-outline bg-card/90 backdrop-blur-xl px-4 py-3 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-outline p-2 text-ink-soft lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden flex-1 items-center gap-2 rounded-xl border border-outline bg-surface-alt/60 px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-ink-mute" />
            <input
              placeholder="ابحث في تحليلاتك وأهدافك المالية..."
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-mute focus:outline-none"
            />
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
            <button
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline bg-card text-ink-soft transition hover:text-primary"
              aria-label="تبديل الوضع"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationsButton />
          </div>
        </header>

        <main className="min-h-[calc(100vh-65px)] p-4 lg:p-8">{children}</main>
      </div>

      <ChatAssistant />
    </div>
  );
}
