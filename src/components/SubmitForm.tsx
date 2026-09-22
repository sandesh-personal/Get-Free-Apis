'use client';

import { useId, useState } from 'react';

/**
 * The three-step submission flow from the blueprint's mockups.
 *
 * IMPORTANT, and the reason this is not a normal POST: the site is a static export
 * with no form endpoint and no database. Rather than fake a submission — a button
 * that appears to save and silently drops the data is worse than no form — the last
 * step composes a pre-filled email to the submissions address. The visitor can see
 * exactly what is being sent, and the message lands somewhere a human reads.
 *
 * If a real endpoint is added later, only `submit()` needs to change.
 */
type Fields = {
  name: string;
  baseUrl: string;
  docsUrl: string;
  auth: string;
  category: string;
  tags: string;
  description: string;
  ownedByMe: boolean;
};

const EMPTY: Fields = {
  name: '',
  baseUrl: '',
  docsUrl: '',
  auth: 'none',
  category: '',
  tags: '',
  description: '',
  ownedByMe: false,
};

const STEPS = ['API Details', 'Documentation & Auth', 'Validation & Submission'] as const;

const AUTH_OPTIONS = [
  { value: 'none', label: 'No authentication' },
  { value: 'apiKey', label: 'API key' },
  { value: 'oauth', label: 'OAuth' },
  { value: 'other', label: 'Something else' },
];

