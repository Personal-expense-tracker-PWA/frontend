import { useEffect, useRef, useState } from 'react';
import { api, QueuedOfflineError } from '../api/client';
import { useNetwork } from '../context/NetworkContext';
import { ConfirmDialog } from './ConfirmDialog';

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function QuickAddSheet({ open, expense, categories, currencySymbol, onClose, onSaved, onDeleted }) {
  const isEdit = Boolean(expense);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [note, setNote] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const amountRef = useRef(null);
  const { notifyQueued } = useNetwork();

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setAmount(String(expense.amount));
      setCategoryId(expense.category_id);
      setDate(expense.date);
      setPaymentMethod(expense.payment_method);
      setNote(expense.note || '');
      setShowMore(false);
    } else {
      setAmount('');
      setCategoryId(null);
      setDate(todayISO());
      setPaymentMethod('Cash');
      setNote('');
      setShowMore(false);
    }
    setError('');
    setTimeout(() => amountRef.current?.focus(), 100);
  }, [open, expense]);

  if (!open) return null;

  const parsedAmount = parseFloat(amount);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  async function submit(catId) {
    if (!amountValid) {
      setError('Enter an amount first');
      amountRef.current?.focus();
      return;
    }
    if (!catId) {
      setError('Pick a category');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      date,
      amount: Math.round(parsedAmount * 100) / 100,
      category_id: catId,
      payment_method: paymentMethod,
      note,
    };
    try {
      if (isEdit) {
        await api.expenses.update(expense.id, payload);
      } else {
        await api.expenses.create(payload);
      }
      onSaved?.();
    } catch (err) {
      if (err instanceof QueuedOfflineError) {
        notifyQueued();
        onSaved?.();
      } else {
        setError(err.message || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCategoryTap(id) {
    setCategoryId(id);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.expenses.remove(expense.id);
      onDeleted?.();
    } catch (err) {
      if (err instanceof QueuedOfflineError) {
        notifyQueued();
        onDeleted?.();
      } else {
        setError(err.message || 'Failed to delete');
      }
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="safe-bottom max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit expense' : 'Add expense'}</h2>
          {isEdit && (
            <button
              className="tap text-sm font-medium text-red-600"
              style={{ minHeight: 44 }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          )}
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">Amount</label>
          <div className="flex items-center gap-2 rounded-2xl border border-gray-300 px-4 py-3 dark:border-gray-700">
            <span className="text-2xl font-semibold text-gray-400">{currencySymbol}</span>
            <input
              ref={amountRef}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-semibold outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-2">
          <label className="mb-2 block text-sm text-gray-500 dark:text-gray-400">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`tap flex flex-col items-center gap-1 rounded-2xl border py-3 text-xs font-medium ${
                  categoryId === c.id
                    ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                style={{ minHeight: 44 }}
                onClick={() => handleCategoryTap(c.id)}
                disabled={saving}
              >
                <span className="text-xl">{c.icon}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          className="tap mt-4 w-full text-center text-sm font-medium text-brand-600"
          style={{ minHeight: 44 }}
          onClick={() => setShowMore((v) => !v)}
        >
          {showMore ? 'Hide details ▲' : 'More details ▼'}
        </button>

        {showMore && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">Date</label>
              <input
                type="date"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">Payment method</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    className={`tap rounded-xl border py-2 text-xs font-medium ${
                      paymentMethod === m
                        ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    style={{ minHeight: 44 }}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">Note (optional)</label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                rows={2}
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        )}

        <button
          className="tap mt-4 w-full rounded-2xl bg-brand-600 py-3.5 font-semibold text-white disabled:opacity-50"
          style={{ minHeight: 44 }}
          disabled={saving}
          onClick={() => submit(categoryId)}
        >
          {isEdit ? 'Save changes' : 'Save expense'}
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this expense?"
        message="This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
