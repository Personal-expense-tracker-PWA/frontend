import { useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useCategories } from '../context/CategoriesContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconPickerButton } from '../components/IconPicker';
import { suggestCategoryIcon } from '../utils/categoryIcons';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Section({ title, children }) {
  return (
    <section className="mx-5 mb-5 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
      <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h2>
      {children}
    </section>
  );
}

function ChangePinSection() {
  const { changePin } = useAuth();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    if (newPin !== confirmPin) {
      setMessage('New PINs do not match');
      return;
    }
    setBusy(true);
    try {
      await changePin(oldPin, newPin);
      setMessage('PIN updated');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setMessage(err.message || 'Failed to change PIN');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Change PIN">
      <form onSubmit={submit} className="space-y-2">
        <input
          type="password"
          inputMode="numeric"
          placeholder="Current PIN"
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
          value={oldPin}
          onChange={(e) => setOldPin(e.target.value)}
        />
        <input
          type="password"
          inputMode="numeric"
          placeholder="New PIN (4-6 digits)"
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
        />
        <input
          type="password"
          inputMode="numeric"
          placeholder="Confirm new PIN"
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
        />
        {message && <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="tap w-full rounded-xl bg-brand-600 py-3 font-medium text-white disabled:opacity-50"
          style={{ minHeight: 44 }}
        >
          Update PIN
        </button>
      </form>
    </Section>
  );
}

function CurrencySection() {
  const { currencySymbol, updateCurrency } = useSettings();
  const [value, setValue] = useState(currencySymbol);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await updateCurrency(value);
      setMessage('Saved');
    } catch (err) {
      setMessage(err.message || 'Failed to save');
    }
  }

  return (
    <Section title="Currency">
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          maxLength={5}
          className="w-24 rounded-xl border border-gray-300 px-3 py-2.5 text-center dark:border-gray-700 dark:bg-gray-800"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" className="tap flex-1 rounded-xl bg-brand-600 py-2.5 font-medium text-white" style={{ minHeight: 44 }}>
          Save
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>}
    </Section>
  );
}