export function SubmitForm({ email }: { email: string }) {
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [touched, setTouched] = useState(false);

  const uid = useId();
  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  /*
   * Validated per step so someone cannot reach the summary with an empty name, and
   * so the error appears next to the field rather than only at the end.
   */
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (step === 0) {
    if (!fields.name.trim()) errors.name = 'Give the API a name.';
    if (!fields.description.trim()) errors.description = 'One line on what data it returns.';
  }
  if (step === 1 && !fields.docsUrl.trim()) {
    errors.docsUrl = 'A documentation URL is the one thing we cannot work out ourselves.';
  }

  const stepValid = Object.keys(errors).length === 0;

  function next() {
    setTouched(true);
    if (!stepValid) return;
    setTouched(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setTouched(false);
    setStep((s) => Math.max(s - 1, 0));
  }

  const body = [
    `Name: ${fields.name}`,
    `Base URL: ${fields.baseUrl || '(not given)'}`,
    `Documentation: ${fields.docsUrl}`,
    `Authentication: ${AUTH_OPTIONS.find((a) => a.value === fields.auth)?.label}`,
    `Category: ${fields.category || '(no suggestion)'}`,
    `Tags: ${fields.tags || '(none)'}`,
    '',
    'Description:',
    fields.description,
    '',
    fields.ownedByMe ? 'I built this API.' : 'I am not affiliated with this API.',
  ].join('\n');

  const mailto = `mailto:${email}?subject=${encodeURIComponent(
    `API submission: ${fields.name || 'untitled'}`,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-5 sm:p-6">
      {/*
        The list markers are overridden because this form renders inside <Prose>,
        whose [&_ol]:list-decimal would otherwise print "1." beside the numbered
        badge and show every step twice.
      */}
      <ol className="mb-6 flex flex-wrap gap-x-5 gap-y-2 !list-none !pl-0">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-hidden
              className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                i === step
                  ? 'bg-accent text-accent-on'
                  : i < step
                    ? 'bg-accent-soft text-accent'
                    : 'bg-surface text-muted'
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-sm ${i === step ? 'font-semibold text-foreground' : 'text-muted'}`}
            >
              {label}
              {i === step && <span className="sr-only"> (current step)</span>}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <Field
            id={`${uid}-name`}
            label="API Name"
            required
            value={fields.name}
            onChange={(v) => set('name', v)}
            error={touched ? errors.name : undefined}
            placeholder="OpenWeather"
          />
          <Field
            id={`${uid}-base`}
            label="Base URL"
            type="url"
            value={fields.baseUrl}
            onChange={(v) => set('baseUrl', v)}
            placeholder="https://api.openweathermap.org"
            help="Optional. We resolve the live endpoint during our own checks."
          />
          <Field
            id={`${uid}-desc`}
            label="Description"
            required
            multiline
            value={fields.description}
            onChange={(v) => set('description', v)}
            error={touched ? errors.description : undefined}
            placeholder="Current weather, forecasts and historical data for any location."
            help="One line, plain and specific. What data does it return?"
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field
            id={`${uid}-docs`}
            label="Documentation URL"
            type="url"
            required
            value={fields.docsUrl}
            onChange={(v) => set('docsUrl', v)}
            error={touched ? errors.docsUrl : undefined}
            placeholder="https://openweathermap.org/api"
            help="The page a developer should actually start on."
          />

          <div>
            <label
              htmlFor={`${uid}-auth`}
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Authentication
            </label>
            <select
              id={`${uid}-auth`}
              value={fields.auth}
              onChange={(e) => set('auth', e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {AUTH_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <Field
            id={`${uid}-cat`}
            label="Category"
            value={fields.category}
            onChange={(v) => set('category', v)}
            placeholder="Weather"
            help="Or your best guess. We normalise it."
          />
          <Field
            id={`${uid}-tags`}
            label="Tags"
            value={fields.tags}
            onChange={(v) => set('tags', v)}
            placeholder="weather, forecast, geocoding"
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <dl className="divide-y divide-[var(--border)] rounded-lg border border-border-subtle text-sm">
            <Summary label="Name" value={fields.name} />
            <Summary label="Base URL" value={fields.baseUrl} />
            <Summary label="Documentation" value={fields.docsUrl} />
            <Summary
              label="Authentication"
              value={AUTH_OPTIONS.find((a) => a.value === fields.auth)?.label ?? ''}
            />
            <Summary label="Category" value={fields.category} />
            <Summary label="Tags" value={fields.tags} />
            <Summary label="Description" value={fields.description} />
          </dl>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-strong">
            <input
              type="checkbox"
              checked={fields.ownedByMe}
              onChange={(e) => set('ownedByMe', e.target.checked)}
              className="mt-0.5 size-4 cursor-pointer accent-[var(--accent)]"
            />
            This is my own API. (Fine either way — it just gets noted on the listing.)
          </label>

          {/*
            !text-accent-on and !no-underline, not the plain utilities: this form
            renders inside <Prose> (see submit/page.tsx), whose [&_a]:text-accent and
            [&_a]:underline rules target every <a> for markdown-link styling. Those
            descendant selectors outrank plain utility classes on specificity alone
            regardless of source order, so without `!` this link rendered as green
            underlined text on its own green fill — invisible, not just off-brand,
            and then styled like a hyperlink rather than the button it is.
          */}
          <a
            href={mailto}
            className="block w-full rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold !text-accent-on !no-underline transition hover:bg-accent-hover"
          >
            Submit
          </a>

          <p className="rounded-lg bg-surface p-3 text-xs leading-relaxed text-muted">
            Submit opens your email client with these details filled in, addressed to{' '}
            <span className="font-medium text-muted-strong">{email}</span> — we have no server
            collecting this form, so nothing is stored anywhere until you send it. Your submission
            will then be validated by our{' '}
            <span className="text-accent">automated uptime check</span> before it is listed.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="cursor-pointer rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={next}
            className="ml-auto cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-on transition hover:bg-accent-hover"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  help,
  placeholder,
  type = 'text',
  required,
  multiline,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  help?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const shared = {
    id,
    value,
    placeholder,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [errorId, helpId].filter(Boolean).join(' ') || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className: `w-full rounded-lg border bg-surface-raised px-3 py-2 text-sm outline-none transition ${
      error ? 'border-no focus:border-no' : 'border-border-subtle focus:border-accent'
    }`,
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="text-no" aria-hidden>
            {' '}
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {multiline ? <textarea rows={3} {...shared} /> : <input type={type} {...shared} />}

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-no">
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="mt-1.5 text-xs text-muted">
          {help}
        </p>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-3 py-2">
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">
        {value || <span className="text-muted">Not given</span>}
      </dd>
    </div>
  );
}
