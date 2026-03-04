-- =============================================================
-- PAYMENT TRANSACTIONS TABLE
-- Tracks Midtrans QRIS payments for subscription renewal
-- =============================================================

CREATE TYPE payment_tx_status AS ENUM ('pending', 'settlement', 'expire', 'cancel', 'deny', 'refund');

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  gross_amount INTEGER NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'qris',
  status payment_tx_status NOT NULL DEFAULT 'pending',
  midtrans_transaction_id TEXT,
  qris_url TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_tx_student ON payment_transactions(student_id);
CREATE INDEX idx_payment_tx_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_tx_status ON payment_transactions(status);

-- RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Students can view their own transactions
CREATE POLICY "Students can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = student_id);

-- Students can create their own transactions
CREATE POLICY "Students can create own transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Only service role (webhook) can update transactions
-- This is handled via SUPABASE_SERVICE_ROLE_KEY in the webhook API
CREATE POLICY "Admin can manage all transactions"
  ON payment_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
