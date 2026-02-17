# v2 多楼层控制面模型设计

## 1. 核心表结构

### 1.1 楼层注册表 (ops_floor_registry)

```sql
CREATE TABLE ops_floor_registry (
  -- 基础标识
  id TEXT PRIMARY KEY,
  floor_no INT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  
  -- 状态机
  status TEXT NOT NULL DEFAULT 'empty' 
    CHECK (status IN ('empty','configured','provisioning','running','warning','stopped','archived')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  health_score INT NOT NULL DEFAULT 0,
  
  -- 连接信息（加密存储）
  supabase_url TEXT,
  supabase_anon_key TEXT,  -- 加密
  supabase_service_role_key TEXT,  -- 加密存储
  database_url TEXT,  -- 加密
  runner_endpoint TEXT,
  
  -- 连接信息掩码（前端显示用，不含密钥）
  connection_status TEXT DEFAULT 'disconnected',
  last_heartbeat_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- 运营信息
  timezone TEXT DEFAULT 'Asia/Shanghai',
  default_locale TEXT DEFAULT 'zh-CN',
  
  -- 标签/分组
  tags TEXT[] DEFAULT '{}',
  floor_group TEXT,  -- 用于分组，如 'demo', 'production'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 配置草稿表 (ops_floor_config_drafts)

```sql
CREATE TABLE ops_floor_config_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT NOT NULL REFERENCES ops_floor_registry(id),
  config_type TEXT NOT NULL,  -- 'company', 'agent', 'trigger', 'policy', 'scheduler', 'system'
  config_key TEXT NOT NULL,  -- 对应配置的唯一标识
  draft_data JSONB NOT NULL,  -- 草稿内容
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_review','rejected','applied')),
  
  created_by TEXT,
  reviewed_by TEXT,
  applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(floor_id, config_type, config_key)
);
```

### 1.3 连接凭证管理 (ops_floor_credentials)

```sql
CREATE TABLE ops_floor_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT NOT NULL REFERENCES ops_floor_registry(id),
  credential_type TEXT NOT NULL,  -- 'supabase', 's3', 'r2', 'api_key', 'webhook'
  credential_key TEXT NOT NULL,  -- 标识名称
  encrypted_value TEXT NOT NULL,  -- AES-256 加密
  salt TEXT NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(floor_id, credential_type, credential_key)
);
```

### 1.4 健康快照 (ops_floor_health_snapshots)

```sql
CREATE TABLE ops_floor_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id TEXT NOT NULL REFERENCES ops_floor_registry(id),
  
  -- 核心指标
  missions_running INT DEFAULT 0,
  missions_succeeded_24h INT DEFAULT 0,
  missions_failed_24h INT DEFAULT 0,
  steps_queued INT DEFAULT 0,
  steps_running INT DEFAULT 0,
  
  -- Agent 状态
  online_agents INT DEFAULT 0,
  total_agents INT DEFAULT 0,
  
  -- 队列深度
  queue_depth INT DEFAULT 0,
  proposal_queue_depth INT DEFAULT 0,
  
  -- 计算得分
  health_score INT DEFAULT 0,
  
  -- 详细数据
  metadata JSONB DEFAULT '{}',
  captured_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_health_floor_time ON ops_floor_health_snapshots(floor_id, captured_at DESC);
