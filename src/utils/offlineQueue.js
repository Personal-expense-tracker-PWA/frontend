const KEY = 'expense_tracker_offline_queue';

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    // localStorage unavailable (private mode / quota) — queue is best-effort only
  }
}

export function enqueueWrite(entry) {
  const queue = getQueue();
  queue.push({ ...entry, id: crypto.randomUUID(), queuedAt: Date.now() });
  saveQueue(queue);
  return queue.length;
}

export function removeFromQueue(id) {
  saveQueue(getQueue().filter((e) => e.id !== id));
}

export function queueLength() {
  return getQueue().length;
}
