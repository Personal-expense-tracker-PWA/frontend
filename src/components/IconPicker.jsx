import { useState } from 'react';
import { ICON_CHOICES } from '../utils/categoryIcons';

export function IconPickerButton({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="tap flex h-11 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-gray-300 text-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={() => setOpen(true)}
        aria-label="Choose icon"
      >
        {value || '📦'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="safe-bottom max-h-[75vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700 sm:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Choose an icon</h3>
              <button className="tap text-sm font-medium text-brand-600" style={{ minHeight: 44 }} onClick={() => setOpen(false)}>
                Done
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {ICON_CHOICES.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`tap flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${
                    value === icon
                      ? 'bg-brand-100 ring-2 ring-brand-600 dark:bg-brand-900/50'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                  onClick={() => {
                    onChange(icon);
                    setOpen(false);
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">Or type your own emoji</label>
              <input
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-center text-xl dark:border-gray-700 dark:bg-gray-800"
                maxLength={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
