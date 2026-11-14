CREATE DATABASE IF NOT EXISTS bonvoyagency
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE bonvoyagency;

CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(25),
  role ENUM('customer', 'agent', 'admin') NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS destinations (
  destination_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(80) NOT NULL,
  region VARCHAR(80) NOT NULL,
  description TEXT,
  long_description TEXT,
  best_season VARCHAR(80),
  latitude DOUBLE,
  longitude DOUBLE,
  image_url TEXT,
  image_source_url TEXT,
  image_credit VARCHAR(180),
  image_license VARCHAR(100),
  image_license_url TEXT,
  highlights JSON,
  local_tip TEXT,
  gallery JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (destination_id),
  KEY idx_destinations_state (state)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hotels (
  hotel_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  destination_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  star_rating TINYINT UNSIGNED,
  price_per_night DECIMAL(10,2) NOT NULL,
  address TEXT NOT NULL,
  amenities TEXT,
  image_url TEXT,
  PRIMARY KEY (hotel_id),
  CONSTRAINT chk_hotels_rating CHECK (star_rating IS NULL OR star_rating BETWEEN 1 AND 5),
  CONSTRAINT chk_hotels_price CHECK (price_per_night > 0),
  CONSTRAINT fk_hotels_destination FOREIGN KEY (destination_id)
    REFERENCES destinations(destination_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS packages (
  package_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  destination_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  duration_days SMALLINT UNSIGNED NOT NULL,
  base_price DECIMAL(12,2) NOT NULL,
  origin VARCHAR(120) NOT NULL,
  route_distance_km INT UNSIGNED NOT NULL,
  map_url TEXT NOT NULL,
  best_season VARCHAR(80),
  price_note TEXT,
  category ENUM('adventure', 'beach', 'heritage', 'wildlife', 'spiritual', 'luxury', 'family') NOT NULL,
  difficulty VARCHAR(30),
  max_group_size SMALLINT UNSIGNED NOT NULL,
  inclusions TEXT,
  exclusions TEXT,
  image_url TEXT,
  image_source_url TEXT,
  image_credit VARCHAR(180),
  image_license VARCHAR(100),
  image_license_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (package_id),
  UNIQUE KEY uq_packages_slug (slug),
  KEY idx_packages_destination (destination_id),
  KEY idx_packages_category_price (category, base_price),
  CONSTRAINT chk_packages_duration CHECK (duration_days > 0),
  CONSTRAINT chk_packages_price CHECK (base_price > 0),
  CONSTRAINT fk_packages_destination FOREIGN KEY (destination_id)
    REFERENCES destinations(destination_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_packages_creator FOREIGN KEY (created_by)
    REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS package_itinerary (
  itinerary_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  package_id INT UNSIGNED NOT NULL,
  day_number SMALLINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (itinerary_id),
  UNIQUE KEY uq_itinerary_day (package_id, day_number),
  CONSTRAINT fk_itinerary_package FOREIGN KEY (package_id)
    REFERENCES packages(package_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS departures (
  departure_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  package_id INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_seats SMALLINT UNSIGNED NOT NULL,
  available_seats SMALLINT UNSIGNED NOT NULL,
  price_override DECIMAL(12,2),
  status ENUM('open', 'full', 'closed', 'completed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (departure_id),
  KEY idx_departures_date (start_date, status),
  CONSTRAINT chk_departure_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_departure_seats CHECK (available_seats <= total_seats),
  CONSTRAINT fk_departures_package FOREIGN KEY (package_id)
    REFERENCES packages(package_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  review_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  package_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(180),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reviews_package FOREIGN KEY (package_id)
    REFERENCES packages(package_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  booking_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_ref VARCHAR(30) UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  package_id INT UNSIGNED NOT NULL,
  departure_id INT UNSIGNED NOT NULL,
  num_travellers TINYINT UNSIGNED NOT NULL,
  transport_id VARCHAR(40) NOT NULL,
  transport_label VARCHAR(100) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('saved', 'pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'saved',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (booking_id),
  KEY idx_bookings_user_created (user_id, created_at),
  CONSTRAINT chk_booking_travellers CHECK (num_travellers BETWEEN 1 AND 10),
  CONSTRAINT chk_booking_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND total_amount >= 0),
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_package FOREIGN KEY (package_id)
    REFERENCES packages(package_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_departure FOREIGN KEY (departure_id)
    REFERENCES departures(departure_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wishlist (
  user_id INT UNSIGNED NOT NULL,
  package_id INT UNSIGNED NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, package_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_package FOREIGN KEY (package_id)
    REFERENCES packages(package_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_name VARCHAR(64) NOT NULL,
  record_id BIGINT UNSIGNED NOT NULL,
  action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  new_data JSON,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (audit_id),
  KEY idx_audit_table_record (table_name, record_id)
) ENGINE=InnoDB;
