import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Form } from '../../src/components/base/Form';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseProps = {
  label: 'test-form',
  fields: [],
  action: 'https://formspree.io/f/test123',
} as const;

// ---------------------------------------------------------------------------
// Setup — mock fetch globally for every test
// ---------------------------------------------------------------------------

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Form — rendering', () => {
  it('renders heading and description', () => {
    render(
      <Form
        {...baseProps}
        heading={{ text: 'Contact Us', textSize: 'h3' }}
        description="Fill in the form below."
      />
    );
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Fill in the form below.')).toBeInTheDocument();
  });

  it('renders without heading or description', () => {
    render(<Form {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders custom submit button text', () => {
    render(<Form {...baseProps} submit_text="Send Message" />);
    expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
  });

  it('renders a text input with an accessible label', () => {
    render(
      <Form {...baseProps} fields={[{ name: 'fullName', type: 'text', label: 'Full Name' }]} />
    );
    // getByLabelText uses the accessible name — aria-hidden * is excluded
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Full Name' })).toBeInTheDocument();
  });

  it('renders an email input', () => {
    render(
      <Form {...baseProps} fields={[{ name: 'email', type: 'email', label: 'Email address' }]} />
    );
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('renders a textarea', () => {
    render(
      <Form {...baseProps} fields={[{ name: 'message', type: 'textarea', label: 'Message' }]} />
    );
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
  });

  it('renders a select with all options', () => {
    render(
      <Form
        {...baseProps}
        fields={[
          {
            name: 'country',
            type: 'select',
            label: 'Country',
            options: ['USA', 'Canada', 'UK'],
          },
        ]}
      />
    );
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'USA' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Canada' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'UK' })).toBeInTheDocument();
  });

  it('renders a checkbox with an inline label', () => {
    render(
      <Form
        {...baseProps}
        fields={[{ name: 'agree', type: 'checkbox', label: 'I agree to terms' }]}
      />
    );
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText(/I agree to terms/)).toBeInTheDocument();
  });

  it('shows * in label for required fields', () => {
    const { container } = render(
      <Form
        {...baseProps}
        fields={[{ name: 'email', type: 'email', label: 'Email', required: true }]}
      />
    );
    const label = container.querySelector('label[for="email"]');
    expect(label?.textContent).toContain('*');
  });

  it('sets aria-required on required inputs', () => {
    render(
      <Form
        {...baseProps}
        fields={[{ name: 'name', type: 'text', label: 'Name', required: true }]}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-required', 'true');
  });

  it('uses name as label when label is omitted', () => {
    render(<Form {...baseProps} fields={[{ name: 'fullName', type: 'text' }]} />);
    expect(screen.getByLabelText('fullName')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Submission — success path
// ---------------------------------------------------------------------------

describe('Form — successful submission', () => {
  it('shows success_message after ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const { container } = render(
      <Form
        {...baseProps}
        fields={[{ name: 'name', type: 'text', label: 'Name' }]}
        success_message="Thanks! We'll be in touch."
      />
    );

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText("Thanks! We'll be in touch.")).toBeInTheDocument();
    });
  });

  it('shows default success message when success_message is omitted', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const { container } = render(<Form {...baseProps} />);

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });
  });

  it('hides the form after successful submission', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const { container } = render(
      <Form {...baseProps} fields={[{ name: 'name', type: 'text', label: 'Name' }]} />
    );

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.querySelector('form')).not.toBeInTheDocument();
    });
  });

  it('calls fetch with the action URL and POST method', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    const { container } = render(
      <Form {...baseProps} action="https://formspree.io/f/xyzabc" method="POST" />
    );

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://formspree.io/f/xyzabc',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Submission — error path
// ---------------------------------------------------------------------------

describe('Form — failed submission', () => {
  it('shows error banner when response is not ok', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const { container } = render(<Form {...baseProps} />);

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('shows error banner on network failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { container } = render(<Form {...baseProps} />);

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('keeps the form visible after a failed submission', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

    const { container } = render(<Form {...baseProps} />);

    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Client-side validation
// ---------------------------------------------------------------------------

describe('Form — client-side validation', () => {
  it('blocks submit and shows error when a required text field is empty', () => {
    render(
      <Form
        {...baseProps}
        fields={[{ name: 'email', type: 'email', label: 'Email', required: true }]}
      />
    );

    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/"Email" is required\./)).toBeInTheDocument();
  });

  it('does not block submit when all required fields are filled', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    render(
      <Form
        {...baseProps}
        fields={[{ name: 'name', type: 'text', label: 'Name', required: true }]}
        success_message="Done!"
      />
    );

    // Use getByRole since aria-hidden * in the label affects getByLabelText resolution
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alice' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledOnce();
      expect(screen.getByText('Done!')).toBeInTheDocument();
    });
  });

  it('uses field name in error when label is omitted', () => {
    render(<Form {...baseProps} fields={[{ name: 'phone', type: 'text', required: true }]} />);

    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form')!);

    expect(screen.getByText(/"phone" is required\./)).toBeInTheDocument();
  });
});
