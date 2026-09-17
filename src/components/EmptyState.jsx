export function EmptyState({ icon = '🧾', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-500 dark:text-gray-400">
      <span className="text-4xl">{icon}</span>
      <p className="font-medium text-gray-700 dark:text-gray-200">{title}</p>
      {subtitle && <p className="text-sm">{subtitle}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}
