# v2 重构：信息架构与路由职责（B 优化版落地）

本文件把“每个页面负责什么”写死，避免重构后继续越改越乱。

## 1. 路由总表

### Public（对外）
1. `/`
- Tower：品牌展示 + 运行可信度（只读）
2. `/floor/:id/live`
- 单楼层直播页：办公室 + 事件流（只读，可分享）

### Ops（对内）
1. `/ops/floor/:id/boss`
- Boss 控制中枢：发布/审核/执行/Inbox（关键决策唯一入口）
2. `/ops/floor/:id/studio`
- 楼层工作室：办公室固定 + 下方三模式（项目/运营/资产）
3. `/ops/floor/:id/config`
- 楼层配置中心：Agent/Trigger/Policy/Scheduler/System + CompanyConfig 双阶段发布
4. `/ops/deliverables`
- 项目成果中心：跨楼层筛选 + 交付包/部署记录
5. `/ops/health`
- 审计健康中心：跨楼层健康矩阵 + 告警升级 + 审计日志
6. `/ops/settings`
- 全局配置中心：存储/S3-R2、默认策略、系统运行参数

## 2. 页面布局约束（强制）

### 2.1 Studio 固定办公室
- 上半区办公室永远存在，切换仅发生在下半区内容区域。
- 下半区必须是“模式切换”，不是把所有表格堆一起。

### 2.2 Boss 页面三栏（必须）
- 左：Inbox（待你决策）
- 中：项目全景（当前楼层/跨楼层）
- 右：即时指令（任务/会议/紧急动作/策略）

## 3. Studio 三模式细化

### 模式 1：项目视图（Project）
目标：项目管理系统，而不是事件表格。
- 项目概览：目标、范围、当前阶段、风险
- 里程碑：时间线
- 看板：待办/进行中/测试中/待交付/已交付
- 提案区：最新提案摘要 + 审核入口

### 模式 2：运营视图（Ops）
目标：运行态可观察、可介入。
- Missions（running/failed）
- Steps（queued/running）
- Events（实时流，带过滤）
- Meetings（roundtable/meeting）
- 快捷动作：发任务/发会议/刷新

### 模式 3：资产视图（Assets）
目标：让“记忆/关系/成果”成为资产而不是日志。
- 记忆：可筛选、可检索、可追溯
- 关系：亲密度矩阵 + 漂移记录
- 成果：file/code/site/log + 预览/仓库/下载
- 交付包：Promote/标记已交付

## 4. Config 页面分域
1. CompanyConfig（双阶段）
- 保存草稿：不影响运行
- 应用生效：写入 registry，仅允许字段，写审计
2. Agent
3. Trigger
4. Policy
5. Scheduler
6. System settings（JSON 常量）

