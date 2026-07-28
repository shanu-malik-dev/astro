INSERT INTO roles (
  id,
  name,
  status
)
SELECT
  1,
  'Admin',
  1
WHERE NOT EXISTS (
  SELECT 1
  FROM roles
  WHERE id = 1
);

CREATE TABLE IF NOT EXISTS role_admin_modules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id BIGINT UNSIGNED NOT NULL,
  module_key VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_role_admin_modules_role_module (role_id, module_key),
  KEY idx_role_admin_modules_role_id (role_id),

  CONSTRAINT fk_role_admin_modules_role
    FOREIGN KEY (role_id)
    REFERENCES roles (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO role_admin_modules (role_id, module_key)
SELECT id, module_key
FROM roles
JOIN (
  SELECT 'problem' AS module_key
  UNION ALL SELECT 'services'
  UNION ALL SELECT 'astrologers'
  UNION ALL SELECT 'enquiry'
  UNION ALL SELECT 'customers'
  UNION ALL SELECT 'followUp'
  UNION ALL SELECT 'payments'
  UNION ALL SELECT 'support'
  UNION ALL SELECT 'roles'
) modules
WHERE roles.id = 1;
