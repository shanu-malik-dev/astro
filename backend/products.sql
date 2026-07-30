CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_code VARCHAR(50) NOT NULL,
  product_image TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 1,
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
  is_delete TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Deleted, 0=Not Deleted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_code (product_code),
  KEY idx_products_status_delete_order (status, is_delete, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_translation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  lang_code VARCHAR(10) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=Active, 0=Inactive',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_translation_lang (product_id, lang_code),
  KEY idx_product_translation_lang_status (lang_code, status),
  CONSTRAINT fk_product_translation_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE products
  MODIFY product_image TEXT NOT NULL;

INSERT INTO products (id, product_code, product_image, product_price, display_order, status, is_delete)
VALUES
  (1, 'RUDRA-001', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Rudraksha+Mala', 499.00, 1, 1, 0),
  (2, 'SPHATIK-002', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Sphatik+Mala', 699.00, 2, 1, 0),
  (3, 'YANTRA-003', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Shree+Yantra', 899.00, 3, 1, 0),
  (4, 'KAVACH-004', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Hanuman+Kavach', 349.00, 4, 1, 0),
  (5, 'DIYA-005', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Brass+Diya', 299.00, 5, 1, 0),
  (6, 'DHOOP-006', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Dhoop+Sticks', 149.00, 6, 1, 0),
  (7, 'CHANDAN-007', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Chandan+Tilak', 199.00, 7, 1, 0),
  (8, 'GOMTI-008', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Gomti+Chakra', 249.00, 8, 1, 0),
  (9, 'KALAWA-009', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Kalawa+Thread', 99.00, 9, 1, 0),
  (10, 'POOJA-010', 'https://placehold.co/800x600/f7f2ea/3a2d24?text=Pooja+Kit', 999.00, 10, 1, 0)
ON DUPLICATE KEY UPDATE
  product_code = VALUES(product_code),
  product_image = VALUES(product_image),
  product_price = VALUES(product_price),
  display_order = VALUES(display_order),
  status = VALUES(status),
  is_delete = VALUES(is_delete);

INSERT INTO product_translation (product_id, lang_code, name, description, status)
VALUES
  (1, 'en', 'Rudraksha Mala', 'A sacred Rudraksha mala for mantra jaap, meditation, and daily spiritual practice.', 1),
  (1, 'hi', 'रुद्राक्ष माला', 'मंत्र जाप, ध्यान और दैनिक आध्यात्मिक साधना के लिए पवित्र रुद्राक्ष माला।', 1),
  (2, 'en', 'Sphatik Mala', 'A cooling crystal mala used for peace, focus, and devotional chanting.', 1),
  (2, 'hi', 'स्फटिक माला', 'शांति, एकाग्रता और भक्ति जाप के लिए उपयोगी स्फटिक माला।', 1),
  (3, 'en', 'Shree Yantra', 'A Shree Yantra for prosperity worship, pooja room placement, and positive energy.', 1),
  (3, 'hi', 'श्री यंत्र', 'समृद्धि पूजा, पूजा स्थान और सकारात्मक ऊर्जा के लिए श्री यंत्र।', 1),
  (4, 'en', 'Hanuman Kavach', 'A devotional Hanuman Kavach for courage, protection, and confidence.', 1),
  (4, 'hi', 'हनुमान कवच', 'साहस, सुरक्षा और आत्मविश्वास के लिए भक्तिपूर्ण हनुमान कवच।', 1),
  (5, 'en', 'Brass Diya', 'A traditional brass diya for daily aarti, festivals, and home temple use.', 1),
  (5, 'hi', 'पीतल का दीया', 'दैनिक आरती, त्योहारों और घर के मंदिर के लिए पारंपरिक पीतल का दीया।', 1),
  (6, 'en', 'Dhoop Sticks', 'Fragrant dhoop sticks for pooja, cleansing, and a peaceful home atmosphere.', 1),
  (6, 'hi', 'धूप बत्ती', 'पूजा, शुद्धिकरण और शांत वातावरण के लिए सुगंधित धूप बत्ती।', 1),
  (7, 'en', 'Chandan Tilak', 'Sandalwood tilak for worship, rituals, and daily spiritual use.', 1),
  (7, 'hi', 'चंदन तिलक', 'पूजा, अनुष्ठान और दैनिक आध्यात्मिक उपयोग के लिए चंदन तिलक।', 1),
  (8, 'en', 'Gomti Chakra Set', 'A Gomti Chakra set used in traditional prosperity and protection remedies.', 1),
  (8, 'hi', 'गोमती चक्र सेट', 'समृद्धि और सुरक्षा के पारंपरिक उपायों में उपयोगी गोमती चक्र सेट।', 1),
  (9, 'en', 'Kalawa Thread', 'Sacred kalawa thread for pooja, sankalp, and auspicious rituals.', 1),
  (9, 'hi', 'कलावा धागा', 'पूजा, संकल्प और शुभ अनुष्ठानों के लिए पवित्र कलावा धागा।', 1),
  (10, 'en', 'Complete Pooja Kit', 'A ready pooja kit with essential items for daily worship and special rituals.', 1),
  (10, 'hi', 'पूर्ण पूजा किट', 'दैनिक पूजा और विशेष अनुष्ठानों के लिए आवश्यक सामग्री वाली पूजा किट।', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status);

INSERT IGNORE INTO role_admin_modules (role_id, module_key)
SELECT id, 'products'
FROM roles
WHERE id = 1;
