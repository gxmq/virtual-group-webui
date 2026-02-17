# 部署待办

## 当前进度

- [x] 创建 GitHub 仓库
- [x] 推送初始代码
- [ ] 部署到 VPS (需要1Panel API/SSH)

## 部署步骤

### 1. 数据库部署
在 1Panel PostgreSQL 中执行:
```bash
# 通过 1Panel 数据库管理连接
# 执行 sql/01-control-plane.sql
```

### 2. 前端部署
```bash
# 克隆仓库
git clone https://github.com/gxmq/virtual-group-webui.git

# 安装依赖
cd virtual-group-webui
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local

# 构建
npm run build

# 运行
npm start
```

### 3. 环境变量
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_TOKEN=your-admin-token
```
