import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function PinDots({ length, filled }) {
  return (
    <div className="flex justify-center gap-5">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`h-5 w-5 rounded-full border-2 border-brand-600 transition-colors ${
            i < filled ? 'bg-brand-600' : 'bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}

function Keypad({ onDigit, onBackspace }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-3 justify-items-center gap-y-4">
      {keys.map((k, i) =>
        k === '' ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            className="tap flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl font-medium text-gray-800 active:bg-gray-200 dark:bg-gray-800/70 dark:text-gray-100 dark:active:bg-gray-700 sm:h-24 sm:w-24 sm:text-4xl"
            onClick={() => (k === '⌫' ? onBackspace() : onDigit(k))}
          >
            {k}
          </button>
        )
      )}
    </div>
  );
}

// Submits automatically once the PIN reaches 6 digits, or after a short pause once it reaches 4-5.
function usePinAutoSubmit(pin, onComplete, busy) {
  const pauseTimer = useRef(null);

  useEffect(() => {
    if (busy) return;
    clearTimeout(pauseTimer.current);

    if (pin.length === 6) {
      onComplete(pin);
    } else if (pin.length >= 4) {
      pauseTimer.current = setTimeout(() => onComplete(pin), 600);
    }

    return () => clearTimeout(pauseTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, busy]);
}

export function Lock() {
  const { status, setPin, verifyPin } = useAuth();
  const isSetup = status === 'needsSetup';
  const [stage, setStage] = useState('enter'); // enter | confirm (setup only)
  const [pin, setPinValue] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleComplete(value) {
    setError('');
    if (isSetup) {
      if (stage === 'enter') {
        setFirstPin(value);
        setPinValue('');
        setStage('confirm');
        return;
      }
      if (value !== firstPin) {
        setError('PINs did not match — try again');
        setPinValue('');
        setFirstPin('');
        setStage('enter');
        return;
      }
      setBusy(true);
      try {
        await setPin(value);
      } catch (err) {
        setError(err.message || 'Failed to set PIN');
        setPinValue('');
        setFirstPin('');
        setStage('enter');
      } finally {
        setBusy(false);
      }
    } else {
      setBusy(true);
      try {
        await verifyPin(value, remember);
      } catch (err) {
        setError(err.message || 'Incorrect PIN');
        setPinValue('');
      } finally {
        setBusy(false);
      }
    }
  }

  usePinAutoSubmit(pin, handleComplete, busy);

  function onDigit(d) {
    if (busy) return;
    setError('');
    setPinValue((p) => (p.length < 6 ? p + d : p));
  }

  function onBackspace() {
    if (busy) return;
    setPinValue((p) => p.slice(0, -1));
  }

  return (
    <div className="safe-top safe-bottom flex h-full flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <p className="text-4xl">💰</p>
        <h1 className="mt-2 text-xl font-semibold">
          {isSetup ? (stage === 'enter' ? 'Set your PIN' : 'Confirm your PIN') : 'Enter PIN'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isSetup ? '4-6 digits, keep it memorable' : 'Unlock your expense tracker'}
        </p>
      </div>

      <PinDots length={Math.max(pin.length, 4)} filled={pin.length} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Keypad onDigit={onDigit} onBackspace={onBackspace} />

      {!isSetup && (
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            className="h-5 w-5 rounded"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me for 7 days
        </label>
      )}
    </div>
  );
}
