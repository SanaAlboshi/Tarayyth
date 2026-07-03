# Financial AI Analyzer

Financial AI Analyzer is a full-stack web application that helps users understand their financial health by analyzing their income, expenses, debts, and financial goals. The application calculates key financial metrics and leverages AI to generate personalized insights and recommendations for better financial decision-making.

---

## Features

- Analyze monthly financial status
- Calculate key financial indicators
- AI-powered financial insights
- Personalized financial recommendations
- Financial goal planning
- Financial readiness evaluation
- Responsive and user-friendly interface

---

## Technologies Used

### Frontend

- **React** – Building dynamic and interactive user interfaces.
- **TypeScript** – Improves code reliability through static typing.
- **Tailwind CSS** – Utility-first CSS framework for responsive and modern UI.
- **Vite** – Fast development server and optimized build tool.

### Backend

- **Node.js** – JavaScript runtime for server-side development.
- **Express.js** – Lightweight framework for building REST APIs.
- **TypeScript** – Enhances maintainability and scalability.

### AI Integration

- **Google Gemini API** – Generates personalized financial analysis and recommendations based on the user's financial information.

### Development Tools

- Git
- GitHub
- npm

---

## System Architecture

1. The user enters financial information such as income, expenses, debts, and financial goals.
2. The frontend sends the data to the backend through a REST API.
3. The backend calculates financial metrics, including:
   - Saving Amount
   - Saving Rate
   - Financial Leakage
   - Financial Readiness Score
4. The calculated metrics are sent to the Google Gemini API.
5. Gemini generates personalized financial insights and recommendations.
6. The frontend displays the analysis in a clean and interactive dashboard.

---

## Project Structure

```text
financial-ai-analyzer/
├── backend/
└── frontend/
```

---

## Installation

### Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
GEMINI_API_KEY=your_api_key
```

Start the backend server:

```bash
npm run dev
```

The backend runs on:

```
http://localhost:4001
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```
http://localhost:5173
```

---

## API Endpoint

### POST `/api/analyze`

### Example Request

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

### Example Response

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
    "recommendations": ["...", "..."],
    "decision": "Proceed",
    "riskLevel": "Low"
  }
}
```

---

## Future Improvements

- User authentication
- Dashboard with financial charts
- Expense categorization
- Financial history tracking
- Budget planning
- Export reports
- Multi-language support

---

## License

This project is intended for educational and portfolio purposes.