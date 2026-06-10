import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from '../pages/LoginPage';
import { AuthContext } from '../contexts/AuthContext';

const mockLogin = vi.fn();

function renderLoginPage(loginImpl = mockLogin) {
  return render(
    <AuthContext.Provider value={{ user: null, login: loginImpl, logout: vi.fn() }}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => mockLogin.mockReset());

  it('renders email, password fields and sign in button', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders test account quick-fill chips', () => {
    renderLoginPage();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('fills email when a chip is clicked', () => {
    renderLoginPage();
    fireEvent.click(screen.getByText('alice@example.com'));
    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com');
  });

  it('calls login with the entered credentials on submit', async () => {
    mockLogin.mockResolvedValueOnce({ id: 1, email: 'alice@example.com' });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('alice@example.com', 'password123')
    );
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: 'Invalid email or password' } },
    });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password')
    );
  });
});
