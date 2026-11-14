const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/config/db');

const token = jwt.sign({ sub: 3, role: 'customer' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });
const testEmail = `test-${Date.now()}@example.com`;
let testBookingRef = null;

describe('Bonvoyagency API', () => {
  afterAll(async () => {
    if (testBookingRef) {
      const [rows] = await db.execute('SELECT booking_id FROM bookings WHERE booking_ref = ?', [testBookingRef]);
      if (rows.length) {
        await db.execute(
          "DELETE FROM audit_logs WHERE table_name = 'bookings' AND record_id = ?",
          [rows[0].booking_id],
        );
        await db.execute('DELETE FROM bookings WHERE booking_id = ?', [rows[0].booking_id]);
      }
    }
    await db.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    await db.end();
  });

  test('health endpoint responds', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.database).toBe('connected');
  });

  test('package catalog contains bookable South India destinations', async () => {
    const response = await request(app).get('/api/v1/packages').set('Origin', 'http://localhost:5174');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5174');
    expect(response.body.data.items).toHaveLength(16);
    expect(response.body.data.items.every((pkg) => pkg.destination_name && pkg.route_distance_km && pkg.map_url && pkg.departures.length)).toBe(true);
    expect(response.body.data.items.every((pkg) => pkg.map_url.includes('destination=') && pkg.image_source_url)).toBe(true);
    expect(response.body.data.items.every((pkg) => pkg.transport_options.some((option) => option.id === 'coach' && option.price_adjustment === 0))).toBe(true);

    const destinations = await request(app).get('/api/v1/destinations');
    expect(destinations.body.data.every((destination) => ['Karnataka', 'Kerala', 'Tamil Nadu'].includes(destination.state))).toBe(true);
    expect(destinations.body.data.map((destination) => destination.state)).toEqual(expect.arrayContaining(['Karnataka', 'Kerala', 'Tamil Nadu']));
    expect(destinations.body.data.every((destination) => destination.gallery.length > 0 && destination.gallery.every((photo) => photo.image_source_url && photo.image_credit && photo.image_license))).toBe(true);
    expect(destinations.body.data.map((destination) => destination.name)).toEqual(expect.arrayContaining(['Udupi', 'Dandeli', 'Halebidu', 'Srirangapatna']));

    const gokarna = await request(app).get('/api/v1/packages/gokarna-coast-temple-trail');
    expect(gokarna.status).toBe(200);
    expect(gokarna.body.data.route_distance_km).toBe(485);
    expect(gokarna.body.data.departures[0].available_seats).toBeGreaterThan(0);
    expect(gokarna.body.data.destination.gallery).toHaveLength(1);
    expect(gokarna.body.data.transport_options.find((option) => option.id === 'train').price_adjustment).toBeGreaterThan(0);
  });

  test('register endpoint creates a user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        full_name: 'Test User',
        email: testEmail,
        password: 'Password123!',
        phone: '+91 9999999999',
        role: 'admin',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('customer');
    expect(response.body.data.accessToken).toBeTruthy();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'Password123!' });
    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe(testEmail);
    expect(login.body.data.accessToken).toBeTruthy();

    const profile = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(profile.body.data.user.email).toBe(testEmail);
    const [persistedUser] = await db.execute('SELECT user_id FROM users WHERE email = ?', [testEmail]);
    expect(persistedUser).toHaveLength(1);
  });

  test('quote endpoint works with a valid token', async () => {
    const response = await request(app)
      .post('/api/v1/bookings/quote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        packageId: '1',
        departureId: '1',
        hotelId: '1',
        transportId: '1',
        numTravellers: 2,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.totalAmount).toBeGreaterThan(0);
  });

  test('booking is saved to the customer trips without payment', async () => {
    const saved = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId: 1, departureId: 1, transportId: 'train', numTravellers: 2 });

    expect(saved.status).toBe(201);
    testBookingRef = saved.body.data.bookingId;
    expect(saved.body.data.status).toBe('saved');
    expect(saved.body.data.transportLabel).toBe('Train + local transfer');
    expect(saved.body.message).toMatch(/no payment/i);

    const trips = await request(app).get('/api/v1/bookings').set('Authorization', `Bearer ${token}`);
    expect(trips.body.data).toContainEqual(expect.objectContaining({
      bookingId: saved.body.data.bookingId,
      packageTitle: 'Mysuru Royal Heritage Weekend',
    }));
    const [persistedBooking] = await db.execute(
      'SELECT booking_id FROM bookings WHERE booking_ref = ?',
      [saved.body.data.bookingId],
    );
    expect(persistedBooking).toHaveLength(1);
  });

  test('wishlist add, list and remove works for the signed-in customer', async () => {
    const added = await request(app)
      .post('/api/v1/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId: 2 });
    expect(added.status).toBe(201);

    const listed = await request(app).get('/api/v1/wishlist').set('Authorization', `Bearer ${token}`);
    expect(listed.body.data.map((item) => item.packageId)).toContain(2);
    const [persistedWishlist] = await db.execute(
      'SELECT package_id FROM wishlist WHERE user_id = 3 AND package_id = 2',
    );
    expect(persistedWishlist).toHaveLength(1);

    const removed = await request(app).delete('/api/v1/wishlist/2').set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
    const afterRemoval = await request(app).get('/api/v1/wishlist').set('Authorization', `Bearer ${token}`);
    expect(afterRemoval.body.data.map((item) => item.packageId)).not.toContain(2);
  });
});
