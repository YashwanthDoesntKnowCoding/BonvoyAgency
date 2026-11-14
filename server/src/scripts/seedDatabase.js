const db = require('../config/db');
const { destinations, hotels, packages, users } = require('../data/mockData');

async function seed() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const user of users) {
      await connection.execute(
        `INSERT INTO users (user_id, full_name, email, password_hash, phone, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash),
           phone = VALUES(phone), role = VALUES(role), is_active = VALUES(is_active)`,
        [user.user_id, user.full_name, user.email, user.password_hash, user.phone, user.role, user.is_active],
      );
    }

    for (const destination of destinations) {
      await connection.execute(
        `INSERT INTO destinations
          (destination_id, name, country, state, region, description, long_description, best_season,
           latitude, longitude, image_url, image_source_url, image_credit, image_license,
           image_license_url, highlights, local_tip, gallery)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), country = VALUES(country), state = VALUES(state),
           region = VALUES(region), description = VALUES(description), long_description = VALUES(long_description),
           best_season = VALUES(best_season), latitude = VALUES(latitude), longitude = VALUES(longitude),
           image_url = VALUES(image_url), image_source_url = VALUES(image_source_url),
           image_credit = VALUES(image_credit), image_license = VALUES(image_license),
           image_license_url = VALUES(image_license_url), highlights = VALUES(highlights),
           local_tip = VALUES(local_tip), gallery = VALUES(gallery)`,
        [
          destination.destination_id, destination.name, destination.country, destination.state,
          destination.region, destination.description, destination.long_description, destination.best_season,
          destination.latitude, destination.longitude, destination.image_url, destination.image_source_url,
          destination.image_credit, destination.image_license, destination.image_license_url,
          JSON.stringify(destination.highlights || []), destination.local_tip,
          JSON.stringify(destination.gallery || []),
        ],
      );
    }

    for (const pkg of packages) {
      await connection.execute(
        `INSERT INTO packages
          (package_id, destination_id, title, slug, description, duration_days, base_price, origin,
           route_distance_km, map_url, best_season, price_note, category, difficulty, max_group_size,
           inclusions, exclusions, image_url, image_source_url, image_credit, image_license,
           image_license_url, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE destination_id = VALUES(destination_id), title = VALUES(title),
           description = VALUES(description), duration_days = VALUES(duration_days), base_price = VALUES(base_price),
           origin = VALUES(origin), route_distance_km = VALUES(route_distance_km), map_url = VALUES(map_url),
           best_season = VALUES(best_season), price_note = VALUES(price_note), category = VALUES(category),
           difficulty = VALUES(difficulty), max_group_size = VALUES(max_group_size),
           inclusions = VALUES(inclusions), exclusions = VALUES(exclusions), image_url = VALUES(image_url),
           image_source_url = VALUES(image_source_url), image_credit = VALUES(image_credit),
           image_license = VALUES(image_license), image_license_url = VALUES(image_license_url),
           is_active = VALUES(is_active), created_by = VALUES(created_by)`,
        [
          pkg.package_id, pkg.destination_id, pkg.title, pkg.slug, pkg.description, pkg.duration_days,
          pkg.base_price, pkg.origin, pkg.route_distance_km, pkg.map_url, pkg.best_season, pkg.price_note,
          pkg.category, pkg.difficulty, pkg.max_group_size, pkg.inclusions, pkg.exclusions, pkg.image_url,
          pkg.image_source_url, pkg.image_credit, pkg.image_license, pkg.image_license_url,
          pkg.is_active, pkg.created_by,
        ],
      );

      for (const day of pkg.itinerary) {
        await connection.execute(
          `INSERT INTO package_itinerary (package_id, day_number, title, description)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`,
          [pkg.package_id, day.day_number, day.title, day.description],
        );
      }

      for (const departure of pkg.departures) {
        await connection.execute(
          `INSERT INTO departures
            (departure_id, package_id, start_date, end_date, total_seats, available_seats, price_override, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE package_id = VALUES(package_id), start_date = VALUES(start_date),
             end_date = VALUES(end_date), total_seats = VALUES(total_seats),
             available_seats = VALUES(available_seats), price_override = VALUES(price_override),
             status = VALUES(status)`,
          [
            departure.departure_id, pkg.package_id, departure.start_date, departure.end_date,
            departure.total_seats, departure.available_seats, departure.price_override, departure.status,
          ],
        );
      }
    }

    for (const hotel of hotels) {
      await connection.execute(
        `INSERT INTO hotels (hotel_id, destination_id, name, star_rating, price_per_night, address, amenities, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE destination_id = VALUES(destination_id), name = VALUES(name),
           star_rating = VALUES(star_rating), price_per_night = VALUES(price_per_night),
           address = VALUES(address), amenities = VALUES(amenities), image_url = VALUES(image_url)`,
        [
          hotel.hotel_id, hotel.destination_id, hotel.name, hotel.star_rating, hotel.price_per_night,
          hotel.address, hotel.amenities, hotel.image_url,
        ],
      );
    }

    let reviewId = 1;
    for (const pkg of packages) {
      for (const review of pkg.reviews) {
        await connection.execute(
          `INSERT INTO reviews (review_id, user_id, package_id, rating, title, comment)
           VALUES (?, 3, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), comment = VALUES(comment)`,
          [reviewId, pkg.package_id, review.rating, review.title || null, review.comment || null],
        );
        reviewId += 1;
      }
    }

    await connection.execute(
      'INSERT INTO wishlist (user_id, package_id) VALUES (3, 1) ON DUPLICATE KEY UPDATE added_at = added_at',
    );
    await connection.commit();
    console.log(`Seeded ${destinations.length} destinations, ${packages.length} packages, ${hotels.length} hotels, and demo users.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

seed().catch((error) => {
  console.error('Database seed failed:', error.message);
  process.exitCode = 1;
});
