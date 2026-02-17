表（WebUI v2 自己维护，不要求 OpenClaw 参与）：
- `ops_floor_registry`：楼层注册与连接信息（密钥加密/掩码显示）
- `ops_floor_config_drafts`：楼层配置草稿（保存不生效，应用才生效）
- `ops_storage_settings`：S3/R2 全局与楼层覆盖
- `ops_config_audit_logs`：控制面审计日志
- `ops_floor_health_snapshots`：健康快照（可选：由 WebUI 定时采集）

## 3. API 契约（v2 最小集）

### Public
1. `GET /api/tower/floors`
- 返回 6 层状态、健康、连通性
2. `GET /api/floor/:id/live`
- 只读数据：agents/missions/steps/events/health

### Ops - Studio（读多）
1. `GET /api/floor/:id/data`
- 运行态快照（stage/workspace 统一）
2. `GET /api/floor/:id/artifacts`
3. `GET /api/floor/:id/deployments`

### Ops - Boss（写少但关键）
1. `POST /api/floor/:id/tasks/create`
- 语义：创建提案/任务入口（必须保持 proposal-service 的 gate 语义）
2. `POST /api/floor/:id/meetings/start`
- 语义：写入会议/对话队列（保持原队列语义）

### Ops - Config（强约束 + 审计）
1. `GET /api/floor/:id/admin/company-config`
2. `PATCH /api/floor/:id/admin/company-config/draft`（需要 `x-admin-token`）
3. `POST /api/floor/:id/admin/company-config/apply`（需要 `x-admin-token`）
4. `GET/PATCH` agents/triggers/policies/scheduler/system-settings（需要 token）

## 4. 与 OpenClaw 的可选控制（第二期）
如果需要“通过 WebUI 控制 OpenClaw”，做一层 Adapter：
1. `SchedulerAdapter`：生成变更单/手动应用/验证
2. `RunnerAdapter`：触发一次 heartbeat、触发某个 worker、查看 worker 状态

第一期建议全部手动（Manual Adapter），避免未知 API/CLI 带来的不确定性。

