# Virtual Group WebUI v2

AI Agent 工作流管理系统的前端界面

## 技术栈

- **Framework**: Next.js 14
- **UI Library**: Chakra UI (基于 Horizon UI 模板)
- **数据库**: PostgreSQL (1Panel 部署)

## 项目结构

```
virtual-group-webui/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # UI 组件
│   ├── layouts/          # 布局组件
│   ├── views/            # 页面视图
│   ├── theme/            # 主题配置
│   └── ...
├── docs/                 # 项目文档
│   ├── 01-source-of-truth.md
│   ├── 02-product-scope.md
│   ├── 03-ia-routes.md
│   ├── 04-data-and-apis.md
│   ├── 05-multi-floor-control-model.md
│   └── 06-webui-engineering-prompt.md
├── sql/                  # 数据库脚本
│   ├── 01-control-plane.sql
│   └── 02-floor.sql
└── public/               # 静态资源
```

## 功能模块

- **Tower 首页**: 6 个楼层状态卡片
- **楼层直播页**: 实时运行态展示
- **Boss 控制中枢**: 提案审核、任务管理
- **Studio 工作室**: 项目/运营/资产三模式
- **Config 配置中心**: 双阶段配置发布

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 部署

1. **数据库**: 在 1Panel PostgreSQL 中执行 `sql/01-control-plane.sql`
2. **前端**: 部署到 1Panel Node.js 应用

## 文档

详见 `docs/` 目录
