-- Profiles table: one row per user, stores tier and Stripe IDs
CREATE TABLE profiles (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier        text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid', 'dev')),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: users can only read their own profile
-- Tier can ONLY be updated via the service role (webhook) — never by the user directly
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Auto-create a free profile whenever a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
