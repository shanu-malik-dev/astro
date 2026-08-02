CREATE TABLE IF NOT EXISTS `enquiry_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `enq_id` BIGINT UNSIGNED NOT NULL,
  `executive_id` BIGINT UNSIGNED NOT NULL,
  `assigned_by` BIGINT UNSIGNED NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_enquiry_assignments_enquiry` (`enq_id`),
  KEY `idx_enquiry_assignments_executive_active` (`executive_id`, `is_active`),
  KEY `idx_enquiry_assignments_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_enquiry_assignments_enquiry`
    FOREIGN KEY (`enq_id`) REFERENCES `enquiries` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_enquiry_assignments_executive`
    FOREIGN KEY (`executive_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_enquiry_assignments_assigned_by`
    FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
);
