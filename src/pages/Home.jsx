import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useCategories } from '../context/CategoriesContext';
import { useSettings } from '../context/SettingsContext';
import { ExpenseRow } from '../components/ExpenseRow';
import { QuickAddSheet } from '../components/QuickAddSheet';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, Spinner } from '../components/EmptyState';

function groupByDate(expenses) {
  const groups = new Map();
  for (const e of expenses) {
    if (!groups.has(e.date)) groups.set(e.date, []);
    groups.get(e.date).push(e);
  }
  return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function formatDateHeading(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function Home() {
  const { currencySymbol } = useSettings();
  const { categories, loaded: categoriesLoaded } = useCategories();
  const [expenses, setExpenses] = useState([]);
  const [dashboard, setDashboard] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [list, summary] = await Promise.all([api.expenses.list(), api.summary.dashboard()]);
      setExpenses(list);
      setDashboard(summary);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openQuickAdd() {
    setEditingExpense(null);
    setSheetOpen(true);
  }

  function openEdit(expense) {
    setEditingExpense(expense);
    setSheetOpen(true);
  }

  function handleSaved() {
    setSheetOpen(false);
    setEditingExpense(null);
    load();
  }

  async function confirmDelete() {
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.expenses.remove(id);
    } finally {
      load();
    }
  }

  const groups = groupByDate(expenses);
  const fmt = (n) => `${currencySymbol}${Number(n).toFixed(2)}`;

  return (
    <div className="safe-top pb-28">
      <header className="px-5 pt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Today's spend</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">{fmt(dashboard.today)}</p>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">This week</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(dashboard.week)}</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(dashboard.month)}</p>
          </div>
        </div>
      </header>

      <section className="mt-6">
        {loading ? (
          <Spinner />
        ) : error ? (
          <EmptyState icon="⚠️" title="Couldn't load expenses" subtitle={error} />
        ) : groups.length === 0 ? (
          <EmptyState icon="🧾" title="No expenses yet" subtitle="Tap + to add your first one" />
        ) : (
          <div className="space-y-4">
            <p className="px-5 text-xs text-gray-400 dark:text-gray-500">
              Tap an expense to edit · swipe left to delete
            </p>
            {groups.map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center justify-between px-5 pb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {formatDateHeading(date)}
                  </p>
                  <p className="text-xs font-semibold text-gray-400">
                    {fmt(items.reduce((s, e) => s + e.amount, 0))}
                  </p>
                </div>
                <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm dark:divide-gray-800 dark:bg-gray-900 mx-3">
                  {items.map((e) => (
                    <ExpenseRow
                      key={e.id}
                      expense={e}
                      currencySymbol={currencySymbol}
                      onClick={() => openEdit(e)}
                      onDelete={() => setDeleteTarget(e.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        className="tap safe-bottom fixed bottom-24 right-5 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-3xl text-white shadow-lg"
        onClick={openQuickAdd}
        aria-label="Add expense"
      >
        +
      </button>

      {categoriesLoaded && (
        <QuickAddSheet
          open={sheetOpen}
          expense={editingExpense}
          categories={categories}
          currencySymbol={currencySymbol}
          onClose={() => setSheetOpen(false)}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this expense?"
        message="This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
