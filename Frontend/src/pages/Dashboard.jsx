import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import { expenseService } from '../services/api';
import { PlusCircle, Wallet, ArrowDownRight, TrendingUp, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const { logoutUser, user } = useContext(AuthContext);
  // React Hook Form instances for separate forms
  const { register: registerBudget, handleSubmit: handleBudgetSubmit, reset: resetBudget } = useForm();
  const { register: registerExpense, handleSubmit: handleExpenseSubmit, reset: resetExpense } = useForm();

  // Core Metrics States
  const [summary, setSummary] = useState({ total_budget: 0, total_spent: 0, net_remaining: 0 });
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [fromError, setFormError] = useState('');

  // Core background tracking fetchers
  const fetchDashboardData = async () => {
    try {
      const summaryRes = await expenseService.getDashboardSummary(selectedMonth);
      setSummary(summaryRes.data.summary);
      setCategories(summaryRes.data.category_breakdown);
      
      const expenseRes = await expenseService.getExpenses();
      setExpenses(expenseRes.data.reverse().slice(0, 5)); // Grab the 5 most recent items
    } catch (err) {
      console.error("Error communicating with data endpoints", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const resolveCategoryId = async (categoryName) => {
  // Fetch existing items first
    const allCats = await expenseService.getCategories();
    const found = allCats.data.find(
      c => c.name.toLowerCase() === categoryName.trim().toLowerCase()
    );
    
    if (found) {
      return found.id;
    }
    
    // Create it only if it doesn't exist yet
    // Ensure your service maps the argument to the object format {"name": categoryName}
    const catRes = await expenseService.createCategory(categoryName.trim());
    return catRes.data.category.id;
  };

  // Handler A: Create/Find Category + Configure Monthly Budget Threshold
  const onBudgetSubmit = async (data) => {
  setErrorMessage('');
  try {
    const categoryId = await resolveCategoryId(data.category_name);

    const budgetPayload = {
      category_id: categoryId,
      amount_limit: parseFloat(data.amount_limit),
      month: selectedMonth
    };
    
    // Switch to your uniform service instance if possible, or leave as direct API instance
    const API = (await import('../services/api')).default;
    await API.post('/budgets', budgetPayload);

    resetBudget();
    fetchDashboardData();
  } catch (finalErr) {
    setErrorMessage(finalErr.response?.data?.error || finalErr.message || 'Failed to update budget limit');
  }
};

  // Handler B: Log Fresh Transaction Expense
  const onExpenseSubmit = async (data) => {
    setErrorMessage('');
    try {
      let categoryId;

      try {
        // 1. Try to generate category string context
        const catRes = await expenseService.createCategory(data.category_name);
        categoryId = catRes.data.category.id;
      } catch (catErr) {
        // Fallback: search existing categories if duplicate conflict occurs
        const allCats = await expenseService.getCategories();
        const found = allCats.data.find(c => c.name.toLowerCase() === data.category_name.toLowerCase());
        
        if (found) {
          categoryId = found.id;
        } else {
          throw new Error("Category handling conflict encountered.");
        }
      }

      // 2. Log transaction details cleanly
      await expenseService.createExpense({
        category_id: categoryId,
        amount: parseFloat(data.amount),
        description: data.description,
        date: data.date || undefined
      });

      resetExpense();
      fetchDashboardData();
    } catch (finalErr) {
      // ⚡ Fixed parameter reference naming here!
      setErrorMessage(finalErr.response?.data?.error || finalErr.message || 'Failed to record transactional expense');
    }
  };

  // Chart configuration palettes
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Navigation Header bar */}
      <nav className="border-b border-slate-800 bg-slate-800/50 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-sky-600/30">W</div>
          <span className="text-xl font-bold tracking-tight text-white">WealthWatch</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Welcome, <strong className="text-slate-200">{user?.username}</strong></span>
          <button onClick={logoutUser} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-red-950/40 hover:text-red-400 rounded-lg text-sm font-medium transition-all duration-200">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error notification banner if any requests fail */}
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-sm">
            {errorMessage}
          </div>
        )}

        {/* Date Filter Panel */}
        <div className="flex justify-between items-center bg-slate-800/40 p-4 rounded-xl border border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Financial Overview</h1>
            <p className="text-sm text-slate-400">Track and manage metrics cleanly</p>
          </div>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Top Tier Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl"><Wallet size={24} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Allocated Budget</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">₹{summary.total_budget.toFixed(2)}</h3>
            </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl"><ArrowDownRight size={24} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Month Spending</p>
              <h3 className="text-2xl font-bold text-white mt-0.5">₹{summary.total_spent.toFixed(2)}</h3>
            </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><TrendingUp size={24} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Net Remaining Cap</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${summary.net_remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ₹{summary.net_remaining.toFixed(2)}
              </h3>
            </div>
          </div>
        </div>

        {/* Interactive Input Action Panel Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Action Component A: Set Budget Cap */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-md">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <PlusCircle className="text-sky-400" size={20} /> Set Monthly Category Budget
            </h3>
            <form onSubmit={handleBudgetSubmit(onBudgetSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Category Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g., Medical, Summer Trip, Groceries"
                  {...registerBudget("category_name")}
                  className="w-full bg-slate-900 border border-slate-700 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-sky-500" 
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Budget Target Limit (₹)</label>
                <input 
                  type="number" 
                  step="any" 
                  required 
                  placeholder="5000"
                  {...registerBudget("amount_limit")}
                  className="w-full bg-slate-900 border border-slate-700 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-sky-500" 
                />
              </div>
              <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 font-semibold text-sm py-2 rounded-lg transition-colors text-white">
                Apply Budget Threshold
              </button>
            </form>
          </div>

          {/* Action Component B: Log Transaction Cost */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-md">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <PlusCircle className="text-emerald-400" size={20} /> Record Direct Expense Cost
            </h3>
            <form onSubmit={handleExpenseSubmit(onExpenseSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Category Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Groceries"
                    {...registerExpense("category_name")}
                    className="w-full bg-slate-900 border border-slate-700 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Amount Cost (₹)</label>
                  <input 
                    type="number" 
                    step="any" 
                    required 
                    placeholder="450"
                    {...registerExpense("amount")}
                    className="w-full bg-slate-900 border border-slate-700 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Transaction Description</label>
                <input 
                  type="text" 
                  placeholder="Weekly shopping run at local store"
                  {...registerExpense("description")}
                  className="w-full bg-slate-900 border border-slate-700 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Date (Optional)</label>
                <input 
                  type="date" 
                  {...registerExpense("date")}
                  className="w-full bg-slate-900 border border-slate-700 text-sm px-3 py-2 rounded-lg text-white focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm py-2 rounded-lg transition-colors text-white">
                Log Expense Entry
              </button>
            </form>
          </div>
        </div>

        {/* Middle Section: Chart Visualization & Category Table Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* List Matrix */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 lg:col-span-3 space-y-4">
            <h3 className="text-lg font-semibold text-white">Category Caps Usage</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-right">Budget Limit</th>
                    <th className="pb-3 font-medium text-right">Spent</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {categories.length === 0 ? (
                    <tr><td colSpan="4" className="py-4 text-center text-slate-500">No active category configurations configured for this month.</td></tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.category_id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="py-3.5 font-medium text-slate-200">{c.category_name}</td>
                        <td className="py-3.5 text-right text-slate-400">₹{c.budget_limit.toFixed(2)}</td>
                        <td className="py-3.5 text-right font-medium text-slate-200">₹{c.total_spent.toFixed(2)}</td>
                        <td className="py-3.5 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.is_over_budget ? 'bg-red-400/10 text-red-400 border border-red-500/20' : 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {c.is_over_budget ? 'Over Limit' : 'Stable'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphical Representation Panel */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 lg:col-span-2 flex flex-col justify-between h-[340px] lg:h-auto">
            <h3 className="text-lg font-semibold text-white mb-2">Spending Layout</h3>
            <div className="w-full h-48 flex items-center justify-center">
              {summary.total_spent === 0 ? (
                <p className="text-sm text-slate-500 text-center">No transactional history available to plot.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories.filter(c => c.total_spent > 0)}
                      dataKey="total_spent"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {summary.total_spent > 0 && (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-2 text-slate-400">
                {categories.filter(c => c.total_spent > 0).map((c, i) => (
                  <div key={c.category_id} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span>{c.category_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Tier: Recent Transactions Ledger */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
          <h3 className="text-lg font-semibold text-white">Recent Historical Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {expenses.length === 0 ? (
                  <tr><td colSpan="4" className="py-4 text-center text-slate-500">No modern transaction logs submitted yet.</td></tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 text-slate-400">{e.date}</td>
                      <td className="py-3 font-medium text-slate-200">{e.description || 'N/A'}</td>
                      <td className="py-3 text-slate-400">{e.category_name}</td>
                      <td className="py-3 text-right font-semibold text-sky-400">₹{e.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;