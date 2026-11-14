USE bonvoyagency;
DROP TRIGGER IF EXISTS trg_audit_booking_insert;
DROP TRIGGER IF EXISTS trg_audit_booking_update;
DROP TRIGGER IF EXISTS trg_departure_status_update;
DROP FUNCTION IF EXISTS fn_package_avg_rating;
DROP FUNCTION IF EXISTS fn_calculate_refund;
DELIMITER $$

CREATE FUNCTION fn_package_avg_rating(p_package_id INT UNSIGNED)
RETURNS DECIMAL(4,2)
READS SQL DATA
BEGIN
  DECLARE v_average DECIMAL(4,2);
  SELECT ROUND(AVG(rating), 2)
    INTO v_average
    FROM reviews
    WHERE package_id = p_package_id;
  RETURN v_average;
END$$

CREATE FUNCTION fn_calculate_refund(p_days_before_departure INT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
  RETURN CASE
    WHEN p_days_before_departure >= 15 THEN 100.00
    WHEN p_days_before_departure >= 7 THEN 75.00
    WHEN p_days_before_departure >= 3 THEN 50.00
    ELSE 0.00
  END;
END$$

CREATE TRIGGER trg_departure_status_update
BEFORE UPDATE ON departures
FOR EACH ROW
BEGIN
  IF NEW.available_seats = 0 THEN
    SET NEW.status = 'full';
  ELSEIF OLD.status = 'full' AND NEW.available_seats > 0 THEN
    SET NEW.status = 'open';
  END IF;
END$$

CREATE TRIGGER trg_audit_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, new_data)
  VALUES (
    'bookings',
    NEW.booking_id,
    'INSERT',
    JSON_OBJECT(
      'user_id', NEW.user_id,
      'package_id', NEW.package_id,
      'departure_id', NEW.departure_id,
      'total_amount', NEW.total_amount,
      'status', NEW.status
    )
  );
END$$

CREATE TRIGGER trg_audit_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, new_data)
  VALUES (
    'bookings',
    NEW.booking_id,
    'UPDATE',
    JSON_OBJECT('status', NEW.status, 'total_amount', NEW.total_amount)
  );
END$$

DELIMITER ;