```

### 1.5 存储设置 (ops_storage_settings)

```sql
CREATE TABLE ops_storage_settings (
  scope_id TEXT PRIMARY KEY,  -- 'global' 或 'floor_{id}'
  floor_id TEXT REFERENCES ops_floor_registry(id),
  
  provider TEXT NOT NULL DEFAULT 'r2' CHECK (provider IN ('r2','s3','local')),
  endpoint TEXT NOT NULL,
  region TEXT DEFAULT 'auto',
  bucket TEXT NOT NULL,
  access_key_id TEXT NOT NULL,  -- 加密
  secret_access_key TEXT NOT NULL,  -- 加密
  public_base_url TEXT,
  force_path_style BOOLEAN DEFAULT true,
  
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. 状态机设计

### 2.1 楼层状态流转

```
empty → configured → provisioning → running → warning → stopped
                              ↑              ↓
                              ↓             archived
```

| 状态 | 含义 | 可执行操作 |
|------|------|-----------|
| empty | 新建楼层 | 配置连接信息 |
| configured | 已配置，待初始化 | 初始化数据库 |
| provisioning | 初始化中 | 等待 |
| running | 运行中 | 停止/查看 |
| warning | 有异常 | 诊断/停止 |
| stopped | 已停止 | 重启/归档 |
| archived | 已归档 | 恢复 |

### 2.2 草稿发布流程

```
Draft → Pending Review → Rejected (可修改)
              ↓
           Applied (生效)
```

---

## 3. 审计边界

### 3.1 审计日志表 (ops_config_audit_logs)

```sql
CREATE TABLE ops_config_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 操作者
  actor_id TEXT,
  actor_email TEXT,
  source_ip TEXT,
  source TEXT DEFAULT 'webui',  -- 'webui', 'api', 'worker', 'system'
  
  -- 操作范围
  domain TEXT NOT NULL,  -- 'floor', 'config', 'credential', 'storage'
  entity_type TEXT NOT NULL,  -- 'floor_registry', 'config_draft', 'credential'
  entity_id TEXT NOT NULL,
  entity_name TEXT,  -- 用于显示
  
  -- 操作内容
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'apply_draft', 'enable', 'disable'
  before_value JSONB,
  after_value JSONB,
  change_summary TEXT,  -- 变更摘要
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_domain_entity ON ops_config_audit_logs(domain, entity_type, entity_id);
CREATE INDEX idx_audit_actor ON ops_config_audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_created ON ops_config_audit_logs(created_at DESC);
```

### 3.2 审计事件类型

| 事件 | 域 | 说明 |
|------|-----|------|
| floor_created | floor | 新建楼层 |
| floor_updated | floor | 楼层信息更新 |
| floor_enabled | floor | 启用楼层 |
| floor_disabled | floor | 禁用楼层 |
| floor_status_changed | floor | 状态变更 |
| draft_created | config | 创建草稿 |
| draft_applied | config | 应用草稿 |
| draft_rejected | config | 拒绝草稿 |
| credential_created | credential | 新增凭证 |
| credential_rotated | credential | 轮换凭证 |
| credential_deleted | credential | 删除凭证 |
| storage_updated | storage | 存储配置变更 |

---

## 4. API 设计

### 4.1 楼层管理

```
GET    /api/floors                    # 列表（公开）
GET    /api/floors/:id                # 详情
POST   /api/floors                    # 创建
PATCH  /api/floors/:id                # 更新
DELETE /api/floors/:id                 # 删除（软删除）
POST   /api/floors/:id/enable         # 启用
POST   /api/floors/:id/disable        # 禁用
POST   /api/floors/:id/provision      # 初始化
```

### 4.2 草稿管理

```
GET    /api/floors/:id/drafts                    # 草稿列表
GET    /api/floors/:id/drafts/:type/:key         # 草稿详情
POST   /api/floors/:id/drafts                    # 创建草稿
PATCH  /api/floors/:id/drafts/:id                # 更新草稿
DELETE /api/floors/:id/drafts/:id                # 删除草稿
POST   /api/floors/:id/drafts/:id/apply         # 应用草稿
POST   /api/floors/:id/drafts/:id/reject        # 拒绝草稿
```

### 4.3 凭证管理

```
GET    /api/floors/:id/credentials               # 凭证列表（掩码）
POST   /api/floors/:id/credentials               # 添加凭证
PATCH  /api/floors/:id/credentials/:id          # 更新凭证
DELETE /api/floors/:id/credentials/:id           # 删除凭证
POST   /api/floors/:id/credentials/:id/rotate    # 轮换凭证
```

### 4.4 健康与审计

```
GET    /api/floors/:id/health                    # 当前健康状态
GET    /api/floors/:id/health/history            # 健康历史
GET    /api/floors/:id/audit                     # 审计日志
GET    /api/audit                                # 全局审计日志
```

---

## 5. 安全设计

### 5.1 凭证加密

- 使用 AES-256-GCM 加密
- 密钥来自环境变量 `ENCRYPTION_KEY` 或 KMS
- 每次加密生成随机 salt

### 5.2 访问控制

- ADMIN_TOKEN 用于管理操作
- 公开 API 使用 anon_key 验证
- 敏感操作记录审计日志

### 5.3 连接验证

- 配置时测试连接（ping supabase）
- 定期心跳检测
- 失败自动标记 warning 状态
