-- Run this on existing databases after moving enquiry selections from problems to services.
-- Existing enquiry problem_id values must already match valid services.id values before adding the new FK.

DELETE FROM role_admin_modules
WHERE module_key = 'problem';

ALTER TABLE enquiries
  DROP FOREIGN KEY fk_enquiries_problem;

ALTER TABLE enquiries
  ADD CONSTRAINT fk_enquiries_service
    FOREIGN KEY (problem_id)
    REFERENCES services (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
