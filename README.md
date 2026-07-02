# Expense-tracker
A smart expense tracker, that helps to manage expenses.

# WealthWatch: Smart Personal Expense Tracker

A production-ready, fully responsive full-stack expense tracking application designed to monitor personal finances, manage categorical budgets, and view real-time currency conversions. 

---

## Key Features

*   **Responsive Dashboard:** Designed mobile-first using Tailwind CSS, allowing seamless tracking on both phones and laptops.
*   **Secure Authentication:** User signup and login powered by JSON Web Tokens (JWT).
*   **Smart Budgeting:** Set strict monthly expenditure limits per category with visual alert thresholds.
*   **Live Currency Conversion:** Integrated with a third-party exchange rate API to view personal balance across multiple currencies.
*   **Data Visualization:** Interactive charts analyzing monthly spending habits and historical financial trends.

---

## Tech Stack

### Frontend
*   **Framework:** React.js (Functional components, Hooks)
*   **Styling:** Tailwind CSS (Mobile-first responsive design)
*   **State Management / Fetching:** Axios, React Context API
*   **Charts:** Recharts / Chart.js

### Backend
*   **Framework:** Python Flask (RESTful API architecture using Blueprints)
*   **Database:** MySQL (Relational data mapping with SQLAlchemy)
*   **Authentication:** Flask-JWT-Extended
*   **Database Migrations:** Flask-Migrate

---

## Project Structure

```text
expense-tracker-fullstack/
│
├── backend/          # Flask API Engine
└── frontend/         # React SPA Frontend
