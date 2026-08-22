-- Auth schema, Postgres flavour (Neon / Supabase / Vercel Postgres).
--
-- Differences from the SQLite original in schema.sql:
--   * Millisecond epoch timestamps are BIGINT, not INTEGER. Date.now() exceeds
--     the 2^31 signed INTEGER ceiling, so INTEGER would overflow on insert.
--   * Flags are real BOOLEANs rather than 0/1 INTEGERs.
--   * Index creation is IF NOT EXISTS so re-running this file is a no-op.
--
-- Apply once per environment with:  npm run db:migrate

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email_hash TEXT NOT NULL UNIQUE,
  email_enc TEXT NOT NULL,
  phone_enc TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Guest','Buyer','Seller','Agent','Admin')) DEFAULT 'Buyer',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret_enc TEXT,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until BIGINT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users(email_hash);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at BIGINT NOT NULL,
  revoked_at BIGINT,
  user_agent TEXT,
  ip TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS auth_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  detail TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON auth_events(event_type);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  expires_at BIGINT NOT NULL,
  used_at BIGINT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token_hash ON verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at);

-- ---------------------------------------------------------------------------
-- 1. Products (Property Listings)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  seller_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  price_lakhs NUMERIC(10, 2) NOT NULL,
  area_sqft NUMERIC(10, 2),
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  age_years INTEGER DEFAULT 0,
  parking INTEGER DEFAULT 1,
  floor INTEGER DEFAULT 1,
  total_floors INTEGER DEFAULT 1,
  furnished TEXT CHECK (furnished IN ('Unfurnished', 'Semi-Furnished', 'Fully-Furnished')) DEFAULT 'Semi-Furnished',
  status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Sold', 'Rented')) DEFAULT 'Approved',
  is_featured BOOLEAN DEFAULT FALSE,
  images JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  nearby_facilities JSONB DEFAULT '{}'::jsonb,
  ai_metrics JSONB DEFAULT '{}'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_seller_id ON properties(seller_id);
CREATE INDEX IF NOT EXISTS idx_properties_price_lakhs ON properties(price_lakhs);

-- ---------------------------------------------------------------------------
-- 2. Orders (Bookings, Token Advances, Property Purchases)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('Property_Purchase', 'Site_Visit', 'Token_Booking', 'Service_Fee', 'Subscription')) DEFAULT 'Token_Booking',
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled', 'Refunded')) DEFAULT 'Pending',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  scheduled_date BIGINT,
  notes TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_property_id ON orders(property_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ---------------------------------------------------------------------------
-- 3. Payment Records (Transactions & Receipts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_ref TEXT UNIQUE NOT NULL,
  gateway TEXT NOT NULL CHECK (gateway IN ('Stripe', 'Razorpay', 'PayPal', 'UPI', 'Bank_Transfer', 'Manual')) DEFAULT 'Razorpay',
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('Initiated', 'Success', 'Failed', 'Pending', 'Refunded')) DEFAULT 'Pending',
  gateway_response JSONB DEFAULT '{}'::jsonb,
  paid_at BIGINT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payment_records(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payment_records(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_records(status);

-- ---------------------------------------------------------------------------
-- 4. Messages & Conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  last_message_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ---------------------------------------------------------------------------
-- 5. Blog Posts & Market Insights
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  published_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);

