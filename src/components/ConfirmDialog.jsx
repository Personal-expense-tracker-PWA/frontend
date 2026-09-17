export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        <div className="mt-5 flex gap-3">
          <button
            className="tap flex-1 rounded-xl border border-gray-300 py-3 font-medium dark:border-gray-700"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`tap flex-1 rounded-xl py-3 font-medium text-white ${
              danger ? 'bg-red-600' : 'bg-brand-600'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
