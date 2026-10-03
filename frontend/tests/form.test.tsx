import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityForm, ExternalLink } from '../src/components/ui';
import { ApiError } from '../src/api/client';
afterEach(cleanup);
describe('accessible contract-driven forms', () => {
  it('blocks invalid input, focuses its field, and sends typed values when corrected', async () => {
    const submit = vi.fn(async () => {});
    const user = userEvent.setup();
    render(
      <EntityForm
        fields={[
          { name: 'title', label: 'Title', required: true },
          { name: 'score', label: 'Score', type: 'number', required: true, min: 0, max: 100 },
        ]}
        submit={submit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Title/)).toHaveFocus();
    await user.type(screen.getByLabelText(/Title/), '  A goal  ');
    await user.type(screen.getByLabelText(/Score/), '101');
    await user.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a whole number from 0 to 100.')).toBeVisible();
    await user.clear(screen.getByLabelText(/Score/));
    await user.type(screen.getByLabelText(/Score/), '75');
    await user.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(submit).toHaveBeenCalledWith({ title: 'A goal', score: 75 });
  });
  it('renders backend field errors inline', async () => {
    render(
      <EntityForm
        fields={[{ name: 'email', label: 'Email', type: 'email', default: 'a@example.com' }]}
        submit={async () => {
          throw new ApiError(422, 'Check email', { email: 'Already registered' });
        }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(await screen.findByText('Already registered')).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
  it('rejects executable resource links and protects external navigation', () => {
    const { rerender } = render(<ExternalLink url="javascript:alert(1)">Unsafe</ExternalLink>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    rerender(<ExternalLink url="https://example.com">Resource</ExternalLink>);
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });
  it('validates matching registration passwords', async () => {
    const submit = vi.fn(async () => {});
    render(
      <EntityForm
        fields={[
          { name: 'password', label: 'Password', type: 'password', min: 8, required: true },
          { name: 'confirm_password', label: 'Confirm password', type: 'password', required: true },
        ]}
        submit={submit}
      />,
    );
    await userEvent.type(screen.getByLabelText(/^Password/), 'Password123');
    await userEvent.type(screen.getByLabelText(/^Confirm password/), 'Different123');
    await userEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(screen.getByText('Passwords do not match.')).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });
});
