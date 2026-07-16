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

CREATE TABLE IF NOT EXISTS problems (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  display_order INT UNSIGNED NOT NULL DEFAULT 1,
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
  is_delete TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Deleted, 0=Not Deleted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_problems_status_delete_order (
    status,
    is_delete,
    display_order
  )
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS problem_translation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problem_id BIGINT UNSIGNED NOT NULL,
  lang_code VARCHAR(10) NOT NULL,
  name VARCHAR(150) NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_problem_translation_lang (
    problem_id,
    lang_code
  ),

  KEY idx_problem_translation_lang_status (
    lang_code,
    status
  ),

  CONSTRAINT fk_problem_translation_problem
    FOREIGN KEY (problem_id)
    REFERENCES problems (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  display_order INT UNSIGNED NOT NULL DEFAULT 1,
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
  is_delete TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Deleted, 0=Not Deleted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_services_status_delete_order (
    status,
    is_delete,
    display_order
  )
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_translation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_id BIGINT UNSIGNED NOT NULL,
  lang_code VARCHAR(10) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_service_translation_lang (
    service_id,
    lang_code
  ),

  KEY idx_service_translation_lang_status (
    lang_code,
    status
  ),

  CONSTRAINT fk_service_translation_service
    FOREIGN KEY (service_id)
    REFERENCES services (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS enquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NULL,
  customer_name VARCHAR(100) NOT NULL,
  country_code VARCHAR(10) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  problem_id BIGINT UNSIGNED NOT NULL,
  problem_name VARCHAR(150) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  close_remark TEXT NULL,
  is_delete TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Deleted, 0=Not Deleted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_enquiries_customer_mobile (
    country_code,
    mobile
  ),

  KEY idx_enquiries_problem_status (
    problem_id,
    status,
    is_delete
  ),

  KEY idx_enquiries_status_delete (
    status,
    is_delete
  ),

  CONSTRAINT fk_enquiries_customer
    FOREIGN KEY (customer_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_enquiries_problem
    FOREIGN KEY (problem_id)
    REFERENCES problems (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS follow_ups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  enq_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  country_code VARCHAR(10) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  problem_name VARCHAR(150) NOT NULL,
  remark TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  is_delete TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Deleted, 0=Not Deleted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_follow_ups_status_delete (
    status,
    is_delete
  ),

  KEY idx_follow_ups_enquiry (
    enq_id
  ),

  CONSTRAINT fk_follow_ups_enquiry
    FOREIGN KEY (enq_id)
    REFERENCES enquiries (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
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
