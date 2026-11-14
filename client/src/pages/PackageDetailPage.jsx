import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import WishlistButton from '../components/WishlistButton';

const tourismPages = {
  Mysuru: 'https://karnatakatourism.org/en/destinations/mysuru/',
  'Coorg (Kodagu)': 'https://karnatakatourism.org/en/destinations/coorg/',
  Hampi: 'https://karnatakatourism.org/en/destinations/hampi/',
  Gokarna: 'https://karnatakatourism.org/en/destinations/gokarna/',
  Udupi: 'https://karnatakatourism.org/en/destinations/udupi/',
  Srirangapatna: 'https://karnatakatourism.org/en/destinations/srirangapatna/',
};
const tourismSources = {
  Karnataka: 'https://karnatakatourism.org/',
  Kerala: 'https://www.keralatourism.org/',
  'Tamil Nadu': 'https://www.tamilnadutourism.tn.gov.in/',
};

export default function PackageDetailPage() {
  const { slug } = useParams();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['package', slug],
    queryFn: async () => {
      const response = await api.get(`/packages/${slug}`);
      return response.data.data;
    },
  });

  useEffect(() => setActivePhotoIndex(0), [slug]);

  if (isLoading) return <div className="container section-pad">Loading package details...</div>;
  if (isError) {
    return (
      <div className="container section-pad">
        <div className="error-panel" role="alert">
          <h2>We couldn’t load this tour</h2>
          <p>{error.message || 'Check your connection to the API server, then try again.'}</p>
          <button type="button" className="primary-btn" onClick={() => refetch()}>Try again</button>
        </div>
      </div>
    );
  }
  if (!data) return <div className="container section-pad">Package not found.</div>;
  const destinationState = data.destination?.state || 'Karnataka';
  const tourismSourceUrl = tourismPages[data.destination_name] || tourismSources[destinationState];
  const tourismSourceName = destinationState === 'Tamil Nadu' ? 'Tamil Nadu Tourism' : `${destinationState} Tourism`;
  const photos = [
    {
      image_url: data.image_url,
      image_source_url: data.image_source_url,
      image_credit: data.image_credit,
      image_license: data.image_license,
      image_license_url: data.image_license_url,
      caption: `${data.destination_name} destination view`,
    },
    ...(data.destination?.gallery || []),
  ];
  const activePhoto = photos[activePhotoIndex] || photos[0];

  return (
    <div className="container section-pad">
      <div className="detail-layout">
        <div>
          <div className="destination-gallery">
            <figure className="gallery-feature">
              <img className="detail-image" src={activePhoto.image_url} alt={`${activePhoto.caption}, ${destinationState}`} />
              <figcaption>{activePhoto.caption}</figcaption>
            </figure>
            {photos.length > 1 && (
              <div className="gallery-thumbnails" role="group" aria-label={`${data.destination_name} photo gallery`}>
                {photos.map((photo, index) => (
                  <button
                    className={`gallery-thumbnail${activePhotoIndex === index ? ' active' : ''}`}
                    type="button"
                    key={photo.image_source_url}
                    aria-label={`Show photo ${index + 1}: ${photo.caption}`}
                    aria-pressed={activePhotoIndex === index}
                    onClick={() => setActivePhotoIndex(index)}
                  >
                    <img src={photo.image_url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="image-credit">
            Photo by <a href={activePhoto.image_source_url} target="_blank" rel="noreferrer">{activePhoto.image_credit}</a>
            {' · '}<a href={activePhoto.image_license_url} target="_blank" rel="noreferrer">{activePhoto.image_license}</a>
          </p>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
          <p className="route-note">
            About <strong>{data.route_distance_km} km</strong> by road from Bengaluru. Check the live route on{' '}
            <a href={data.map_url} target="_blank" rel="noreferrer">Google Maps</a>.
            {' '}Destination information: <a href={tourismSourceUrl} target="_blank" rel="noreferrer">{tourismSourceName}</a>.
          </p>
          <section className="destination-story">
            <h2>Get to know {data.destination_name}</h2>
            <p>{data.destination?.long_description || data.description}</p>
            <h3>Little moments to look forward to</h3>
            <div className="highlight-list">
              {data.destination?.highlights?.map((highlight) => <span className="highlight-pill" key={highlight}>{highlight}</span>)}
            </div>
            {data.destination?.local_tip && (
              <details className="local-tip">
                <summary>A local-style tip</summary>
                <p>{data.destination.local_tip}</p>
              </details>
            )}
          </section>
          <h2>What’s included</h2>
          <p>{data.inclusions}</p>
          <h3>Not included</h3>
          <p>{data.exclusions}</p>
          <ul className="bullet-list">
            {data.itinerary?.map((day) => (
              <li key={day.day_number}>
                <strong>Day {day.day_number}: {day.title}</strong>
                <p>{day.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <aside className="booking-summary">
          <h3>Quick facts</h3>
          <p><strong>Duration:</strong> {data.duration_days} days</p>
          <p><strong>Route:</strong> Bengaluru to {data.destination_name}, {destinationState} ({data.route_distance_km} km approx.)</p>
          <p><strong>Best season:</strong> {data.best_season}</p>
          <p><strong>Category:</strong> {data.category}</p>
          <p><strong>From:</strong> ₹{Number(data.base_price).toLocaleString('en-IN')} / person</p>
          <p><strong>Next departure:</strong> {data.departures?.[0]?.start_date}</p>
          <p><strong>Seats available:</strong> {data.departures?.[0]?.available_seats}</p>
          <p className="price-note">{data.price_note}</p>
          <div className="detail-actions">
            <Link to="/booking" state={{ packageId: data.package_id }} className="primary-btn block-btn">Book this trip</Link>
            <WishlistButton packageId={data.package_id} packageTitle={data.title} />
          </div>
        </aside>
      </div>
    </div>
  );
}
