export type ScoreKey =
  | "salary_drop_20"
  | "unexpected_expense"
  | "new_loan"
  | "marriage"
  | "baby"
  | "inflation"
  | "job_loss";

export interface ScenarioMeta {
  key: ScoreKey;
  title: string;
  description: string;
}

export const SCENARIO_CATALOG: ScenarioMeta[] = [
  { key: "salary_drop_20", title: "انخفاض الراتب 20%", description: "تقليص مفاجئ في الدخل الشهري" },
  { key: "unexpected_expense", title: "مصروف غير متوقع", description: "مصاريف طارئة (طبية، سيارة)" },
  { key: "new_loan", title: "قرض جديد", description: "التزام شهري إضافي" },
  { key: "marriage", title: "الزواج", description: "زيادة المصاريف الأساسية 30%" },
  { key: "baby", title: "قدوم مولود", description: "تكاليف رعاية الطفل" },
  { key: "inflation", title: "موجة تضخم", description: "ارتفاع الأسعار 12%" },
  { key: "job_loss", title: "فقدان الوظيفة", description: "توقف الدخل الشهري" },
];
