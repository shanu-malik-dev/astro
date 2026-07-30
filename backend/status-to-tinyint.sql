UPDATE users
SET call_status = CASE
  WHEN call_status = 'called' THEN 2
  WHEN call_status = 'not_called' THEN 1
  WHEN call_status = '2' THEN 2
  ELSE 1
END;

ALTER TABLE users
  MODIFY call_status TINYINT NOT NULL DEFAULT 1 COMMENT '1=Not called, 2=Called';


UPDATE enquiries
SET status = CASE
  WHEN status = 'closed' THEN 2
  WHEN status = 'open' THEN 1
  WHEN status = '2' THEN 2
  ELSE 1
END;

ALTER TABLE enquiries
  MODIFY status TINYINT NOT NULL DEFAULT 1 COMMENT '1=Open, 2=Closed';

UPDATE follow_ups
SET status = CASE
  WHEN status = 'hot' THEN 1
  WHEN status = 'warm' THEN 2
  WHEN status = 'cold' THEN 3
  WHEN status IN ('1', '2', '3') THEN CAST(status AS UNSIGNED)
  ELSE 1
END;

ALTER TABLE follow_ups
  MODIFY status TINYINT NOT NULL COMMENT '1=Hot, 2=Warm, 3=Cold';

UPDATE customer_payment
SET payment_status = CASE
  WHEN payment_status = 'created' THEN 1
  WHEN payment_status = 'pending' THEN 2
  WHEN payment_status = 'paid' THEN 3
  WHEN payment_status = 'failed' THEN 4
  WHEN payment_status IN ('cancelled', 'canceled') THEN 5
  WHEN payment_status = 'expired' THEN 6
  WHEN payment_status IN ('1', '2', '3', '4', '5', '6') THEN CAST(payment_status AS UNSIGNED)
  ELSE 1
END;

ALTER TABLE customer_payment
  MODIFY payment_status TINYINT NOT NULL DEFAULT 1 COMMENT '1=Created, 2=Pending, 3=Paid, 4=Failed, 5=Cancelled, 6=Expired';

UPDATE support_requests
SET status = CASE
  WHEN status = 'closed' THEN 2
  WHEN status = 'open' THEN 1
  WHEN status = '2' THEN 2
  ELSE 1
END;

ALTER TABLE support_requests
  MODIFY status TINYINT NOT NULL DEFAULT 1 COMMENT '1=Open, 2=Closed';
