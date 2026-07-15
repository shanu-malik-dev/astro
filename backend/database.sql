CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  country_code VARCHAR(10) NOT NULL,
  is_delete TINYINT NOT NULL DEFAULT 0,
  otp VARCHAR(255) NULL,
  otp_expiry DATETIME NULL,
  token VARCHAR(255) NULL,
  token_expiry DATETIME NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_users_country_mobile (
    country_code,
    mobile
  ),

  KEY idx_users_role_id (role_id),
  KEY idx_users_status_delete (status, is_delete),
  KEY idx_users_otp_expiry (otp_expiry),

  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id)
    REFERENCES roles (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  country_code VARCHAR(10) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  login_type VARCHAR(30) NOT NULL DEFAULT 'OTP',
  ip_address VARCHAR(50) NULL,
  user_agent TEXT NULL,
  is_success TINYINT NOT NULL DEFAULT 0,
  failure_reason VARCHAR(255) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_login_logs_user_id (user_id),
  KEY idx_login_logs_mobile (country_code, mobile),
  KEY idx_login_logs_success (is_success),
  KEY idx_login_logs_created_at (created_at),

  CONSTRAINT fk_login_logs_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (
  name,
  status
)
SELECT
  'Customer',
  1
WHERE NOT EXISTS (
  SELECT 1
  FROM roles
  WHERE name = 'Customer'
);
