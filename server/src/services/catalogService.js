const db = require('../config/db');

function decodeJson(value, fallback) {
  if (value == null) return fallback;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function mapDestination(row) {
  if (!row) return row;
  return {
    ...row,
    highlights: decodeJson(row.highlights, []),
    gallery: decodeJson(row.gallery, []),
  };
}

function getTransportOptions(pkg) {
  const distance = Number(pkg.route_distance_km);
  return [
    { id: 'coach', label: 'AC coach', description: 'Included in the package price', price_adjustment: 0 },
    { id: 'train', label: 'Train + local transfer', description: 'Estimated per-person upgrade', price_adjustment: Math.round(distance * 1.2 + 300) },
    { id: 'shared_cab', label: 'Shared private cab', description: 'Estimated per-person upgrade', price_adjustment: Math.round(distance * 5 + 500) },
    { id: 'own_transport', label: 'Own transport', description: 'Coach portion credited back', price_adjustment: -900 },
  ];
}

async function enrichPackages(rows) {
  if (!rows.length) return [];
  const ids = rows.map((pkg) => pkg.package_id);
  const marks = ids.map(() => '?').join(', ');
  const [departureRows] = await db.execute(
    `SELECT * FROM departures WHERE package_id IN (${marks}) ORDER BY start_date`,
    ids,
  );
  const [itineraryRows] = await db.execute(
    `SELECT * FROM package_itinerary WHERE package_id IN (${marks}) ORDER BY day_number`,
    ids,
  );
  const [reviewRows] = await db.execute(
    `SELECT review_id, user_id, package_id, rating, title, comment, created_at FROM reviews WHERE package_id IN (${marks}) ORDER BY review_id`,
    ids,
  );
  const departuresByPackage = new Map();
  const itineraryByPackage = new Map();
  const reviewsByPackage = new Map();
  for (const row of departureRows) {
    const list = departuresByPackage.get(row.package_id) || [];
    list.push(row);
    departuresByPackage.set(row.package_id, list);
  }
  for (const row of itineraryRows) {
    const list = itineraryByPackage.get(row.package_id) || [];
    list.push(row);
    itineraryByPackage.set(row.package_id, list);
  }
  for (const row of reviewRows) {
    const list = reviewsByPackage.get(row.package_id) || [];
    list.push(row);
    reviewsByPackage.set(row.package_id, list);
  }

  return rows.map((pkg) => {
    const reviews = reviewsByPackage.get(pkg.package_id) || [];
    const destination = mapDestination({
      destination_id: pkg.destination_id,
      name: pkg.destination_name,
      country: pkg.country,
      state: pkg.state,
      region: pkg.region,
      description: pkg.destination_description,
      best_season: pkg.destination_best_season,
      latitude: pkg.latitude,
      longitude: pkg.longitude,
      image_url: pkg.destination_image_url,
      image_source_url: pkg.destination_image_source_url,
      image_credit: pkg.destination_image_credit,
      image_license: pkg.destination_image_license,
      image_license_url: pkg.destination_image_license_url,
      long_description: pkg.long_description,
      local_tip: pkg.local_tip,
      highlights: pkg.highlights,
      gallery: pkg.gallery,
    });
    const ratingTotal = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    return {
      ...pkg,
      destination,
      itinerary: itineraryByPackage.get(pkg.package_id) || [],
      departures: departuresByPackage.get(pkg.package_id) || [],
      reviews,
      average_rating: reviews.length ? ratingTotal / reviews.length : 0,
      review_count: reviews.length,
      transport_options: getTransportOptions(pkg),
    };
  });
}

const packageSelect = `
  SELECT p.*, d.name AS destination_name, d.country, d.state, d.region,
    d.description AS destination_description, d.best_season AS destination_best_season,
    d.latitude, d.longitude, d.image_url AS destination_image_url,
    d.image_source_url AS destination_image_source_url,
    d.image_credit AS destination_image_credit, d.image_license AS destination_image_license,
    d.image_license_url AS destination_image_license_url, d.long_description,
    d.local_tip, d.highlights, d.gallery
  FROM packages p
  INNER JOIN destinations d ON d.destination_id = p.destination_id
  WHERE p.is_active = TRUE`;

async function getAllDestinations() {
  const [rows] = await db.execute('SELECT * FROM destinations ORDER BY destination_id');
  return rows.map(mapDestination);
}

async function getDestinationById(id) {
  const [rows] = await db.execute('SELECT * FROM destinations WHERE destination_id = ? LIMIT 1', [Number(id)]);
  return mapDestination(rows[0] || null);
}

async function getFeaturedPackages() {
  const rows = await getPackages();
  const regional = ['Kerala', 'Tamil Nadu']
    .map((state) => rows.find((pkg) => pkg.destination.state === state))
    .filter(Boolean);
  return [...rows.slice(0, 4), ...regional].map((pkg) => ({
    ...pkg,
    destination_name: pkg.destination.name,
  }));
}

async function getPackageBySlug(slug) {
  const [rows] = await db.execute(`${packageSelect} AND p.slug = ? LIMIT 1`, [slug]);
  return (await enrichPackages(rows))[0] || null;
}

async function getPackages(filters = {}) {
  const { q = '', category, destination, minPrice, maxPrice, sort = 'recommended' } = filters;
  const conditions = [];
  const params = [];
  if (q) {
    conditions.push('(p.title LIKE ? OR p.description LIKE ? OR d.name LIKE ? OR d.state LIKE ?)');
    const term = `%${q}%`;
    params.push(term, term, term, term);
  }
  if (category) {
    conditions.push('p.category = ?');
    params.push(category);
  }
  if (destination) {
    conditions.push('p.destination_id = ?');
    params.push(Number(destination));
  }
  if (minPrice) {
    conditions.push('p.base_price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    conditions.push('p.base_price <= ?');
    params.push(Number(maxPrice));
  }
  const orderBy = {
    price_asc: 'p.base_price ASC',
    price_desc: 'p.base_price DESC',
    rating: 'p.base_price DESC',
  }[sort] || 'p.package_id ASC';
  const sql = `${packageSelect}${conditions.length ? ` AND ${conditions.join(' AND ')}` : ''} ORDER BY ${orderBy}`;
  const [rows] = await db.execute(sql, params);
  const enriched = await enrichPackages(rows);
  if (sort === 'rating') enriched.sort((a, b) => b.average_rating - a.average_rating);
  return enriched;
}

async function getHotels() {
  const [rows] = await db.execute('SELECT * FROM hotels ORDER BY hotel_id');
  return rows;
}

async function getFiltersMeta() {
  const destinations = await getAllDestinations();
  return {
    categories: ['beach', 'adventure', 'heritage', 'wildlife', 'spiritual', 'luxury', 'family'],
    destinations: destinations.map((destination) => ({ id: destination.destination_id, name: destination.name })),
    regions: [...new Set(destinations.map((destination) => destination.state))],
    priceRange: { min: 5000, max: 50000 },
  };
}

module.exports = {
  getFeaturedPackages,
  getAllDestinations,
  getDestinationById,
  getPackageBySlug,
  getPackages,
  getHotels,
  getTransportOptions,
  getFiltersMeta,
};
