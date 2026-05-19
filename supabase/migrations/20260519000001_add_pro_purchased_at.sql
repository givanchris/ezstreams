ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_purchased_at timestamptz DEFAULT NULL;
