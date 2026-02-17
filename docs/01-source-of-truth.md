# v2 重构：原项目事实源（Source of Truth）

本文件用于“把原项目读透”，避免重构时误解语义。

> 说明：我们尝试从 GitHub 拉取 `gxmq/6.Ai-Agent` 作为上游对照，但当前环境访问 GitHub 出现网络失败（HTTP2 framing / connect timeout）。因此本阶段以你工作区内的原始实现为事实源：
>
> - `/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/workers/*`
> - `/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/lib/*`
> - `/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/database-setup.sql`
> - `/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/SYSTEM_GUIDE.md`
> - `/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/TUTORIAL.md`
## 1. 核心闭环（必须保持语义不变）
闭环骨架：Proposal -> Mission -> Step -> Event -> (Trigger/Reaction) -> Proposal...

关键表（见 `database-setup.sql`）：
1. `ops_mission_proposals`：提案（pending/accepted/rejected）
2. `ops_missions`：任务（approved/running/succeeded/failed）
3. `ops_mission_steps`：执行步骤（queued/running/succeeded/failed）
4. `ops_agent_events`：事件流（stage/workspace 的主信息源）

策略/配置表：
1. `ops_policy`：策略与配额（auto_approve / x_daily_quota / roundtable_policy 等）
2. `ops_agents`：agent persona 与启停
3. `ops_trigger_rules`：触发器规则（reactive/proactive）
4. `ops_scheduler_configs`：调度期望（manual adapter）
5. `ops_system_settings`：系统常量（JSON）

记忆/关系/对话：
1. `ops_agent_memory`：结构化记忆
2. `ops_agent_relationships`：亲密度
3. `ops_roundtable_queue`：对话队列
4. `ops_agent_reactions`：反应队列

## 2. Worker 事实源（原逻辑入口）

### 2.1 Heartbeat（系统脉搏）
文件：`/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/workers/heartbeat.js`

它每 5 分钟运行一次（由 OpenClaw 或 cron 调度），核心职责包含：
1. 评估触发器（`evaluateTriggers()`）：读 `ops_trigger_rules`，按 cooldown/budget 触发，调用 `createProposal()`
2. 处理反应队列（`processReactionQueue()`）：读 `ops_agent_reactions`，转提案
3. 提升洞察为长期记忆（`promoteInsights()`）：写 `ops_agent_memory` + 写事件 `ops_agent_events`
4. 结果学习（learnFromOutcomes 类似逻辑）
5. 恢复卡住的 steps / 对话（stale recovery）
6. 写 action run（`ops_action_runs`）

v2 要求：**WebUI 不改变这些函数的语义**，最多只做“可视化与配置通路”。

### 2.2 Proposal Service（统一入口 + Cap Gates）
文件：`/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/lib/proposal-service.js`

关键点：
1. 所有提案都应走统一入口（避免绕过配额/策略）
2. Cap Gates 应在 proposal entry point 阶段拦截，避免队列堆积
3. auto-approve 由 `ops_policy.auto_approve` 控制

v2 要求：
- Boss 下达任务、触发器触发任务、反应队列触发任务：最终都应走同一入口（通过 DB 写 proposal 或通过 API 进 proposal-service）

### 2.3 Memory Service（结构化记忆）
文件：`/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/lib/memory-service.js`

关键点：
- 5 种记忆类型：insight/pattern/strategy/preference/lesson
- 记忆写入要支持幂等（source_trace_id）
- 记忆影响行为存在概率开关（例如 30%）

v2 要求：
- WebUI 必须把 `ops_agent_memory` 作为“资产层”第一等公民（可检索、可筛选、可追溯来源）

### 2.4 Step Worker / Roundtable Worker
文件：
- `/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/workers/step-worker.js`
- `/Users/gxmq/Documents/Codex/Ai工作系统2.0/AI_Roland/upstream/Ai公司的前后台/workers/roundtable-worker.js`

v2 要求：
- WebUI 不实现执行逻辑，只展示运行态与产物/事件

## 3. 现有文档（可复用但要去耦）
1. `SYSTEM_GUIDE.md`：系统概念 + 配置 + cron 说明
2. `TUTORIAL.md`：新手教程与表说明
3. `DEPLOY_GUIDE.md`：一键部署示例（注意：其中可能含敏感示例，v2 文档需要脱敏）

v2 行动：
- 保留“概念与语义”的描述
- 移除/脱敏任何密钥示例
- 重新编排为“WebUI 与 OpenClaw 分离”的部署与运维流程
