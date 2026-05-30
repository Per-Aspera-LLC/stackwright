import React, { useState } from 'react';
import { FormContent, FormField } from '@stackwright/types';
import { useSafeColorMode, useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';
import { resolveBackground } from '../../utils/resolveBackground';

type Theme = ReturnType<typeof useSafeTheme>;

// ---------------------------------------------------------------------------
// Client-side validation — runs before fetch, returns first error or null
// ---------------------------------------------------------------------------

function validateFields(fields: FormField[], formData: FormData): string | null {
  for (const field of fields) {
    if (!field.required) continue;
    if (field.type === 'checkbox') {
      if (!formData.get(field.name)) {
        return `"${field.label ?? field.name}" is required.`;
      }
    } else {
      const value = String(formData.get(field.name) ?? '').trim();
      if (!value) {
        return `"${field.label ?? field.name}" is required.`;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Shared input style
// ---------------------------------------------------------------------------

function inputBaseStyle(theme: Theme): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    border: `1px solid ${theme.colors.secondary}`,
    borderRadius: '4px',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: '1rem',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// FieldItem — renders one form field with its accessible label
// ---------------------------------------------------------------------------

function FieldItem({ field, theme }: { field: FormField; theme: Theme }) {
  const id = field.name;
  const displayLabel = field.label ?? field.name;
  const requiredMark = field.required ? <span aria-hidden="true"> *</span> : null;
  const baseStyle = inputBaseStyle(theme);

  if (field.type === 'checkbox') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <input
          type="checkbox"
          id={id}
          name={field.name}
          aria-required={field.required || undefined}
          defaultChecked={field.defaultValue === 'true'}
        />
        <label htmlFor={id} style={{ color: theme.colors.text }}>
          {displayLabel}
          {requiredMark}
        </label>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
      <label htmlFor={id} style={{ color: theme.colors.text, fontWeight: 600 }}>
        {displayLabel}
        {requiredMark}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          id={id}
          name={field.name}
          placeholder={field.placeholder}
          aria-required={field.required || undefined}
          defaultValue={field.defaultValue}
          style={{ ...baseStyle, minHeight: '120px', resize: 'vertical' }}
        />
      ) : field.type === 'select' ? (
        <select
          id={id}
          name={field.name}
          aria-required={field.required || undefined}
          defaultValue={field.defaultValue}
          style={baseStyle}
        >
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        // text | email
        <input
          type={field.type}
          id={id}
          name={field.name}
          placeholder={field.placeholder}
          aria-required={field.required || undefined}
          defaultValue={field.defaultValue}
          style={baseStyle}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form — public component
// ---------------------------------------------------------------------------

export function Form({
  heading,
  description,
  fields,
  action,
  method = 'POST',
  submit_text = 'Submit',
  success_message,
  background,
}: FormContent) {
  const theme = useSafeTheme();
  const resolvedColorMode = useSafeColorMode();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headingColor = resolveColor(
    heading?.textColor ? heading.textColor : theme.colors.primary,
    theme.colors
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const validationErr = validateFields(fields, formData);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    try {
      const response = await fetch(action, { method, body: formData });
      if (!response.ok) {
        setError('Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Please try again.');
    }
  }

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: resolveBackground(background, theme, resolvedColorMode === 'dark'),
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {heading?.text && (
          <h3 style={{ color: headingColor, marginBottom: theme.spacing.md }}>{heading.text}</h3>
        )}

        {description && (
          <p
            style={{
              color: theme.colors.text,
              opacity: 0.8,
              lineHeight: 1.6,
              marginBottom: theme.spacing.lg,
            }}
          >
            {description}
          </p>
        )}

        {submitted ? (
          <div
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.primary,
              color: theme.colors.surface,
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            {success_message ?? 'Thank you! Your message has been sent.'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {fields.map((field) => (
                <FieldItem key={field.name} field={field} theme={theme} />
              ))}
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: theme.spacing.md,
                  padding: theme.spacing.sm,
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                marginTop: theme.spacing.lg,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: theme.colors.primary,
                color: theme.colors.surface,
                border: 'none',
                fontSize: '1rem',
              }}
            >
              {submit_text}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
