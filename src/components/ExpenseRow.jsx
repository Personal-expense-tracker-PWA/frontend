import { useRef, useState } from 'react';

const REVEAL_WIDTH = 84;

function formatRowDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ExpenseRow({ expense, currencySymbol, onClick, onDelete }) {
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startDragX = useRef(0);
  const moved = useRef(false);

  const handlePointerDown = (e) => {
    dragging.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startDragX.current = dragX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) moved.current = true;
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, startDragX.current + delta));
    setDragX(next);
  };

  const handlePointerUp = () => {
    dragging.current = false;
    setDragX((x) => (x < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0));
  };

  const handleRowClick = () => {
    if (moved.current) return;
    if (dragX !== 0) {
      setDragX(0);
      return;
    }
    onClick?.();
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex w-[84px] items-center justify-center bg-red-600">
        <button
          className="tap flex h-full w-full items-center justify-center text-sm font-medium text-white"
          style={{ minHeight: 44 }}
          onClick={() => {
            setDragX(0);
            onDelete?.();
          }}
        >
          Delete
        </button>
      </div>
      <div
        className="tap relative flex select-none items-center gap-3 bg-white px-4 py-3 dark:bg-gray-900"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging.current ? 'none' : 'transform 0.15s',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleRowClick}
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl dark:bg-brand-900/40">
          {expense.category_icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{expense.category_name}</p>
          <p className="truncate text-sm text-gray-400 dark:text-gray-500">
            {formatRowDate(expense.date)} · {expense.payment_method}
          </p>
          {expense.note && (
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">{expense.note}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <p className="font-semibold tabular-nums">
            {currencySymbol}
            {expense.amount.toFixed(2)}
          </p>
          <svg
            className="h-4 w-4 flex-shrink-0 text-gray-300 dark:text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
