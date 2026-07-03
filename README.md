# Financial AI Analyzer (Hackathon MVP)

Prototype لتحليل الوضع المالي للمستخدم: يقوم الـ Backend بحساب المؤشرات المالية
(Saving, Saving Rate, Financial Leakage, Financial Readiness Score) ثم يرسلها إلى
Google Gemini (gemini-2.5-flash) ليولّد تحليلاً سلوكياً وتوصيات باللغة العربية بصيغة JSON.

## البنية

```
financial-ai-analyzer/
├── backend/     # Node.js + Express + TypeScript + @google/genai
└── frontend/    # React + TypeScript + Tailwind CSS (Vite)
```

## التشغيل السريع

### 1) Backend

```bash
cd backend
cp .env.example .env
# ضع مفتاح Gemini الخاص بك داخل .env في GEMINI_API_KEY
npm install
npm run dev
```

Backend يعمل على: `http://localhost:4001`

### 2) Frontend

في تيرمنال آخر:

```bash
cd frontend
npm install
npm run dev
```

Frontend يعمل على: `http://localhost:5173`

> الفرونت مضبوط عبر Vite proxy لإرسال أي طلب لـ `/api` إلى `http://localhost:4001`.

## الحصول على مفتاح Gemini API

من https://aistudio.google.com/apikey ثم ضعه في `backend/.env`:

```
GEMINI_API_KEY=your_key_here
```

## API

### POST /api/analyze

**Body:**
```json
{
  "monthlySalary": 10000,
  "monthlyExpenses": 5000,
  "monthlyDebts": 1000,
  "restaurantSpending": 800,
  "entertainmentSpending": 500,
  "financialGoal": "شراء سيارة",
  "goalPrice": 60000,
  "desiredMonths": 24
}
```

**Response:**
```json
{
  "metrics": {
    "saving": 4001,
    "savingRate": 40,
    "financialLeakage": 13,
    "financialReadinessScore": 100
  },
  "analysis": {
    "behaviorAnalysis": "...",
    "recommendations": ["...", "..."],
    "decision": "Proceed",
    "riskLevel": "Low"
  }
}
```
