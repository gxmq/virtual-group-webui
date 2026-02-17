-- =====================================================
-- Virtual Group v2 - 空库一键初始化 SQL
-- 在 Supabase SQL Editor 中执行
-- =====================================================

-- =====================================================
-- 第一部分：Control Plane Schema（控制面）
-- =====================================================

-- 1. 楼层注册表
CREATE TABLE IF NOT EXISTS ops_floor_registry (
  id TEXT PRIMARY KEY,
  floor_no INT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'empty' 
    CHECK (status IN ('empty','configured','provisioning','running','warning','stopped','archived')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  health_score INT NOT NULL DEFAULT 0,
  supabase_url TEXT,
  supabase_anon_key TEXT,
  supabase_service_role_key TEXT,
  database_url TEXT,
  runner_endpoint TEXT,
  connection_status TEXT DEFAULT 'disconnected',
  last_heartbeat_at TIMESTAMPTZ,
  last_error TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  default_locale TEXT DEFAULT 'zh-CN',
  tags TEXT[] DEFAULT '{}',
  floor_group TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 配置草稿表
CREATE TABLE IF NOT EXISTS ops_floor_config_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT NOT NULL REFERENCES ops_floor_registry(id),
  config_type TEXT NOT NULL,
  config_key TEXT NOT NULL,
  draft_data JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_review','rejected','applied')),
  created_by TEXT,
  reviewed_by TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(floor_id, config_type, config_key)
);

-- 3. 凭证管理表
CREATE TABLE IF NOT EXISTS ops_floor_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT NOT NULL REFERENCES ops_floor_registry(id),
  credential_type TEXT NOT NULL,
  credential_key TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(floor_id, credential_type, credential_key)
);

-- 4. 健康快照表
CREATE TABLE IF NOT EXISTS ops_floor_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT NOT NULL REFERENCES ops_floor_registry(id),
  missions_running INT DEFAULT 0,
  missions_succeeded_24h INT DEFAULT 0,
  missions_failed_24h INT DEFAULT 0,
  steps_queued INT DEFAULT 0,
  steps_running INT DEFAULT 0,
  online_agents INT DEFAULT 0,
  total_agents INT DEFAULT 0,
  queue_depth INT DEFAULT 0,
  proposal_queue_depth INT DEFAULT 0,
  health_score INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  captured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_floor_time ON ops_floor_health_snapshots(floor_id, captured_at DESC);

-- 5. 存储设置表
CREATE TABLE IF NOT EXISTS ops_storage_settings (
  scope_id TEXT PRIMARY KEY,
  floor_id TEXT REFERENCES ops_floor_registry(id),
  provider TEXT NOT NULL DEFAULT 'r2' CHECK (provider IN ('r2','s3','local')),
  endpoint TEXT NOT NULL,
  region TEXT DEFAULT 'auto',
  bucket TEXT NOT NULL,
  access_key_id TEXT NOT NULL,
  secret_access_key TEXT NOT NULL,
  public_base_url TEXT,
  force_path_style BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 控制面审计日志
CREATE TABLE IF NOT EXISTS ops_config_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  actor_email TEXT,
  source_ip TEXT,
  source TEXT DEFAULT 'webui',
  domain TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  action TEXT NOT NULL,
  before_value JSONB,
  after_value JSONB,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_domain_entity ON ops_config_audit_logs(domain, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON ops_config_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON ops_config_audit_logs(created_at DESC);

-- 7. 控制面 RLS
ALTER TABLE ops_floor_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_floor_config_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_floor_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_floor_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_storage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_config_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "service_role_full_access" ON ops_floor_registry FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_floor_config_drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_floor_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_floor_health_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_storage_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_config_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 8. 初始化 6 个楼层
INSERT INTO ops_floor_registry (id, floor_no, display_name, company_name, status, enabled, floor_group)
VALUES
  ('1', 1, 'Floor 1', 'Virtual Company 1', 'empty', false, 'demo'),
  ('2', 2, 'Floor 2', 'Virtual Company 2', 'empty', false, 'demo'),
  ('3', 3, 'Floor 3', 'Virtual Company 3', 'empty', false, 'demo'),
  ('4', 4, 'Floor 4', 'Virtual Company 4', 'empty', false, 'production'),
  ('5', 5, 'Floor 5', 'Virtual Company 5', 'empty', false, 'production'),
  ('6', 6, 'Floor 6', 'Virtual Company 6', 'empty', false, 'production')
ON CONFLICT (id) DO NOTHING;

-- 9. 创建 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_floor_registry_updated_at ON ops_floor_registry;
CREATE TRIGGER update_floor_registry_updated_at
  BEFORE UPDATE ON ops_floor_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_floor_config_drafts_updated_at ON ops_floor_config_drafts;
CREATE TRIGGER update_floor_config_drafts_updated_at
  BEFORE UPDATE ON ops_floor_config_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_floor_credentials_updated_at ON ops_floor_credentials;
CREATE TRIGGER update_floor_credentials_updated_at
  BEFORE UPDATE ON ops_floor_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_storage_settings_updated_at ON ops_storage_settings;
CREATE TRIGGER update_storage_settings_updated_at
  BEFORE UPDATE ON ops_storage_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 10. 初始化全局存储设置
INSERT INTO ops_storage_settings (scope_id, provider, endpoint, region, bucket, access_key_id, secret_access_key, is_default)
VALUES ('global', 'r2', 'https://xxx.r2.cloudflarestorage.com', 'auto', 'vg-assets', 'xxx', 'xxx', true)
ON CONFLICT (scope_id) DO NOTHING;

SELECT 'Control Plane schema ready!' AS status;
