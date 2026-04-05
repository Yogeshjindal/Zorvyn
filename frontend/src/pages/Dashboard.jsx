import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
  getSummaryAPI,
  getRecentActivityAPI,
  getCategoryBreakdownAPI,
  getMonthlyTrendsAPI,
} from '../api/dashboard.api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'];

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAnalystOrAdmin = ['analyst', 'admin'].includes(user?.role);

  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests = [getSummaryAPI(), getRecentActivityAPI({ limit: 8 })];
    if (isAnalystOrAdmin) {
      requests.push(getCategoryBreakdownAPI(), getMonthlyTrendsAPI({ months: 6 }));
    }

    Promise.all(requests)
      .then(([sumRes, recentRes, catRes, trendsRes]) => {
        setSummary(sumRes.data.data);
        setRecent(recentRes.data.data.transactions);
        if (catRes) setCategories(catRes.data.data.categories);
        if (trendsRes) setTrends(trendsRes.data.data.trends);
      })
      .finally(() => setLoading(false));
  }, [isAnalystOrAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Prepare pie data
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const trendData = trends.map((t) => ({
    name: `${MONTH_NAMES[t.month]} ${String(t.year).slice(2)}`,
    Income: t.income,
    Expense: t.expense,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Income"
          value={fmt(summary?.totalIncome)}
          sub={`${summary?.incomeCount} transactions`}
          color="text-emerald-600"
        />
        <StatCard
          label="Total Expenses"
          value={fmt(summary?.totalExpenses)}
          sub={`${summary?.expenseCount} transactions`}
          color="text-rose-600"
        />
        <StatCard
          label="Net Balance"
          value={fmt(summary?.netBalance)}
          sub="Income minus expenses"
          color={summary?.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}
        />
        <StatCard
          label="Total Transactions"
          value={summary?.totalTransactions}
          sub="All time"
          color="text-primary-600"
        />
      </div>

      {/* Charts row — analyst and admin */}
      {isAnalystOrAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly trends */}
          {trendData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trends (Last 6 Months)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expense breakdown pie */}
          {expenseCategories.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={expenseCategories.slice(0, 8)}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, percent }) =>
                      `${category} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {expenseCategories.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Recent transactions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Notes</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 capitalize">
                      <span
                        className={`badge ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 max-w-xs truncate">
                      {tx.notes || '—'}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {fmt(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
