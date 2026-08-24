-- BizOne ERP PostgreSQL foundation + SaaS monetization schema.
-- Free is permanent. There is no automatic trial.

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','expired','deleted')),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','locked','pending')),
  data_scope TEXT NOT NULL DEFAULT 'tenant',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret_encrypted TEXT,
  recovery_code_hashes JSONB NOT NULL DEFAULT '[]'::jsonb,
  force_password_change BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_username_unique UNIQUE (username)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx ON users (phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'VND',
  billing_period_months INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 1000,
  max_orders_per_month INTEGER NOT NULL DEFAULT 1000,
  ads_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES plans(code),
  status TEXT NOT NULL CHECK (status IN ('active','expired','cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  max_users INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS subscriptions_tenant_idx ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS subscriptions_expiry_idx ON subscriptions(expires_at);

CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  orders_created INTEGER NOT NULL DEFAULT 0,
  products_count INTEGER NOT NULL DEFAULT 0,
  rewarded_orders_used INTEGER NOT NULL DEFAULT 0,
  ad_impressions INTEGER NOT NULL DEFAULT 0,
  ad_clicks INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, period_start)
);
CREATE INDEX IF NOT EXISTS usage_counters_period_idx ON usage_counters(tenant_id, period_start DESC);

CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video','html')),
  cta_label TEXT NOT NULL DEFAULT 'Xem ưu đãi',
  affiliate_url TEXT,
  placement TEXT NOT NULL DEFAULT 'module_inline',
  target_plan TEXT NOT NULL DEFAULT 'FREE',
  frequency_hours INTEGER NOT NULL DEFAULT 4 CHECK (frequency_hours > 0),
  reward_orders INTEGER NOT NULL DEFAULT 5 CHECK (reward_orders >= 0),
  rewarded_daily_limit INTEGER NOT NULL DEFAULT 6 CHECK (rewarded_daily_limit > 0),
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS advertisements_active_idx ON advertisements(active, target_plan, priority DESC);

CREATE TABLE IF NOT EXISTS ad_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','click')),
  placement TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ad_events_tenant_idx ON ad_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_events_ad_idx ON ad_events(ad_id, event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS ad_reward_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  reward_orders INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ad_reward_events_tenant_idx ON ad_reward_events(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_limit_requests (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_users INTEGER NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_limit_requests_status_idx ON user_limit_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_code TEXT NOT NULL REFERENCES plans(code),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  reference TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payment_requests_status_idx ON payment_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('password_reset','email_verification','phone_verification','login_2fa')),
  channel TEXT NOT NULL CHECK (channel IN ('email','sms')),
  destination_masked TEXT,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS otp_user_purpose_idx ON otp_codes(user_id, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS','FAILED','WARNING')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_idx ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tenant_registrations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  registration_code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  tax_code TEXT,
  representative TEXT,
  address TEXT,
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL','APPROVED','REJECTED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tenant_registrations_status_idx ON tenant_registrations(status, created_at DESC);

INSERT INTO plans (code,name,description,price_amount,currency,billing_period_months,max_users,max_products,max_orders_per_month,ads_enabled,features,sort_order,active)
VALUES
('FREE','Free','Miễn phí vĩnh viễn; có quảng cáo và giới hạn nghiệp vụ.',0,'VND',0,1,1000,1000,TRUE,'{"crm":false,"marketing":false,"kpi":false,"aiRecommendations":false,"advancedReports":false}',10,TRUE),
('PREMIUM','Premium','Không quảng cáo, mở tính năng nâng cao và tối đa 3 user.',0,'VND',1,3,0,0,FALSE,'{"crm":true,"marketing":true,"kpi":true,"aiRecommendations":true,"advancedReports":true}',20,TRUE)
ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,max_users=EXCLUDED.max_users,max_products=EXCLUDED.max_products,max_orders_per_month=EXCLUDED.max_orders_per_month,ads_enabled=EXCLUDED.ads_enabled,features=EXCLUDED.features,active=EXCLUDED.active,updated_at=NOW();

ALTER TABLE subscriptions ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE tenant_registrations ALTER COLUMN plan_code SET DEFAULT 'FREE';
UPDATE subscriptions SET plan_code='FREE',status='active',expires_at=NULL,max_users=1,updated_at=NOW() WHERE plan_code IN ('TRIAL_7_DAYS','TRIAL_7D') OR status='trial';
UPDATE tenant_registrations SET plan_code='FREE' WHERE plan_code IN ('TRIAL_7_DAYS','TRIAL_7D');

-- Backward compatibility: old registration/tenant creation code may still submit trial values.
-- Normalize those writes to the permanent FREE plan before FK/check validation.
CREATE OR REPLACE FUNCTION bizone_normalize_subscription_plan() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.plan_code IN ('TRIAL_7_DAYS','TRIAL_7D') OR NEW.status = 'trial' THEN
    NEW.plan_code := 'FREE';
    NEW.status := 'active';
    NEW.expires_at := NULL;
    NEW.max_users := 1;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_bizone_normalize_subscription_plan ON subscriptions;
CREATE TRIGGER trg_bizone_normalize_subscription_plan BEFORE INSERT OR UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION bizone_normalize_subscription_plan();

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
