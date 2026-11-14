import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';
import WishlistButton from '../components/WishlistButton';

const heroPackages = [
  { title: 'Mysuru Royal Heritage Weekend', slug: 'mysuru-royal-heritage', description: 'Explore Mysuru Palace, Chamundi Hills and the city’s markets.', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Mysore_Palace_%281%29.jpg/1280px-Mysore_Palace_%281%29.jpg', image_source_url: 'https://commons.wikimedia.org/wiki/File:Mysore_Palace_(1).jpg', image_credit: 'Hari R', image_license: 'CC BY 2.0', image_license_url: 'https://creativecommons.org/licenses/by/2.0/' },
  { title: 'Coorg Coffee Country Escape', slug: 'coorg-coffee-country', description: 'Spend three days among coffee estates, Abbey Falls and misty hills.', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Coffee_Coconuts_Pepper_Estate_Coorg_Feb24_A7C_09365.jpg/1280px-Coffee_Coconuts_Pepper_Estate_Coorg_Feb24_A7C_09365.jpg', image_source_url: 'https://commons.wikimedia.org/wiki/File:Coffee_Coconuts_Pepper_Estate_Coorg_Feb24_A7C_09365.jpg', image_credit: 'Timothy A. Gonsalves', image_license: 'CC BY-SA 4.0', image_license_url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  { title: 'Hampi Vijayanagara Explorer', slug: 'hampi-vijayanagara-explorer', description: 'Discover the Stone Chariot, temples and boulder-strewn Hampi.', image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Stone_Chariot%2C_Hampi_3.jpg', image_source_url: 'https://commons.wikimedia.org/wiki/File:Stone_Chariot,_Hampi_3.jpg', image_credit: 'Prabhachatterji', image_license: 'Public domain', image_license_url: 'https://commons.wikimedia.org/wiki/File:Stone_Chariot,_Hampi_3.jpg' },
  { title: 'Gokarna Coast and Temple Trail', slug: 'gokarna-coast-temple-trail', description: 'Pair the Mahabaleshwar Temple with Kudle and Om Beach.', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Strawberry_Farms%2C_Kudle_Beach%2C_Gokarna_01.jpg/1280px-Strawberry_Farms%2C_Kudle_Beach%2C_Gokarna_01.jpg', image_source_url: 'https://commons.wikimedia.org/wiki/File:Strawberry_Farms,_Kudle_Beach,_Gokarna_01.jpg', image_credit: 'Devender Goyal', image_license: 'CC BY-SA 4.0', image_license_url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  { title: 'Chikkamagaluru Coffee and Peaks', slug: 'chikkamagaluru-coffee-peaks', description: 'Visit Mullayanagiri viewpoints and a coffee estate.', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Mullayanagiri%2C_Chikmagalur_district_of_Karnataka.jpg/1280px-Mullayanagiri%2C_Chikmagalur_district_of_Karnataka.jpg', image_source_url: 'https://commons.wikimedia.org/wiki/File:Mullayanagiri,_Chikmagalur_district_of_Karnataka.jpg', image_credit: 'RakeshRaju M', image_license: 'CC BY-SA 4.0', image_license_url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
];

export default function HomePage() {
  const { data } = useQuery({
    queryKey: ['featuredPackages'],
    queryFn: async () => {
      const response = await api.get('/packages/featured');
      return response.data.data;
    },
  });

  const [activeSlide, setActiveSlide] = useState(0);
  const slides = data?.length ? data : heroPackages;
  const currentSlide = slides[activeSlide % slides.length];
  const packages = data?.length ? data.slice(0, 6) : heroPackages.slice(0, 3);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="page-shell">
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Where to next?</p>
            <h1>Pack your bags, we’ll handle the rest.</h1>
            <p>Curated stays, seamless bookings, and adventures designed for your pace.</p>
            <div className="cta-row">
              <Link to="/packages" className="primary-btn">Explore packages</Link>
              <Link to="/booking" className="secondary-btn">Book now</Link>
            </div>
          </div>
          <div className="hero-card" aria-roledescription="carousel" aria-label="South India destinations">
            <Link to={`/packages/${currentSlide.slug}`} className="hero-slide" key={currentSlide.slug}>
              <img src={currentSlide.image_url || currentSlide.image} alt={currentSlide.title} />
              <span className="hero-slide-caption">{currentSlide.title}</span>
            </Link>
            <div className="hero-controls">
              <button
                type="button"
                className="carousel-arrow"
                aria-label="Previous destination"
                onClick={() => setActiveSlide((current) => (current - 1 + slides.length) % slides.length)}
              >
                ‹
              </button>
              <div className="carousel-dots" aria-label="Choose a destination">
                {slides.map((slide, index) => (
                  <button
                    type="button"
                    className={`carousel-dot${index === activeSlide ? ' active' : ''}`}
                    key={slide.slug || slide.title}
                    aria-label={`Show ${slide.title}`}
                    aria-current={index === activeSlide ? 'true' : undefined}
                    onClick={() => setActiveSlide(index)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="carousel-arrow"
                aria-label="Next destination"
                onClick={() => setActiveSlide((current) => (current + 1) % slides.length)}
              >
                ›
              </button>
            </div>
            <p className="image-credit hero-credit">
              Photo by <a href={currentSlide.image_source_url} target="_blank" rel="noreferrer">{currentSlide.image_credit}</a>
              {' · '}<a href={currentSlide.image_license_url} target="_blank" rel="noreferrer">{currentSlide.image_license}</a>
            </p>
          </div>
        </div>
      </section>

      <section className="container section-pad">
        <div className="section-head">
          <p className="eyebrow">Karnataka · Kerala · Tamil Nadu</p>
          <h2>Featured escapes</h2>
        </div>
        <div className="card-grid">
          {packages.map((pkg) => (
            <article className="package-card" key={pkg.slug || pkg.title}>
              <Link to={`/packages/${pkg.slug}`} className="package-card-link">
                <img src={pkg.image_url || pkg.image} alt={pkg.destination_name ? `${pkg.destination_name}, ${pkg.destination?.state || ''}` : pkg.title} loading="lazy" />
                <div className="package-copy">
                  <h3>{pkg.title}</h3>
                  <p>{pkg.description || 'Adventure curated for your vacation.'}</p>
                  {pkg.route_distance_km && <div className="trip-facts"><span>{pkg.route_distance_km} km from Bengaluru</span></div>}
                </div>
              </Link>
              {pkg.image_source_url && (
                <p className="image-credit">
                  Photo by <a href={pkg.image_source_url} target="_blank" rel="noreferrer">{pkg.image_credit}</a>
                  {' · '}<a href={pkg.image_license_url} target="_blank" rel="noreferrer">{pkg.image_license}</a>
                </p>
              )}
              {pkg.package_id && (
                <div className="package-card-actions">
                  <Link to={`/packages/${pkg.slug}`} className="text-link">Explore details</Link>
                  <WishlistButton packageId={pkg.package_id} packageTitle={pkg.title} />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="container section-pad">
        <div className="section-head">
          <h2>How it works</h2>
        </div>
        <div className="steps-grid">
          <div className="info-card"><strong>1.</strong> Discover your dream getaway.</div>
          <div className="info-card"><strong>2.</strong> Choose your dates, hotel and transport.</div>
          <div className="info-card"><strong>3.</strong> Confirm and travel with zero stress.</div>
        </div>
      </section>
    </div>
  );
}
