# WebUI v2 工程指令包

> 本文件是可交给 AI 自动生成 WebUI 的完整指令集

---

## 1. 项目概述

**项目名称**: Virtual Group WebUI v2  
**技术栈**: Next.js 14 + Supabase + Tailwind CSS  
**目标**: 虚拟集团运营管理系统（MVP）

### 1.1 核心约束

1. **不接管 worker** - WebUI 只读/可视化，不执行 LLM 任务
2. **DB 为事实源** - 所有数据来自 Supabase，不自己维护状态
3. **双阶段发布** - 配置先保存草稿，应用才生效
4. **ADMIN_TOKEN 认证** - 简化版认证，后续再接 Supabase Auth

---

## 2. 目录结构

```
virtual-group-webui/
├── src/
│   ├── app/
│   │   ├── layout.js              # 全局布局
│   │   ├── page.js                # Tower 首页
│   │   ├── floor/
│   │   │   └── [id]/
│   │   │       ├── live/
│   │   │       │   └── page.js    # 楼层直播页
│   │   │       └── ops/
│   │   │           ├── floor/
│   │   │           │   └── [id]/
│   │   │           │       ├── boss/
│   │   │           │       │   └── page.js
│   │   │           │       ├── studio/
│   │   │           │       │   └── page.js
│   │   │           │       └── config/
│   │   │           │           └── page.js
│   │   │           ├── deliverables/
│   │   │           │   └── page.js
│   │   │           ├── health/
│   │   │           │   └── page.js
│   │   │           └── settings/
│   │   │               └── page.js
│   │   └── api/
│   │       ├── floors/
│   │       │   └── [id]/
│   │       │       ├── route.js
│   │       │       ├── drafts/
│   │       │       │   └── [type]/
│   │       │       │       └── [key]/
│   │       │       │           └── route.js
│   │       │       ├── credentials/
│   │       │       │   └── [id]/
│   │       │       │       └── route.js
│   │       │       ├── health/
│   │       │       │   └── route.js
│   │       │       └── audit/
│   │       │           └── route.js
│   │       └── tower/
│   │           └── route.js
│   ├── components/
│   │   ├── ui/                    # 基础 UI 组件
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Input.js
│   │   │   ├── Modal.js
│   │   │   ├── Table.js
│   │   │   └── Badge.js
│   │   ├── floor/
│   │   │   ├── FloorCard.js      # 楼层状态卡片
│   │   │   ├── FloorSelector.js  # 楼层选择器
│   │   │   └── HealthBadge.js    # 健康状态徽章
│   │   ├── studio/
│   │   │   ├── Office.js         # 像素办公室
│   │   │   ├── ProjectView.js    # 项目视图
│   │   │   ├── OpsView.js        # 运营视图
│   │   │   └── AssetsView.js     # 资产视图
│   │   ├── boss/
│   │   │   ├── Inbox.js          # 待决策列表
│   │   │   ├── MissionBoard.js   # 任务看板
│   │   │   └── CommandPanel.js   # 指令面板
│   │   └── config/
│   │       ├── ConfigTabs.js     # 配置标签页
│   │       ├── DraftStatus.js    # 草稿状态
│   │       └── ApplyButton.js    # 应用按钮
│   ├── lib/
│   │   ├── supabase.js            # Supabase 客户端
│   │   ├── auth.js               # 认证中间件
│   │   ├── encryption.js         # 凭证加密
│   │   └── utils.js               # 工具函数
│   └── styles/
│       └── globals.css
├── public/
├── .env.local.example
├── next.config.js
├── package.json
└── README.md
```

---

## 3. 页面规格

### 3.1 Tower 首页 (`/`)

**功能**: 展示 6 个楼层的状态卡片

**布局**:
- 标题: "Virtual Group Tower"
- 6 个楼层卡片 grid 布局 (3x2)
- 每个卡片显示: 楼层号、公司名、状态、健康分、最后心跳

**数据源**:
```js
// GET /api/tower
{
  floors: [
    {
      id: "1",
      floor_no: 1,
      display_name: "Floor 1",
      company_name: "Virtual Company 1",
      status: "running",
      health_score: 85,
      last_heartbeat_at: "2026-02-18T02:30:00Z"
    },
    ...
  ]
}
```

### 3.2 楼层直播页 (`/floor/[id]/live`)

**功能**: 单楼层实时运行态

**布局**:
- 左侧: 6 个 Agent 头像 + 状态
- 中间: 事件流（实时更新）
- 右侧: 当前 Mission/Step 状态

**数据源**:
```js
// GET /api/floor/[id]/live
{
  agents: [...],
  events: [...],
  missions: { running: [...], failed: [...] },
  steps: { queued: [...], running: [...] }
}
```

### 3.3 Boss 控制页 (`/ops/floor/[id]/boss`)

**功能**: 关键决策入口

**布局** (三栏):
- 左栏 (25%): Inbox - 待审核提案
- 中栏 (50%): Mission 看板
- 右栏 (25%): 快速指令

**交互**:
- 提案: 批准/拒绝
- Mission: 创建任务、查看详情
- 指令: 立即执行 heartbeat、触发特定 worker

