import { useNetwork } from '../context/NetworkContext';

export function OfflineBanner() {
  const { isOnline, pending } = useNetwork();

  if (isOnline && pending === 0) return null;

  return (
    <div
      className={`safe-top px-4 py-2 text-center text-sm font-medium text-white ${
        isOnline ? 'bg-amber-600' : 'bg-gray-700'
      }`}
    >
      {isOnline
        ? `Syncing ${pending} saved change${pending === 1 ? '' : 's'}…`
        : "You're offline — changes will sync when back online"}
    </div>
  );
}
