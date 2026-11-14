import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/client';
import { AuthProvider, useAuth } from '../context/AuthContext';
import WishlistButton from './WishlistButton';

const mocks = vi.hoisted(() => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn() }));

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('react-hot-toast', () => ({
  default: Object.assign(mocks.toast, { success: mocks.success, error: mocks.error }),
}));

function SignedInWishlistButton() {
  const { user, login } = useAuth();
  useEffect(() => {
    if (!user) login({ user: { user_id: 8 }, token: 'test-token' });
  }, [user, login]);
  return (
    <>
      <span>{user ? 'Signed in' : 'Signing in'}</span>
      <WishlistButton packageId={5} packageTitle="Munnar Escape" />
    </>
  );
}

function renderWishlistButton() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter><SignedInWishlistButton /></MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('WishlistButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.get.mockResolvedValue({ data: { data: [] } });
    api.post.mockResolvedValue({ data: { data: { packageId: 5 } } });
  });

  it('adds the selected trip to the signed-in user wishlist', async () => {
    renderWishlistButton();

    await screen.findByText('Signed in');
    const button = await screen.findByRole('button', { name: 'Add Munnar Escape to wishlist' });
    fireEvent.click(button);

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/wishlist', { packageId: 5 }));
    expect(mocks.success).toHaveBeenCalledWith('Trip saved to your wishlist.');
  });
});