### 3.4 Studio 工作室 (`/ops/floor/[id]/studio`)

**功能**: 项目/运营/资产三模式

**布局**:
- 上半区: 像素办公室 (固定)
- 下半区: Tab 切换 (Project / Ops / Assets)

**模式**:
1. **Project**: 看板视图 (待办/进行中/测试/交付/已完成)
2. **Ops**: Missions + Steps + Events 表格
3. **Assets**: Memory + Relationships + Artifacts 列表

### 3.5 Config 配置页 (`/ops/floor/[id]/config`)

**功能**: 楼层配置管理

**布局**:
- 左侧: 配置分类 (Company/Agent/Trigger/Policy/Scheduler/System)
- 右侧: 配置表单

**双阶段发布**:
- 保存: 写入 `ops_floor_config_drafts` (status: draft)
- 应用: 写入实际表 (status: applied) + 审计日志

---

## 4. 组件规格

### 4.1 FloorCard

```jsx
<FloorCard
  floor={{
    floor_no: 1,
    display_name: "Floor 1",
    company_name: "Virtual Company 1",
    status: "running", // empty|configured|provisioning|running|warning|stopped
    health_score: 85,
    last_heartbeat_at: "2026-02-18T02:30:00Z"
  }}
  onClick={() => navigate(`/floor/${id}/live")}
/>
```

**状态颜色**:
- empty: gray
- configured: blue
- provisioning: yellow
- running: green
- warning: orange
- stopped: red

### 4.2 Office (像素办公室)

```jsx
<Office
  agents={[
    { id: "boss", name: "Boss", status: "idle" },
    { id: "analyst", name: "Analyst", status: "thinking" },
    // ... 6 agents
  ]}
  events={[
    { agent_id: "hustler", kind: "step_completed", title: "Tweet posted" }
  ]}
/>
```

### 4.3 InboxItem

```jsx
<InboxItem
  proposal={{
    id: "uuid",
    agent_id: "hustler",
    title: "Scan industry signals",
    priority: 5,
    proposed_steps: [...]
  }}
  onApprove={() => handleApprove(id)}
  onReject={() => handleReject(id, reason)}
/>
```

---

## 5. API 契约

### 5.1 公开 API

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/tower` | 6 层状态 |
| GET | `/api/floor/[id]/live` | 单楼层直播 |

### 5.2 管理 API (需 ADMIN_TOKEN)

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/floors` | 楼层列表 |
| GET | `/api/floors/[id]` | 楼层详情 |
| POST | `/api/floors` | 创建楼层 |
| PATCH | `/api/floors/[id]` | 更新楼层 |
| POST | `/api/floors/[id]/enable` | 启用楼层 |
| POST | `/api/floors/[id]/disable` | 禁用楼层 |

### 5.3 草稿 API

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/floors/[id]/drafts` | 草稿列表 |
| POST | `/api/floors/[id]/drafts` | 创建草稿 |
| PATCH | `/api/floors/[id]/drafts/[draftId]` | 更新草稿 |
| POST | `/api/floors/[id]/drafts/[draftId]/apply` | 应用草稿 |
| DELETE | `/api/floors/[id]/drafts/[draftId]` | 删除草稿 |

### 5.4 数据 API

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/floors/[id]/data` | 运营数据 |
| GET | `/api/floors/[id]/artifacts` | 产物列表 |
| GET | `/api/floors/[id]/health` | 健康状态 |
| GET | `/api/floors/[id]/audit` | 审计日志 |

---

## 6. 验收清单

### 6.1 功能验收

- [ ] Tower 首页显示 6 个楼层卡片
- [ ] 点击卡片进入楼层直播页
- [ ] Boss 页可批准/拒绝提案
- [ ] Boss 页可创建新任务
- [ ] Studio 办公室固定在上半区
- [ ] Studio 三模式切换正常
- [ ] Config 保存草稿不生效
- [ ] Config 应用草稿生效
- [ ] 所有变更记录审计日志

### 6.2 体验验收

- [ ] 页面加载 < 2s
- [ ] 事件流实时更新
- [ ] 错误提示清晰
- [ ] 响应式布局 (mobile/tablet/desktop)

### 6.3 边界验收

- [ ] 无 DB 连接时显示错误页
- [ ] 无权限时跳转到登录
- [ ] 网络超时自动重试
- [ ] 敏感信息不暴露在前端

---

## 7. 环境变量

```bash
# Supabase (Control Plane)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Auth
ADMIN_TOKEN=your-admin-token-here

# Encryption
ENCRYPTION_KEY=32-char-encryption-key-here

# Optional: Floor-specific (for multi-db mode)
FLOOR_SUPABASE_URLS={"1":"https://floor1.supabase.co","2":"..."}
```

---

## 8. 部署指南

### 8.1 Vercel 部署

```bash
npm install -g vercel
vercel
# 设置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ADMIN_TOKEN
vercel env add ENCRYPTION_KEY
```

### 8.2 Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 9. 启动命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 生产
npm start
```

---

**END OF PROMPT**
