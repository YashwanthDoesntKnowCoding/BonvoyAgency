import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bookings', user?.user_id],
    queryFn: async () => {
      const response = await api.get('/bookings');
      return response.data.data;
    },
  });

  if (isLoading) return <div className="container section-pad">Loading your trips...</div>;
  if (isError) {
    return (
      <div className="container section-pad">
        <div className="error-panel" role="alert">
          <h2>We couldn’t load your trips</h2>
          <p>{error.response?.data?.error?.message || error.message || 'Check your connection and try again.'}</p>
          <button type="button" className="primary-btn" onClick={() => refetch()}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-pad">
      <div className="section-head trips-heading">
        <div>
          <p className="eyebrow">Your travel journal</p>
          <h1>My trips</h1>
          <p className="muted-copy">Trips you book will appear here. This demo saves bookings without processing payment or reserving seats.</p>
        </div>
        <Link to="/packages" className="secondary-btn">Find your next trip</Link>
      </div>

      {data?.length ? (
        <div className="trip-list">
          {data.map((booking) => (
            <article className="my-trip-card" key={booking.bookingId}>
              <div className="trip-card-top">
                <span className="status-badge saved">Saved trip</span>
                <span className="trip-reference">{booking.bookingId}</span>
              </div>
              <div className="trip-card-main">
                <div>
                  <p className="eyebrow">{booking.destinationName}, {booking.destinationState}</p>
                  <h2>{booking.packageTitle}</h2>
                  <p className="muted-copy">{booking.startDate} – {booking.endDate} · {booking.numTravellers} traveller(s) · {booking.transportLabel}</p>
                </div>
                <div className="trip-total">
                  <span>Estimated total</span>
                  <strong>₹{Number(booking.totalAmount).toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <div className="trip-card-bottom">
                <span>No payment processed · No seats reserved</span>
                <Link to={`/packages/${booking.packageSlug}`}>View trip details →</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-panel trip-empty">
          <span className="empty-icon" aria-hidden="true">✦</span>
          <h2>Your next story starts here</h2>
          <p>Choose a trip and confirm it to see it in this list. No payment is needed in this demo.</p>
          <Link to="/packages" className="primary-btn">Explore trips</Link>
        </div>
      )}
    </div>
  );
}
