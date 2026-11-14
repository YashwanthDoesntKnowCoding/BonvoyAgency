import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';

const mocks = vi.hoisted(() => ({ login: vi.fn(), success: vi.fn() }));

vi.mock('../api/client', () => ({ default: { post: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: mocks.success } }));

describe('LoginPage registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mocks.login });
    api.post.mockResolvedValue({
      data: { data: { user: { full_name: 'Test Traveller' }, accessToken: 'api-token' } },
    });
  });

  it('registers with the API and stores the returned session', async () => {
    render(<MemoryRouter><LoginPage initialMode="register" /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Traveller' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'traveller@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+91 9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', {
      full_name: 'Test Traveller',
      email: 'traveller@example.com',
      password: 'Password123!',
      phone: '+91 9876543210',
    }));
    expect(mocks.login).toHaveBeenCalledWith({
      user: { full_name: 'Test Traveller' },
      token: 'api-token',
    });
  });
});
