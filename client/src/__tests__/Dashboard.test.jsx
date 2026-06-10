import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import DashboardPage from '../pages/DashboardPage';
import { AuthContext } from '../contexts/AuthContext';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '../api';

const mockUser = { id: 1, name: 'Alice Chen', email: 'alice@example.com' };

function renderDashboard() {
  return render(
    <AuthContext.Provider value={{ user: mockUser, login: vi.fn(), logout: vi.fn() }}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({
      data: {
        owned: [
          { id: 1, title: 'My Doc', updated_at: '2026-01-01T00:00:00', owner_id: 1, owner_name: 'Alice Chen' },
        ],
        shared: [
          { id: 2, title: 'Shared Doc', updated_at: '2026-01-02T00:00:00', owner_id: 2, owner_name: 'Bob Smith' },
        ],
      },
    });
  });

  it('renders My Documents and Shared with me sections', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('My Documents')).toBeInTheDocument();
      expect(screen.getByText('Shared with me')).toBeInTheDocument();
    });
  });

  it('displays owned and shared document titles', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('My Doc')).toBeInTheDocument();
      expect(screen.getByText('Shared Doc')).toBeInTheDocument();
    });
  });

  it('shows the user name in the header', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no owned documents', async () => {
    api.get.mockResolvedValueOnce({ data: { owned: [], shared: [] } });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/No documents yet/i)).toBeInTheDocument();
    });
  });

  it('shows file upload hint text', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Supports .txt, .md, .docx/i)).toBeInTheDocument();
    });
  });
});
