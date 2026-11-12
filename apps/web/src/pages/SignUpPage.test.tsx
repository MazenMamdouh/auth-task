import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { authApi } from '@/lib/api';
import SignUpPage from './SignUpPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SignUpPage', () => {
  it('shows field errors and does not call the API for invalid input', async () => {
    const spy = vi.spyOn(authApi, 'signUp');
    renderPage();
    await userEvent.type(screen.getByLabelText('Email'), 'nope');
    await userEvent.type(screen.getByLabelText('Name'), 'Jo');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('ticks password rules as they are met', async () => {
    renderPage();
    const rule = () => screen.getByText('At least one number').closest('li');
    expect(rule()).toHaveAttribute('data-met', 'false');
    await userEvent.type(screen.getByLabelText('Password'), 'abc1');
    expect(rule()).toHaveAttribute('data-met', 'true');
  });

  it('submits valid input and shows a server error', async () => {
    const spy = vi.spyOn(authApi, 'signUp').mockRejectedValue(new Error('boom'));
    renderPage();
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Password'), 'Str0ng!pass');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy.mock.calls[0][0]).toEqual({ email: 'jane@example.com', name: 'Jane Doe', password: 'Str0ng!pass' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  });
});
