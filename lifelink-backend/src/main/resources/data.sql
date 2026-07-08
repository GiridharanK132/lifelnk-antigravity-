-- Seed Roles
INSERT INTO roles (id, name) VALUES (1, 'ROLE_SUPER_ADMIN');
INSERT INTO roles (id, name) VALUES (2, 'ROLE_HOSPITAL_ADMIN');
INSERT INTO roles (id, name) VALUES (3, 'ROLE_PUBLIC');

-- Seed Users (password is BCrypt for 'password123': $2a$10$8.2qPhOlNC9SPkuY8gV/OuThd7.S5vPeyE97W.SgI7P4e.n9vY4Py)
INSERT INTO users (id, name, email, password, role_id, is_active, is_verified) VALUES 
(1, 'Super Admin', 'superadmin@lifelink.ai', '$2a$10$8.2qPhOlNC9SPkuY8gV/OuThd7.S5vPeyE97W.SgI7P4e.n9vY4Py', 1, TRUE, TRUE),
(2, 'Seattle General Admin', 'admin1@lifelink.ai', '$2a$10$8.2qPhOlNC9SPkuY8gV/OuThd7.S5vPeyE97W.SgI7P4e.n9vY4Py', 2, TRUE, TRUE),
(3, 'Cherry Hill Admin', 'admin2@lifelink.ai', '$2a$10$8.2qPhOlNC9SPkuY8gV/OuThd7.S5vPeyE97W.SgI7P4e.n9vY4Py', 2, TRUE, TRUE),
(4, 'First Hill Admin', 'admin3@lifelink.ai', '$2a$10$8.2qPhOlNC9SPkuY8gV/OuThd7.S5vPeyE97W.SgI7P4e.n9vY4Py', 2, TRUE, TRUE),
(5, 'Jane Public', 'public@lifelink.ai', '$2a$10$8.2qPhOlNC9SPkuY8gV/OuThd7.S5vPeyE97W.SgI7P4e.n9vY4Py', 3, TRUE, TRUE),
(6, 'John Donor', 'donor1@lifelink.ai', '$2a$10$8.2qPhOlNC9SPkuY8gV/OuThd7.S5vPeyE97W.SgI7P4e.n9vY4Py', 3, TRUE, TRUE),
(7, 'Sarah compatible', 'donor2@lifelink.ai', '$2a$10$8.2qPhOlNC9SPkuY8gV/OuThd7.S5vPeyE97W.SgI7P4e.n9vY4Py', 3, TRUE, TRUE);

-- Seed Hospitals
INSERT INTO hospitals (id, name, address, latitude, longitude, contact_number, email, status) VALUES 
(1, 'Seattle General Hospital', '1100 9th Ave, Seattle, WA 98101', 47.6062, -122.3321, '206-555-0101', 'contact@seattlegeneral.org', 'ACTIVE'),
(2, 'Cherry Hill Medical Center', '500 17th Ave, Seattle, WA 98122', 47.6097, -122.3123, '206-555-0102', 'info@cherryhillmed.org', 'ACTIVE'),
(3, 'First Hill Hospital', '747 Broadway, Seattle, WA 98122', 47.6111, -122.3245, '206-555-0103', 'firsthill@hospital.org', 'ACTIVE'),
(4, 'University District Medical', '4515 15th Ave NE, Seattle, WA 98105', 47.6611, -122.3131, '206-555-0104', 'udistrict@medical.org', 'ACTIVE'),
(5, 'West Seattle Emergency Care', '2600 SW Barton St, Seattle, WA 98126', 47.5611, -122.3831, '206-555-0105', 'westseattle@emergency.org', 'ACTIVE');

-- Map Hospital Admins
INSERT INTO hospital_admins (id, user_id, hospital_id) VALUES 
(1, 2, 1),
(2, 3, 2),
(3, 4, 3);

-- Seed Blood Inventory
-- Status: AVAILABLE, EXPIRED, RESERVED
-- Blood Groups: A+, A-, B+, B-, AB+, AB-, O+, O-
INSERT INTO blood_inventory (id, hospital_id, blood_group, available_units, collection_date, expiry_date, status, updated_by) VALUES
(1, 1, 'O+', 15, '2026-06-20', '2026-07-25', 'AVAILABLE', 2),
(2, 1, 'O-', 8, '2026-06-21', '2026-07-26', 'AVAILABLE', 2),
(3, 1, 'A+', 20, '2026-06-15', '2026-07-20', 'AVAILABLE', 2),
(4, 1, 'AB-', 2, '2026-06-10', '2026-07-15', 'AVAILABLE', 2),
(5, 1, 'B+', 0, '2026-05-10', '2026-06-14', 'EXPIRED', 2), -- Expired inventory

(6, 2, 'O+', 10, '2026-06-22', '2026-07-27', 'AVAILABLE', 3),
(7, 2, 'O-', 4, '2026-06-23', '2026-07-28', 'AVAILABLE', 3),
(8, 2, 'AB-', 5, '2026-06-18', '2026-07-23', 'AVAILABLE', 3),
(9, 2, 'B+', 12, '2026-06-14', '2026-07-19', 'AVAILABLE', 3),

(10, 3, 'O+', 5, '2026-06-10', '2026-07-15', 'AVAILABLE', 4),
(11, 3, 'AB-', 1, '2026-06-08', '2026-07-13', 'AVAILABLE', 4),
(12, 3, 'A-', 15, '2026-06-19', '2026-07-24', 'AVAILABLE', 4),

(13, 4, 'O-', 2, '2026-06-25', '2026-07-30', 'AVAILABLE', NULL),
(14, 4, 'AB+', 10, '2026-06-24', '2026-07-29', 'AVAILABLE', NULL),

(15, 5, 'B-', 6, '2026-06-22', '2026-07-27', 'AVAILABLE', NULL);

-- Seed Donors
INSERT INTO donors (id, user_id, blood_group, last_donation_date, address, latitude, longitude, contact_number, is_available) VALUES
(1, 6, 'O-', '2026-03-10', '4700 9th Ave NE, Seattle, WA 98105', 47.6631, -122.3181, '206-555-9000', TRUE),
(2, 7, 'AB-', '2026-04-15', '1200 E Pike St, Seattle, WA 98122', 47.6140, -122.3160, '206-555-9001', TRUE);

-- Seed Donation History
INSERT INTO donation_history (id, donor_id, hospital_id, units, donation_date, status) VALUES
(1, 1, 1, 1, '2026-03-10', 'COMPLETED'),
(2, 2, 2, 1, '2026-04-15', 'COMPLETED');

-- Seed Notifications
INSERT INTO notifications (id, user_id, title, message, is_read, type) VALUES
(1, 2, 'Welcome Admin', 'Welcome to the LifeLink AI dashboard. Keep your inventory updated.', FALSE, 'SYSTEM'),
(2, 3, 'Low Stock Alert', 'AB- units are below the safety threshold of 5 units.', FALSE, 'LOW_STOCK');

-- Seed Activity Logs
INSERT INTO activity_logs (id, user_id, action, details) VALUES
(1, 2, 'INVENTORY_UPDATE', 'Updated O+ available units to 15'),
(2, 3, 'INVENTORY_UPDATE', 'Added 5 units of AB- blood group');