function CategoriesSection() {
  const { categories, refresh } = useCategories();
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newIconTouched, setNewIconTouched] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editIconTouched, setEditIconTouched] = useState(false);
  const [error, setError] = useState('');
  const [reassignFor, setReassignFor] = useState(null); // { id, count }
  const [reassignTarget, setReassignTarget] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleNewNameChange(value) {
    setNewName(value);
    if (!newIconTouched) setNewIcon(suggestCategoryIcon(value));
  }

  function handleEditNameChange(value) {
    setEditName(value);
    if (!editIconTouched) setEditIcon(suggestCategoryIcon(value));
  }

  async function addCategory(e) {
    e.preventDefault();
    setError('');
    if (!newName.trim()) return;
    try {
      await api.categories.create({ name: newName.trim(), icon: newIcon || '📦' });
      setNewName('');
      setNewIcon('📦');
      setNewIconTouched(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditIcon(c.icon);
    setEditIconTouched(true); // renaming an existing category keeps its current icon unless the user edits it
  }

  async function saveEdit(id) {
    try {
      await api.categories.update(id, { name: editName, icon: editIcon });
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.categories.remove(id);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      if (err.status === 409) {
        setDeleteTarget(null);
        setReassignFor({ id });
      } else {
        setError(err.message);
        setDeleteTarget(null);
      }
    }
  }

  async function confirmReassignDelete() {
    if (!reassignTarget) return;
    try {
      await api.categories.remove(reassignFor.id, reassignTarget);
      setReassignFor(null);
      setReassignTarget('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Section title="Categories">
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700">
            {editingId === c.id ? (
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center gap-2">
                  <IconPickerButton
                    value={editIcon}
                    onChange={(icon) => {
                      setEditIcon(icon);
                      setEditIconTouched(true);
                    }}
                  />
                  <input
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
                    value={editName}
                    onChange={(e) => handleEditNameChange(e.target.value)}
                  />
                  <button
                    type="button"
                    className="tap flex-shrink-0 text-lg"
                    style={{ minHeight: 44, minWidth: 32 }}
                    title="Suggest icon from name"
                    onClick={() => {
                      setEditIcon(suggestCategoryIcon(editName));
                      setEditIconTouched(false);
                    }}
                  >
                    ✨
                  </button>
                </div>
                <div className="flex justify-end gap-3">
                  <button className="tap text-sm text-gray-500" style={{ minHeight: 44 }} onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                  <button className="tap text-sm font-medium text-brand-600" style={{ minHeight: 44 }} onClick={() => saveEdit(c.id)}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-xl">{c.icon}</span>
                <span className="flex-1">{c.name}</span>
                <button className="tap text-sm font-medium text-brand-600" style={{ minHeight: 44 }} onClick={() => startEdit(c)}>
                  Edit
                </button>
                <button
                  className="tap text-sm font-medium text-red-600"
                  style={{ minHeight: 44 }}
                  onClick={() => setDeleteTarget(c.id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={addCategory} className="mt-3 flex gap-2">
        <IconPickerButton
          value={newIcon}
          onChange={(icon) => {
            setNewIcon(icon);
            setNewIconTouched(true);
          }}
        />
        <input
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
          placeholder="New category name"
          value={newName}
          onChange={(e) => handleNewNameChange(e.target.value)}
        />
        <button type="submit" className="tap rounded-xl bg-brand-600 px-4 font-medium text-white" style={{ minHeight: 44 }}>
          Add
        </button>
      </form>
      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
        The icon is auto-suggested from the name — tap it to type your own.
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this category?"
        confirmLabel="Delete"
        danger
        onConfirm={() => handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {reassignFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-gray-900">
            <h3 className="text-lg font-semibold">Category in use</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              This category has expenses tied to it. Move them to another category before deleting.
            </p>
            <select
              className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              value={reassignTarget}
              onChange={(e) => setReassignTarget(e.target.value)}
            >
              <option value="">Choose a category…</option>
              {categories.filter((c) => c.id !== reassignFor.id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex gap-3">
              <button
                className="tap flex-1 rounded-xl border border-gray-300 py-3 font-medium dark:border-gray-700"
                onClick={() => {
                  setReassignFor(null);
                  setReassignTarget('');
                }}
              >
                Cancel
              </button>
              <button
                className="tap flex-1 rounded-xl bg-red-600 py-3 font-medium text-white disabled:opacity-50"
                disabled={!reassignTarget}
                onClick={confirmReassignDelete}
              >
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

function DataSection() {
  const { refresh: refreshCategories } = useCategories();
  const { refresh: refreshSettings } = useSettings();
  const [message, setMessage] = useState('');
  const [confirmImport, setConfirmImport] = useState(null);
  const fileInputRef = useRef(null);

  async function exportCsv() {
    try {
      const { blob, filename } = await api.data.exportCsv();
      downloadBlob(blob, filename);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function exportJson() {
    try {
      const data = await api.data.exportJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `expense-tracker-backup-${Date.now()}.json`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        setConfirmImport(data);
      } catch {
        setMessage('That file is not valid JSON');
      }
    };
    reader.readAsText(file);
  }

  async function runImport() {
    try {
      const result = await api.data.importJson(confirmImport);
      setMessage(`Imported ${result.imported.expenses} expenses and ${result.imported.categories} categories. Reloading…`);
      // Import replaces every category (with new ids) and every expense server-side, so every
      // screen's in-memory state (categories, currency, any loaded expense lists) is now stale —
      // reload rather than trying to patch each context individually.
      await Promise.all([refreshCategories(), refreshSettings()]);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setConfirmImport(null);
    }
  }

  return (
    <Section title="Backup & Export">
      <div className="space-y-2">
        <button className="tap w-full rounded-xl border border-gray-300 py-3 font-medium dark:border-gray-700" style={{ minHeight: 44 }} onClick={exportCsv}>
          Export to CSV
        </button>
        <button className="tap w-full rounded-xl border border-gray-300 py-3 font-medium dark:border-gray-700" style={{ minHeight: 44 }} onClick={exportJson}>
          Export all data as JSON
        </button>
        <button
          className="tap w-full rounded-xl border border-gray-300 py-3 font-medium dark:border-gray-700"
          style={{ minHeight: 44 }}
          onClick={() => fileInputRef.current?.click()}
        >
          Import from JSON
        </button>
        <input type="file" accept="application/json" ref={fileInputRef} className="hidden" onChange={handleFileChosen} />
      </div>
      {message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>}

      <ConfirmDialog
        open={Boolean(confirmImport)}
        title="Replace all data?"
        message="Importing will replace all current expenses and categories with the contents of this backup. This can't be undone."
        confirmLabel="Import & Replace"
        danger
        onConfirm={runImport}
        onCancel={() => setConfirmImport(null)}
      />
    </Section>
  );
}

export function Settings() {
  const { lock } = useAuth();

  return (
    <div className="safe-top pb-28">
      <header className="px-5 pt-6">
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>
      <div className="mt-5">
        <ChangePinSection />
        <CurrencySection />
        <CategoriesSection />
        <DataSection />
        <div className="mx-5">
          <button
            className="tap w-full rounded-xl border border-red-200 py-3 font-medium text-red-600 dark:border-red-900"
            style={{ minHeight: 44 }}
            onClick={lock}
          >
            Lock app
          </button>
        </div>
      </div>
    </div>
  );
}
