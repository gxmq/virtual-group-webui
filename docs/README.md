# Virtual Group WebUI v2 (重构版) - 引导总览

这是一套“与 OpenClaw/运行链路分离”的 WebUI 重构方案。目标是用更小的代码量、更清晰的职责边界，在短时间内落地一个可用的“虚拟集团运营系统”。

## 你将得到什么
1. **Public 展示系统（对外）**
   - `/` Tower：品牌展示 + 运行可信度（只读）
   - `/floor/:id/live`：单楼层直播页（只读，可分享）
2. **Ops 运营系统（对内）**
   - `/ops/floor/:id/boss`：楼层 Boss 控制中枢（关键决策唯一入口）
   - `/ops/floor/:id/studio`：楼层工作室（合并 stage + workspace，办公室固定在上半区）
   - `/ops/floor/:id/config`：楼层配置中心（含 CompanyConfig 双阶段发布）
   - `/ops/deliverables`：项目成果中心（跨楼层筛选）
   - `/ops/health`：审计健康中心（跨楼层）
   - `/ops/settings`：全局配置中心（存储/S3-R2 等）

## 与 OpenClaw 的边界（核心）
WebUI v2 **不直接运行 agent**，也不要求与 OpenClaw 同进程/同仓库。
- WebUI 负责：项目管理、配置、可视化、审计、产物链接、运维看板。
- OpenClaw/Workers 负责：执行、调度、写 DB（missions/steps/events/memory...）。
- 连接方式：**优先 DB 作为事实源**；可选通过 API/CLI 适配层控制 OpenClaw（后续再做）。

## 文档目录
1. `docs/v2/01-source-of-truth.md`：原项目事实源（表、worker、关键文件）
2. `docs/v2/02-product-scope.md`：MVP/取舍/不做清单
3. `docs/v2/03-ia-routes.md`：页面蓝图与路由职责（B 优化版落地）
4. `docs/v2/04-data-and-apis.md`：数据模型与 API 契约（与 OpenClaw 分离）
5. `docs/v2/05-project-management-model.md`：项目管理制度（你 + ai们 + 产品测试）
6. `docs/v2/06-build-plan.md`：从零重建实施顺序（按最小可上线）

