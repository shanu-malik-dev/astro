CREATE TABLE IF NOT EXISTS nova_problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  display_order INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nova_problem_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  lang VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_problem_lang (problem_id, lang),
  FOREIGN KEY (problem_id) REFERENCES nova_problems(id) ON DELETE CASCADE
);

INSERT IGNORE INTO nova_problems (id, display_order, status) VALUES
  (1, 1, 'active'),
  (2, 2, 'active');

INSERT IGNORE INTO nova_problem_translations (problem_id, lang, name, status) VALUES
  (1, 'en', 'Career problem', 'active'),
  (1, 'hi', 'Career problem', 'active'),
  (2, 'en', 'Marriage problem', 'active'),
  (2, 'hi', 'Marriage problem', 'active');
