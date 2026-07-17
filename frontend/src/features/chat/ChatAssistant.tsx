import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Bot } from "lucide-react";
import { api } from "../../lib/api";
import { useAnalysis } from "../analysis/analysisStore";
import { useAuth } from "../auth/authStore";
import { cn } from "../../lib/format";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "لماذا هذا الطلب مرتفع الخطر؟",
  "لخّص تقريري المالي.",
  "اشرح توصية الذكاء الاصطناعي.",
  "ما المستندات الناقصة؟",
  "كيف يمكن تحسين أهلية العميل؟",
];

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "مرحباً بك! أنا مساعدك المالي الذكي في Trayyath. كيف يمكنني خدمتك؟",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { result } = useAnalysis();
  const { user } = useAuth();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const userName = user?.fullName ?? "مستخدم";
      const context = result
        ? `الجاهزية ${result.readinessScore}%، الخطر ${result.riskLevel}، الالتزامات ${result.debtRatio}%. المستخدم: ${userName}.`
        : `المستخدم: ${userName}.`;
      const { data } = await api.post<{ reply: string }>("/chat", {
        history: next,
        context,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "تعذّر الاتصال بمحرك الذكاء الاصطناعي.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl shadow-elevated transition-transform hover:scale-105",
          "bg-gradient-to-tr from-primary to-primary-dark text-white",
          !open && "animate-pulseGlow"
        )}
        aria-label="مساعد الذكاء الاصطناعي"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 z-40 flex h-[540px] w-[380px] flex-col overflow-hidden rounded-3xl border border-outline bg-card shadow-elevated"
          >
            <div className="flex items-center gap-3 bg-gradient-to-l from-primary via-primary-dark to-[#082E2A] p-4 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">مساعد Trayyath الذكي</p>
                <p className="text-[11px] text-white/70">مدعوم بمحرك Gemini</p>
              </div>
              <Sparkles className="h-4 w-4 text-accent-light" />
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "bg-primary text-white"
                        : "bg-surface-alt text-ink"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-surface-alt px-3.5 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              )}
            </div>

            {messages.length < 3 && (
              <div className="flex flex-wrap gap-1.5 border-t border-outline p-3">
                {SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-outline bg-surface-alt px-2.5 py-1 text-[11px] text-ink-soft transition hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-outline p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك..."
                className="flex-1 rounded-xl border border-outline bg-surface-alt/60 px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
