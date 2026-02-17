# v2 重构：产品范围（MVP 与取舍）

目标：保持“原闭环语义不变”，用更小的 WebUI 实现可运营的项目管理与可视化。

## 1. MVP 必做（上线即有价值）
1. Public
- Tower 首页：6 层状态卡片 + 健康分 + 最近事件/产物（只读）
- 单楼层 Live：只读舞台 + 事件流（可分享）

2. Ops
- 楼层 Boss 控制中枢：项目发布、提案审核、执行控制、Inbox（待你决策）
- 楼层 Studio：像素办公室固定 + 下方三模式（项目/运营/资产）
- 楼层 Config：Agent/Trigger/Policy/Scheduler/System + CompanyConfig 双阶段发布（保存草稿/应用生效）
- Deliverables：跨楼层成果中心（file/code/site/log + 部署记录 + 反查）
- Health：跨楼层健康矩阵 + 审计日志
- Settings：全局设置（存储 S3/R2、管理令牌、默认策略）

## 2. 明确不做（第一期舍弃，避免拖慢）
1. 不做 OpenClaw 内部任务编排重写（WebUI 不接管 worker）
2. 不做复杂权限系统（先用 ADMIN_TOKEN，后续再接 Supabase Auth/RBAC）
3. 不做“自动化部署流水线”全套（先以成果 URL/仓库链接为主，自动部署后续再接）
4. 不做“多楼层多 DB 全隔离”一次到位（先混合模式：演示楼层独立，其余共享或默认）
5. 不做“全量文件在线 IDE”（先预览/下载/外链；IDE 后续再考虑）

## 3. v2 与 OpenClaw 的最小集成策略（强约束）
1. WebUI 读取的事实源：
- 运行态：`ops_*` 表（missions/steps/events/memory/relationships/trigger/policy）
- 配置态：control-plane（楼层 registry + drafts + storage settings + audit）

2. WebUI 写入的动作：
- Boss 下达任务：写 proposal 或调用现有 API 写 proposal（保持 proposal-service 语义）
- 发起会议：写 roundtable/meeting queue（保持既有队列语义）
- 配置修改：仅写 control-plane 或 floor config 表（通过 CompanyConfig 双阶段发布）

3. 不做的写入：
- 不直接改 worker 执行逻辑
- 不在 WebUI 中执行 LLM 任务（避免成本与不稳定）

## 4. 成功标准（上线验收）
1. 你在 `/ops/floor/:id/boss` 能完成：发布项目 -> 审核提案 -> 下发任务链 -> 看到任务推进
2. `/ops/floor/:id/studio` 一直可见办公室，上下切换不卡顿
3. 交付中心能一键打开 Preview/Repo/Download，并能反查来源任务/指令
4. 任何失败都能定位：是 DB 不通、Runner 不通、还是数据为空
5. 不影响 OpenClaw 现有 cron/worker：UI 挂了系统照常跑

