"use client";

/**
 * Drop this <NINField /> into your existing tenant profile form.
 *
 * Props:
 *   value    – controlled value from form state
 *   onChange – setter (e.g. from useState or react-hook-form)
 *   disabled – set true while submitting
 */

interface NINFieldProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function NINField({ value, onChange, disabled }: NINFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="nin"
        className="text-sm font-medium text-gray-700"
      >
        National ID Number (NIN)
        <span className="ml-1 text-gray-400 font-normal">(optional)</span>
      </label>
      <input
        id="nin"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        disabled={disabled}
        placeholder="CM86000XXXXXXXX"
        maxLength={20}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-primary
                   disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <p className="text-xs text-gray-400">
        As printed on Uganda National ID card.
      </p>
    </div>
  );
}