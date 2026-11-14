import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';
import WishlistButton from '../components/WishlistButton';

export default function PackagesPage() {
  const [selectedState, setSelectedState] = useState('All');
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await api.get('/packages');
      return response.data.data.items;
    },
  });

  if (isLoading) return <div className="container section-pad">Loading packages...</div>;
  if (isError) {
    return (
      <div className="container section-pad">
        <div className="error-panel" role="alert">
          <h2>We couldn’t load the tours</h2>
          <p>{error.message || 'Check that the API server is running, then try again.'}</p>
          <button type="button" className="primary-btn" onClick={() => refetch()}>Try again</button>
        </div>
      </div>
    );
  }

  const states = ['All', 'Karnataka', 'Kerala', 'Tamil Nadu'];
  const visiblePackages = (data || []).filter((pkg) => (
    selectedState === 'All' || pkg.destination?.state === selectedState
  ));

  return (
    <div className="container section-pad">
      <div className="section-head">
        <p className="eyebrow">Explore South India</p>
        <h1>Find your kind of escape</h1>
        <p className="muted-copy">Browse Karnataka, Kerala and Tamil Nadu. Road distances are approximate from Bengaluru; prices are demo estimates per person.</p>
      </div>
      <div className="state-filters" role="group" aria-label="Filter trips by state">
        {states.map((state) => (
          <button
            type="button"
            className={`state-filter${selectedState === state ? ' active' : ''}`}
            aria-pressed={selectedState === state}
            key={state}
            onClick={() => setSelectedState(state)}
          >
            {state === 'All' ? 'All trips' : state}
          </button>
        ))}
        <span className="filter-count" aria-live="polite">{visiblePackages.length} trips</span>
      </div>
      <div className="card-grid">
        {visiblePackages.map((pkg) => (
          <article className="package-card" key={pkg.package_id}>
            <Link to={`/packages/${pkg.slug}`} className="package-card-link">
              <img src={pkg.image_url} alt={pkg.destination_name ? `${pkg.destination_name}, ${pkg.destination?.state}` : pkg.title} loading="lazy" />
              <div className="package-copy">
                <span className="pill">{pkg.destination?.state} · {pkg.category}</span>
                <h3>{pkg.title}</h3>
                <p>{pkg.description}</p>
                <div className="trip-facts">
                  <span>{pkg.route_distance_km} km from Bengaluru</span>
                  <span>{pkg.duration_days} days</span>
                </div>
                <div className="meta-row">
                  <strong>From ₹{Number(pkg.base_price).toLocaleString('en-IN')}</strong>
                  <span>{pkg.departures?.[0]?.available_seats ?? 0} seats</span>
                </div>
              </div>
            </Link>
            <div className="package-card-actions">
              <Link to={`/packages/${pkg.slug}`} className="text-link">Explore details</Link>
              <WishlistButton packageId={pkg.package_id} packageTitle={pkg.title} />
            </div>
            <p className="image-credit">
              Photo by <a href={pkg.image_source_url} target="_blank" rel="noreferrer">{pkg.image_credit}</a>
              {' · '}<a href={pkg.image_license_url} target="_blank" rel="noreferrer">{pkg.image_license}</a>
            </p>
          </article>
        ))}
        {!visiblePackages.length && (
          <div className="empty-panel">
            <h3>No tours found</h3>
            <p>There are no tours in this state right now. Try another state or browse all trips.</p>
          </div>
        )}
      </div>
    </div>
  );
}
