-- =====================================================
-- Virtual Group v2 - Floor Database Schema
-- 每个楼层独立部署
-- 在 Supabase SQL Editor 中执行
-- =====================================================

-- =====================
-- 1. 核心 4 表
-- =====================

-- 提案表
CREATE TABLE IF NOT EXISTS ops_mission_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  proposed_steps JSONB DEFAULT '[]',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 任务表
CREATE TABLE IF NOT EXISTS ops_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT CHECK (status IN ('approved', 'running', 'succeeded', 'failed')) DEFAULT 'approved',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 执行步骤表
CREATE TABLE IF NOT EXISTS ops_mission_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES ops_missions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  payload JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('queued', 'running', 'succeeded', 'failed')) DEFAULT 'queued',
  reserved_by TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_steps_queue_priority ON ops_mission_steps (status, priority DESC, created_at ASC);

-- 事件流表
CREATE TABLE IF NOT EXISTS ops_agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 2. 策略表
-- =====================

CREATE TABLE IF NOT EXISTS ops_policy (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 3. Agent 表
-- =====================

CREATE TABLE IF NOT EXISTS ops_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  voice_config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 4. 记忆表
-- =====================

CREATE TABLE IF NOT EXISTS ops_agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('insight', 'pattern', 'strategy', 'preference', 'lesson')),
  content TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.60,
  tags TEXT[] DEFAULT '{}',
  source_trace_id TEXT,
  superseded_by UUID REFERENCES ops_agent_memory(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_agent ON ops_agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_type ON ops_agent_memory(type);

-- =====================
-- 5. 关系表
-- =====================

CREATE TABLE IF NOT EXISTS ops_agent_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_a TEXT NOT NULL,
  agent_b TEXT NOT NULL,
  affinity NUMERIC(3,2) DEFAULT 0.50 CHECK (affinity >= 0.10 AND affinity <= 0.95),
  total_interactions INTEGER DEFAULT 0,
  positive_interactions INTEGER DEFAULT 0,
  negative_interactions INTEGER DEFAULT 0,
  drift_log JSONB DEFAULT '[]',
  UNIQUE(agent_a, agent_b)
);

-- =====================
-- 6. 触发规则表
-- =====================

CREATE TABLE IF NOT EXISTS ops_trigger_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  action_config JSONB DEFAULT '{}',
  cooldown_minutes INTEGER DEFAULT 60,
  enabled BOOLEAN DEFAULT true,
  fire_count INTEGER DEFAULT 0,
  last_fired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 7. 反应队列
-- =====================

CREATE TABLE IF NOT EXISTS ops  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_agent_reactions (
_agent_id TEXT NOT NULL,
  target_agent_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  probability REAL DEFAULT 1.0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 8. 对话队列
-- =====================

CREATE TABLE IF NOT EXISTS ops_roundtable_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format TEXT NOT NULL CHECK (format IN ('standup', 'debate', 'watercooler')),
  participants TEXT[] NOT NULL,
  topic TEXT,
  max_turns INTEGER DEFAULT 8,
  temperature REAL DEFAULT 0.7,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 9. 行动记录
-- =====================

CREATE TABLE IF NOT EXISTS ops_action_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 10. 推文指标
-- =====================

CREATE TABLE IF NOT EXISTS ops_tweet_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id TEXT,
  content TEXT,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,4) DEFAULT 0,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 11. 主动性队列
-- =====================

CREATE TABLE IF NOT EXISTS ops_initiative_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  proposal JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 12. 调度配置
-- =====================

CREATE TABLE IF NOT EXISTS ops_scheduler_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  schedule TEXT NOT NULL,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  enabled BOOLEAN DEFAULT true,
  mode TEXT DEFAULT 'manual' CHECK (mode IN ('manual', 'api-cli')),
  apply_status TEXT DEFAULT 'pending_apply' CHECK (apply_status IN ('pending_apply', 'applied', 'failed')),
  pending_plan JSONB DEFAULT '{}',
  last_apply_result JSONB DEFAULT '{}',
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 13. 系统设置
-- =====================

CREATE TABLE IF NOT EXISTS ops_system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  value_type TEXT DEFAULT 'json',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 14. 会议会话（扩展）
-- =====================

CREATE TABLE IF NOT EXISTS ops_meeting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT,
  topic TEXT,
  participants TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'running',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 15. Boss 命令
-- =====================

CREATE TABLE IF NOT EXISTS ops_boss_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT,
  command_type TEXT,
  content TEXT,
  input_mode TEXT DEFAULT 'text',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 16. 产物包
-- =====================

CREATE TABLE IF NOT EXISTS ops_artifact_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT,
  mission_id UUID,
  title TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 17. 产物
-- =====================

CREATE TABLE IF NOT EXISTS ops_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT,
  bundle_id UUID,
  mission_id UUID,
  kind TEXT,
  name TEXT,
  storage_key TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  repo_url TEXT,
  commit_sha TEXT,
  preview_url TEXT,
  production_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- 18. 部署记录
-- =====================

CREATE TABLE IF NOT EXISTS ops_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT,
  artifact_bundle_id UUID,
  preview_url TEXT,
  production_url TEXT,
  status TEXT DEFAULT 'queued',
  duration_ms INT,
  logs_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- RLS 启用
-- =====================

