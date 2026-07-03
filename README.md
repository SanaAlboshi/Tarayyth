# Tarayyth

**Tarayyth** is an AI-powered personal finance platform that helps users understand and improve their financial well-being. The application analyzes income, expenses, debts, and financial goals to generate personalized financial insights and practical recommendations using artificial intelligence.

Tarayyth empowers users to make smarter financial decisions by evaluating their financial health, identifying unnecessary spending, tracking savings, and providing actionable guidance to achieve long-term financial goals.

---

# Features

- AI-powered financial analysis
- Personalized financial recommendations
- Monthly financial health assessment
- Financial goal planning
- Saving amount and saving rate calculation
- Financial leakage detection
- Financial readiness score evaluation
- Modern and responsive user interface

---

# Financial Metrics

Tarayyth calculates several financial indicators, including:

- **Saving Amount** – Remaining income after expenses and debts.
- **Saving Rate** – Percentage of income saved each month.
- **Financial Leakage** – Identifies unnecessary spending habits.
- **Financial Readiness Score** – Evaluates the user's overall financial health.

---

# Technologies Used

## Frontend

- React
- TypeScript
- Tailwind CSS
- Vite

## Backend

- Node.js
- Express.js
- TypeScript

## AI

- Google Gemini API

## Development Tools

- Git
- GitHub
- npm

---

# System Architecture

1. The user enters financial information such as income, expenses, debts, and financial goals.
2. The frontend sends the data securely to the backend.
3. The backend validates the data and calculates financial metrics.
4. The calculated metrics are processed by Google Gemini AI.
5. AI generates personalized financial insights and recommendations.
6. The results are displayed through an intuitive and user-friendly interface.

---

# Project Structure

```text
Tarayyth/
├── backend/
├── frontend/
└── README.md
```

---

# Installation

## Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key
```

Run the backend:

```bash
npm run dev
```

Backend:

```
http://localhost:4001
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# API

### POST `/api/analyze`

#### Example Request

```json
{
  "monthlySalary": 10000,
  "monthlyExpenses": 5000,
  "monthlyDebts": 1000,
  "restaurantSpending": 800,
  "entertainmentSpending": 500,
  "financialGoal": "Buy a Car",
  "goalPrice": 60000,
  "desiredMonths": 24
}
```

#### Example Response

```json
{
  "metrics": {
    "saving": 4000,
    "savingRate": 40,
    "financialLeakage": 13,
    "financialReadinessScore": 100
  },
  "analysis": {
    "behaviorAnalysis": "...",
    "recommendations": [
      "...",
      "..."
    ],
    "decision": "Proceed",
    "riskLevel": "Low"
  }
}
```

---

# Project Goals

- Help users improve their financial awareness.
- Encourage better spending habits.
- Support long-term financial planning.
- Deliver AI-powered financial guidance.
- Simplify financial decision-making.

---

# Future Improvements

- User authentication
- Interactive financial dashboard
- Expense categorization
- Financial history tracking
- Budget planning tools
- Downloadable reports
- Multi-language support
- Bank account integration

---

# Screenshots

### Home Page

_Add a screenshot here._

### Financial Analysis

_Add a screenshot here._

### AI Recommendations

_Add a screenshot here._

---

# License

This project was developed for educational and portfolio purposes.