import { motion } from "framer-motion";

export function LoadingOverlay({ label = "جاري التحليل الذكي..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex w-[320px] flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center shadow-elevated"
      >
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-primary-light">
            <span className="text-lg font-bold text-primary">AI</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-l from-primary to-accent"
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </div>
        <p className="text-[11px] text-ink-mute">
          يعمل محرك الذكاء الاصطناعي على تحليل بياناتك بدقة عالية
        </p>
      </motion.div>
    </div>
  );
}
