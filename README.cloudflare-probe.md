# Cloudflare 网站/API 在线探针

轻量级在线状态监控面板。定时（每分钟）访问目标网站/API，记录在线状态、延时、状态码，按分钟展示状态条与 24h 可用率。支持普通网站、API 站点、以及 Supabase 站点保活。

## 架构

```
src/               前端（TanStack + Tailwind CSS，响应式设计）
├── routes/        页面（Dashboard、Admin、Docs）
├── components/    组件（StatusCard、SiteForm、Sidebar）
└── lib/           数据层（mock/real API 切换）

functions/         Cloudflare Pages Functions（API 后端）
├── api/           REST 接口
│   ├── _middleware.ts   CORS + 鉴权中间件
│   ├── auth/           登录/登出
│   ├── status.ts       站点状态聚合
│   ├── checks.ts       历史检测查询
│   └── sites/          站点 CRUD
└── lib/           数据库、类型、校验

worker/            独立 cron Worker，每分钟检测所有站点
schema.sql         D1 表结构
```

### 存储

只使用 **D1**，不再需要 KV：

| 表 | 用途 |
|-----|------|
| `sites` | 站点配置（名称、URL、类型、请求头等） |
| `checks` | 检测历史（状态码、延时、是否在线），保留 7 天 |
| `sessions` | 管理员登录会话，7 天过期 |

## 部署步骤

### 1. 创建 D1

```bash
wrangler d1 create probe-db
```

把输出的 `database_id` 填到 `wrangler.toml` 和 `worker/wrangler.toml`。

### 2. 建表

```bash
wrangler d1 execute probe-db --remote --file=./schema.sql
```

### 3. 设置管理员凭证

```bash
wrangler secret put ADMIN_USERNAME   # 输入管理员用户名
wrangler secret put ADMIN_PASSWORD   # 输入管理员密码
```

### 4. 部署 cron Worker（每分钟检测）

```bash
cd worker
npm install
wrangler deploy
```

### 5. 部署 Pages（前端 + API）

```bash
npm install
npm run build
wrangler pages deploy dist
```

在 Cloudflare 控制台 Pages 项目的 Settings → Functions → 绑定中，确认 D1 绑定名为 `DB`。

### 6. 关闭演示模式

部署完成后，设置环境变量 `VITE_USE_MOCK=false` 切换到实时数据。

## 环境变量

| 变量 | 说明 |
|------|------|
| `ADMIN_USERNAME` | 管理员用户名（Cloudflare Secret） |
| `ADMIN_PASSWORD` | 管理员密码（Cloudflare Secret） |
| `VITE_USE_MOCK` | `true`=演示数据，`false`=实时 API |

## API

### 公开接口（无需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/status` | 各站点最新状态、最近 60 分钟、24h 可用率 |
| GET | `/api/checks?site_id=&hours=&limit=` | 单站点历史明细 |
| GET | `/api/sites` | 站点列表 |

### 管理接口（需要登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录（username + password） |
| POST | `/api/auth/logout` | 登出 |
| POST | `/api/sites` | 新增站点 |
| PUT | `/api/sites/:id` | 修改站点 |
| DELETE | `/api/sites/:id` | 删除站点 |

## 站点字段

| 字段 | 说明 |
|------|------|
| `name` | 名称 |
| `url` | 目标地址 |
| `type` | `web` / `api` / `supabase` |
| `method` | `GET` / `HEAD` / `POST` |
| `expected_status` | 期望状态码（默认 200） |
| `headers` | JSON 对象，可放 `Authorization`、`apikey` 等（仅服务端存储，不下发前端） |
| `enabled` | 是否启用 |

## Supabase 保活

把 `type` 设为 `supabase`，`url` 填项目的 REST/health 地址（如 `https://xxx.supabase.co/rest/v1/`），`headers` 放 `apikey`，每分钟请求即可防止项目休眠。

## 功能特性

- 实时状态面板，30 秒自动刷新
- 60 分钟状态条 + 24h 可用率
- 响应式设计，支持移动端
- 深色/浅色主题切换
- SSRF 防护，拦截内网地址
- 登录频率限制
- CORS 白名单
