import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function BookingPage() {
  const [travellers, setTravellers] = useState(2);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedTransportId, setSelectedTransportId] = useState('coach');
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await api.get('/packages');
      return response.data.data.items;
    },
  });
  const packages = data || [];
  const packageId = selectedPackageId ?? location.state?.packageId ?? packages[0]?.package_id;
  const selectedPackage = packages.find((pkg) => pkg.package_id === Number(packageId)) || packages[0];
  const transportOptions = selectedPackage?.transport_options || [];
  const selectedTransport = transportOptions.find((option) => option.id === selectedTransportId) || transportOptions[0];
  const baseSubtotal = selectedPackage ? Number(selectedPackage.base_price) * travellers : 0;
  const transportSubtotal = selectedTransport ? selectedTransport.price_adjustment * travellers : 0;
  const subtotal = Math.max(0, baseSubtotal + transportSubtotal);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const includedServices = !selectedPackage
    ? ''
    : selectedTransport?.id === 'own_transport'
      ? selectedPackage.inclusions.replace(/^AC coach(?: from Bengaluru)?,?\s*/i, '')
      : selectedPackage.inclusions;
  const bookingMutation = useMutation({
    mutationFn: async () => {
      const departure = selectedPackage.departures?.[0];
      if (!departure || !selectedTransport) throw new Error('This trip is missing a departure or transportation option.');
      const response = await api.post('/bookings', {
        packageId: selectedPackage.package_id,
        departureId: departure.departure_id,
        numTravellers: travellers,
        transportId: selectedTransport.id,
      });
      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Trip saved to My Trips. No payment was processed or seat reserved.');
      navigate('/my-bookings');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || error.message || 'Could not save your trip. Please try again.');
    },
  });

  if (isLoading) return <div className="container section-pad">Loading booking options...</div>;
  if (isError) {
    return (
      <div className="container section-pad">
        <div className="error-panel" role="alert">
          <h2>Booking options are unavailable</h2>
          <p>{error.message || 'Check that the API server is running, then try again.'}</p>
        </div>
      </div>
    );
  }
  if (!selectedPackage) return <div className="container section-pad">No tours are available to book right now.</div>;

  return (
    <div className="container section-pad">
      <div className="booking-grid">
        <section className="panel">
          <p className="eyebrow">Plan your South India escape</p>
          <h2>Book your trip</h2>
          <div className="form-grid">
            <label>
              Tour
              <select aria-label="Tour" value={selectedPackage.package_id} onChange={(event) => setSelectedPackageId(Number(event.target.value))}>
                {packages.map((pkg) => <option key={pkg.package_id} value={pkg.package_id}>{pkg.title}</option>)}
              </select>
            </label>
            <label>
              Travellers
              <input type="number" min="1" max="10" value={travellers} onChange={(e) => setTravellers(Math.min(10, Math.max(1, Number(e.target.value) || 1)))} />
            </label>
          </div>
          <fieldset className="transport-options">
            <legend>Choose your transportation</legend>
            <p className="price-note">Coach is included. Other per-person changes are estimates for this demo, not live fares.</p>
            {transportOptions.map((option) => (
              <label className={`transport-choice${selectedTransport?.id === option.id ? ' selected' : ''}`} key={option.id}>
                <input
                  type="radio"
                  name="transport"
                  value={option.id}
                  checked={selectedTransport?.id === option.id}
                  onChange={() => setSelectedTransportId(option.id)}
                />
                <span className="transport-copy">
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                <strong className="transport-price">
                  {option.price_adjustment > 0
                    ? `+₹${option.price_adjustment.toLocaleString('en-IN')} / person`
                    : option.price_adjustment < 0
                      ? `−₹${Math.abs(option.price_adjustment).toLocaleString('en-IN')} / person`
                      : 'Included'}
                </strong>
              </label>
            ))}
          </fieldset>
          <div className="booking-details">
            <p><strong>Destination:</strong> {selectedPackage.destination_name}, {selectedPackage.destination?.state || 'India'}</p>
            <p><strong>Route:</strong> Bengaluru to {selectedPackage.destination_name} · approximately {selectedPackage.route_distance_km} km</p>
            <p><strong>Departure:</strong> {selectedPackage.departures?.[0]?.start_date} · {selectedPackage.departures?.[0]?.available_seats} seats available</p>
            <p><strong>Transportation:</strong> {selectedTransport?.label}</p>
            <p><strong>Included:</strong> {includedServices}</p>
            <p><strong>Not included:</strong> {selectedPackage.exclusions}</p>
            <a href={selectedPackage.map_url} target="_blank" rel="noreferrer">View route in Google Maps</a>
          </div>
        </section>

        <aside className="panel summary-panel">
          <h3>Price summary</h3>
          <p>{selectedPackage.title}</p>
          <div className="summary-row"><span>Package × {travellers} traveller(s)</span><strong>₹{baseSubtotal.toLocaleString('en-IN')}</strong></div>
          <div className="summary-row"><span>{selectedTransport?.label} adjustment</span><strong>{transportSubtotal < 0 ? '−' : '+'}₹{Math.abs(transportSubtotal).toLocaleString('en-IN')}</strong></div>
          <div className="summary-row"><span>Estimated subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div>
          <div className="summary-row"><span>Estimated tax</span><strong>₹{tax.toLocaleString('en-IN')}</strong></div>
          <div className="summary-row"><span>Estimated total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div>
          <p className="price-note">Indicative twin-sharing prices only. Saving adds this trip to My Trips; it does not process payment or reserve seats.</p>
          <button type="button" className="primary-btn block-btn" disabled={bookingMutation.isPending} onClick={() => bookingMutation.mutate()}>
            {bookingMutation.isPending ? 'Saving trip…' : 'Save trip to My Trips'}
          </button>
        </aside>
      </div>
    </div>
  );
}
