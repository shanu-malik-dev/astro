CREATE TABLE IF NOT EXISTS api_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id VARCHAR(64) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  status_code INT NULL,
  response_time_ms INT NOT NULL DEFAULT 0,
  ip_address VARCHAR(80) NULL,
  user_agent VARCHAR(500) NULL,
  user_id BIGINT UNSIGNED NULL,
  tenant_id VARCHAR(80) NULL,
  request_headers JSON NULL,
  request_query JSON NULL,
  request_body JSON NULL,
  response_body JSON NULL,
  error_message TEXT NULL,
  query_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_api_logs_request_id (request_id),
  KEY idx_api_logs_path_created (path, created_at),
  KEY idx_api_logs_user_created (user_id, created_at)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_query_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  api_log_id BIGINT UNSIGNED NOT NULL,
  query_text LONGTEXT NOT NULL,
  query_params JSON NULL,
  query_response JSON NULL,
  error_message TEXT NULL,
  response_time_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_api_query_logs_api_log_id (api_log_id),

  CONSTRAINT fk_api_query_logs_api_log
    FOREIGN KEY (api_log_id)
    REFERENCES api_logs (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