ALTER TABLE ops_mission_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_mission_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_agent_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_trigger_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_agent_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_roundtable_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_action_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_tweet_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_initiative_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_scheduler_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_boss_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_artifact_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_deployments ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "service_role_full_access" ON ops_mission_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_mission_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_agent_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_policy FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_agent_memory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_agent_relationships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_trigger_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_agent_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_roundtable_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_action_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_tweet_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_initiative_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_scheduler_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_system_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_meeting_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_boss_commands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_artifact_bundles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_artifacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON ops_deployments FOR ALL USING (true) WITH CHECK (true);

-- =====================
-- 初始数据
-- =====================

INSERT INTO ops_policy (key, value) VALUES 
  ('auto_approve', '{"enabled": true, "allowed_step_kinds": ["draft_tweet", "crawl", "analyze", "write_content"]}'),
  ('x_daily_quota', '{"limit": 5}'),
  ('content_policy', '{"enabled": true, "max_drafts_per_day": 8}'),
  ('roundtable_policy', '{"enabled": true, "max_daily_conversations": 5}'),
  ('memory_influence_policy', '{"enabled": true, "probability": 0.3}'),
  ('relationship_drift_policy', '{"enabled": true, "max_drift": 0.03}'),
  ('initiative_policy', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ops_agents (id, name, voice_config) VALUES
  ('boss', 'Boss', '{"tone": "direct, results-oriented, slightly impatient", "quirk": "Always asks for deadlines and progress updates"}'),
  ('analyst', 'Analyst', '{"tone": "measured, data-driven, cautious", "quirk": "Cites numbers before giving opinions"}'),
  ('hustler', 'Hustler', '{"tone": "high-energy, action-biased", "quirk": "Wants to try it now for everything"}'),
  ('writer', 'Writer', '{"tone": "emotional, narrative-focused", "quirk": "Turns everything into a story"}'),
  ('wildcard', 'Wildcard', '{"tone": "intuitive, lateral thinker", "quirk": "Proposes bold ideas"}'),
  ('observer', 'Observer', '{"tone": "analytical, systematic", "quirk": "Notices patterns others miss"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ops_trigger_rules (name, trigger_event, conditions, action_config, cooldown_minutes, enabled) VALUES
  ('Tweet High Engagement', 'tweet_high_engagement', '{"engagement_rate_min": 0.05}', '{"target_agent": "hustler"}', 120, true),
  ('Mission Failed', 'mission_failed', '{}', '{"target_agent": "boss"}', 60, true),
  ('Content Published', 'content_published', '{}', '{"target_agent": "observer"}', 30, true),
  ('Proactive Scan Signals', 'proactive_scan_signals', '{}', '{"target_agent": "hustler", "skip_probability": 0.10}', 180, true),
  ('Proactive Draft Tweet', 'proactive_draft_tweet', '{}', '{"target_agent": "wildcard", "skip_probability": 0.15}', 240, true),
  ('Proactive Research', 'proactive_research', '{}', '{"target_agent": "analyst", "skip_probability": 0.10}', 360, true)
ON CONFLICT DO NOTHING;

INSERT INTO ops_scheduler_configs (job_name, schedule, timezone, enabled, mode, apply_status) VALUES
  ('heartbeat', '*/5 * * * *', 'Asia/Shanghai', true, 'manual', 'pending_apply'),
  ('step-worker', '*/5 * * * *', 'Asia/Shanghai', true, 'manual', 'pending_apply'),
  ('roundtable', '0 9,14,18,21 * * *', 'Asia/Shanghai', true, 'manual', 'pending_apply')
ON CONFLICT (job_name) DO NOTHING;

INSERT INTO ops_system_settings (key, value, value_type, description) VALUES
  ('worker.step.poll_interval_ms', '15000', 'number', 'Step worker polling interval'),
  ('worker.step.max_steps_per_trigger', '5', 'number', 'Max steps per trigger'),
  ('worker.heartbeat.trigger_budget_ms', '4000', 'number', 'Heartbeat trigger budget')
ON CONFLICT (key) DO NOTHING;

-- =====================
-- 索引
-- =====================

CREATE INDEX IF NOT EXISTS idx_proposals_status ON ops_mission_proposals(status);
CREATE INDEX IF NOT EXISTS idx_missions_status ON ops_missions(status);
CREATE INDEX IF NOT EXISTS idx_steps_mission ON ops_mission_steps(mission_id);
CREATE INDEX IF NOT EXISTS idx_steps_status ON ops_mission_steps(status);
CREATE INDEX IF NOT EXISTS idx_events_agent ON ops_agent_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON ops_agent_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roundtable_status ON ops_roundtable_queue(status);

-- =====================
-- 触发器
-- =====================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_steps_updated_at ON ops_mission_steps;
CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON ops_mission_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_agents_updated_at ON ops_agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON ops_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_trigger_rules_updated_at ON ops_trigger_rules;
CREATE TRIGGER update_trigger_rules_updated_at BEFORE UPDATE ON ops_trigger_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_roundtable_queue_updated_at ON ops_roundtable_queue;
CREATE TRIGGER update_roundtable_queue_updated_at BEFORE UPDATE ON ops_roundtable_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_scheduler_configs_updated_at ON ops_scheduler_configs;
CREATE TRIGGER update_scheduler_configs_updated_at BEFORE UPDATE ON ops_scheduler_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

SELECT 'Floor schema ready!';
