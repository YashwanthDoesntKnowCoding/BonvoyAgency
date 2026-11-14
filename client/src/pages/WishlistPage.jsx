import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import WishlistButton from '../components/WishlistButton';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function WishlistPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['wishlist', user?.user_id],
    queryFn: async () => {
      const response = await api.get('/wishlist');
      return response.data.data;
    },
  });

  if (isLoading) return <div className="container section-pad">Loading your wishlist...</div>;
  if (isError) {
    return (
      <div className="container section-pad">
        <div className="error-panel" role="alert">
          <h2>We couldn’t load your wishlist</h2>
          <p>{error.response?.data?.error?.message || error.message || 'Check your connection and try again.'}</p>
          <button type="button" className="primary-btn" onClick={() => refetch()}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-pad">
      <div className="section-head">
        <p className="eyebrow">Saved for later</p>
        <h1>Your wishlist</h1>
        <p className="muted-copy">Keep the trips you love in one place. Save or remove a trip whenever you like.</p>
      </div>

      {data?.length ? (
        <div className="card-grid">
          {data.map((item) => (
            <article className="package-card wishlist-card" key={item.packageId}>
              <Link to={`/packages/${item.slug}`} className="package-card-link">
                <img src={item.image_url} alt={`${item.destination_name}, ${item.destinationState}`} loading="lazy" />
                <div className="package-copy">
                  <span className="pill">{item.destinationState}</span>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                  <div className="meta-row">
                    <strong>From ₹{Number(item.base_price).toLocaleString('en-IN')}</strong>
                    <span>{item.duration_days} days</span>
                  </div>
                </div>
              </Link>
              <div className="wishlist-card-actions">
                <Link to={`/packages/${item.slug}`} className="text-link">View trip</Link>
                <WishlistButton packageId={item.packageId} packageTitle={item.title} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-panel wishlist-empty">
          <span className="empty-icon" aria-hidden="true">♡</span>
          <h2>Your wishlist is ready for inspiration</h2>
          <p>Explore the trips and save the ones you want to come back to.</p>
          <Link to="/packages" className="primary-btn">Explore South India</Link>
        </div>
      )}
    </div>
  );
}
