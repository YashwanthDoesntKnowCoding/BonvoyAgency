import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/client';
import BookingPage from './BookingPage';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));

const samplePackage = {
  package_id: 1,
  title: 'Sample Karnataka Escape',
  destination_name: 'Mysuru',
  base_price: 10000,
  route_distance_km: 140,
  departures: [{ start_date: '2027-01-01', available_seats: 4 }],
  inclusions: 'AC coach, 1 night stay and breakfast.',
  exclusions: 'Meals not listed.',
  map_url: 'https://maps.google.com/',
  transport_options: [
    { id: 'coach', label: 'AC coach', description: 'Included in the package price', price_adjustment: 0 },
    { id: 'train', label: 'Train + local transfer', description: 'Estimated per-person upgrade', price_adjustment: 1000 },
    { id: 'own_transport', label: 'Own transport', description: 'Coach portion credited back', price_adjustment: -900 },
  ],
};

function renderBookingPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><BookingPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BookingPage transportation estimates', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({ data: { data: { items: [samplePackage] } } });
  });

  it('updates the per-person transport adjustment and total', async () => {
    renderBookingPage();

    await screen.findByText('₹21,000');
    fireEvent.click(screen.getByRole('radio', { name: /Train \+ local transfer/ }));

    await waitFor(() => expect(screen.getByText('₹23,100')).toBeInTheDocument());
    expect(screen.getByText('Train + local transfer', { selector: 'p' })).toBeInTheDocument();
  });

  it('credits the included coach portion when travellers arrange their own transport', async () => {
    renderBookingPage();

    await screen.findByText('₹21,000');
    fireEvent.click(screen.getByRole('radio', { name: /Own transport/ }));

    await waitFor(() => expect(screen.getByText('₹19,110')).toBeInTheDocument());
    expect(screen.getByText(/1 night stay and breakfast/)).toBeInTheDocument();
  });
});
