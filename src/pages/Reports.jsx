import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { api } from '../api/client';
import { useCategories } from '../context/CategoriesContext';
import { useSettings } from '../context/SettingsContext';
import { ExpenseRow } from '../components/ExpenseRow';
import { QuickAddSheet } from '../components/QuickAddSheet';
import { EmptyState, Spinner } from '../components/EmptyState';

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'];

// Distinct-hue categorical palette (blue/orange/aqua/yellow/magenta/green/violet/red),
// validated for CVD separation and contrast against our card surfaces in both themes.
const COLORS_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const COLORS_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDark;
}

export function Reports() {
  const isDark = useIsDarkMode();
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);

  const { categories } = useCategories();
  const { currencySymbol } = useSettings();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month, year, category_id: categoryId, payment_method: paymentMethod, search: debouncedSearch };
      const [summaryData, expenseData] = await Promise.all([
        api.summary.monthly(params),
        api.expenses.list(params),
      ]);
      setSummary(summaryData);
      setExpenses(expenseData);
    } finally {
      setLoading(false);
    }
  }, [month, year, categoryId, paymentMethod, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  const fmt = (n) => `${currencySymbol}${Number(n).toFixed(2)}`;

  const pieData = useMemo(
    () => (summary?.byCategory || []).map((c) => ({ name: c.name, value: c.total, icon: c.icon })),
    [summary]
  );

  const trendData = useMemo(
    () =>
      (summary?.dailyTrend || []).map((d) => ({
        day: Number(d.date.slice(-2)),
        total: d.total,
      })),
    [summary]
  );

  return (
    <div className="safe-top pb-28">
      <header className="px-5 pt-6">
        <h1 className="text-xl font-semibold">Reports</h1>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-900">
          <button className="tap px-3 py-2 text-xl" style={{ minHeight: 44 }} onClick={() => shiftMonth(-1)}>
            ‹
          </button>
          <p className="font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </p>
          <button className="tap px-3 py-2 text-xl" style={{ minHeight: 44 }} onClick={() => shiftMonth(1)}>
            ›
          </button>
        </div>
      </header>

      {loading && !summary ? (
        <Spinner />
      ) : (
        <div className="mt-5 space-y-5 px-5">
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total spend</p>
            <p className="text-3xl font-bold tabular-nums">{fmt(summary?.total || 0)}</p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
            <p className="mb-2 text-sm font-medium">By category</p>
            {pieData.length === 0 ? (
              <EmptyState icon="📊" title="No spending this month" />
            ) : (
              <>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        isAnimationActive={false}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {pieData.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate">
                        {c.icon} {c.name}
                      </span>
                      <span className="ml-auto tabular-nums text-gray-500">{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
            <p className="mb-2 text-sm font-medium">Daily trend</p>
            {trendData.length === 0 ? (
              <EmptyState icon="📈" title="Nothing to plot yet" />
            ) : (
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" fontSize={11} />
                    <YAxis fontSize={11} width={40} />
                    <Tooltip formatter={(v) => fmt(v)} labelFormatter={(d) => `Day ${d}`} />
                    <Line type="monotone" dataKey="total" stroke="#059669" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
            <p className="text-sm font-medium">Filters</p>
            <input
              type="text"
              placeholder="Search notes…"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <select
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {expenses.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Tap an expense to edit · swipe left to delete
            </p>
          )}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
            {expenses.length === 0 ? (
              <EmptyState icon="🔍" title="No matching expenses" />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {expenses.map((e) => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    currencySymbol={currencySymbol}
                    onClick={() => setEditingExpense(e)}
                    onDelete={async () => {
                      await api.expenses.remove(e.id);
                      load();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <QuickAddSheet
        open={Boolean(editingExpense)}
        expense={editingExpense}
        categories={categories}
        currencySymbol={currencySymbol}
        onClose={() => setEditingExpense(null)}
        onSaved={() => {
          setEditingExpense(null);
          load();
        }}
        onDeleted={() => {
          setEditingExpense(null);
          load();
        }}
      />
    </div>
  );
}
