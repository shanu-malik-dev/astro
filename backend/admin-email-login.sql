ALTER TABLE users
  ADD COLUMN email VARCHAR(150) NULL AFTER country_code,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER email,
  ADD UNIQUE KEY uq_users_email (email);

-- Example: set admin email after generating a bcrypt hash for the password.
-- UPDATE users
-- SET email = 'admin@example.com',
--     password_hash = '$2b$12$replace_with_bcrypt_hash'
-- WHERE role_id = 1
-- LIMIT 1;
