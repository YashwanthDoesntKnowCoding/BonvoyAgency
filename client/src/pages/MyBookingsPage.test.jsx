import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/client';
import MyBookingsPage from './MyBookingsPage';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { user_id: 8 } }) }));

describe('MyBookingsPage', () => {
  it('shows trips saved by the booking API', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{
          bookingId: 'BV-2026-00001',
          packageTitle: 'Munnar Tea Hills and Waterfalls',
          packageSlug: 'munnar-tea-hills-waterfalls',
          destinationName: 'Munnar',
          destinationState: 'Kerala',
          startDate: '2027-03-05',
          endDate: '2027-03-07',
          numTravellers: 2,
          transportLabel: 'AC coach',
          totalAmount: 37800,
        }],
      },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><MyBookingsPage /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Munnar Tea Hills and Waterfalls')).toBeInTheDocument();
    expect(screen.getByText(/Munnar\s*,\s*Kerala/)).toBeInTheDocument();
    expect(screen.getByText(/No payment processed/)).toBeInTheDocument();
  });
});
