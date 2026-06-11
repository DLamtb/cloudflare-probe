# Cloudflare 原生网站/API 在线探针

## 目标
部署在 Cloudflare 的探针：独立 Worker 每分钟访问目标网站/API，记录在线/离线、延时、状态码；按分钟展示状态条与可用率；支持普通网站、API 站点、Supabase 保活；带登录后台增删改监控对象。

## 约定（按你的要求）
- **前端 = 现有 `src/`**，用 shadcn + Tailwind v4，黑/白主题。
- **布局 = 左右两栏**：左侧导航目录，右侧内容显示。
- **API = 根目录 `functions/`**（Cloudflare Pages Functions）。
- **cron = 独立 `worker/` 文件夹**。
- **每个文件 < 300 行代码**。
- 此 `functions/` + `worker/` 不在 Lovable 预览运行，需你用 wrangler 部署到 Cloudflare。

## 架构
```text
  每分钟 cron → worker/  →  fetch 各站点 → 写 checks
                  │ 读写
            ┌─────▼─────┐        ┌────────┐
            │    D1     │        │   KV   │ 会话 token
            │ users     │        └───▲────┘
            │ sites     │            │
            │ checks    │            │
            └─────▲─────┘            │
                  │ 读写             │
            functions/ (/api/*) ─────┘  登录 / sites CRUD / status / checks
                  ▲ fetch
            src/ (Pages 前端)  左导航 + 右内容
```
D1 与 KV 同时绑定到 Pages Functions 和 Worker。

## 目录结构
```text
src/                         # 现有前端，新增路由
  routes/
    index.tsx                # 状态面板（公开只读，默认首页）
    login.tsx                # 管理员登录
    admin.tsx                # 后台：站点增删改（需登录）
    __root.tsx               # 改造为左右两栏布局
  components/
    app-sidebar.tsx          # 左侧导航目录
    status-card.tsx          # 站点状态卡片 + 60格分钟状态条
    site-form.tsx            # 新增/编辑站点表单
  lib/probe-api.ts           # 前端调用 /api/* 的封装

functions/                   # Cloudflare Pages Functions（根目录）
  _middleware.ts             # 写操作鉴权（校验 KV 会话）
  api/
    login.ts                 # POST 登录 → 写 KV，HttpOnly Cookie
    logout.ts
    status.ts                # GET 公开：各站点最新状态 + 最近60分钟
    checks.ts                # GET 公开：某站点历史明细
    sites/index.ts           # GET 列表 / POST 新增（POST 需登录）
    sites/[id].ts            # PUT 改 / DELETE 删（需登录）
  lib/db.ts                  # D1 查询封装
  lib/auth.ts                # 会话校验

worker/                      # 独立 cron Worker
  src/index.ts               # scheduled() 遍历站点检测 + 清理过期
  src/check.ts               # 单站点 fetch + 计时逻辑
  wrangler.toml              # cron "* * * * *" + D1/KV 绑定

schema.sql                   # D1 建表
wrangler.toml                # Pages 项目 D1/KV 绑定
README.md                    # 部署步骤
```

## 数据模型（D1）
- `users`: `id`, `username`(唯一), `password_hash`, `created_at`。
- `sites`: `id`, `name`, `url`, `type`(`web`|`api`|`supabase`), `method`(默认GET), `expected_status`(默认200), `headers`(JSON), `enabled`, `created_at`。
- `checks`: `id`, `site_id`, `checked_at`(epoch秒), `ok`(0/1), `status_code`, `latency_ms`, `error`。索引 `(site_id, checked_at)`。

## cron Worker（每分钟）
- `scheduled()` 读 `enabled=1` 的站点，`Promise.allSettled` 并发检测。
- 单站点：记录起止算 `latency_ms`，按 `method`/`headers` 发 `fetch`，超时 10s；`ok = 状态码命中 expected_status`。Supabase 保活即定时请求其 REST/health URL 防休眠。
- 批量写 `checks`，末尾清理早于 7 天的记录。

## Pages Functions（API）
- `POST /api/login`：校验用户名/密码（PBKDF2/SHA-256 哈希），生成随机 token 写 KV（TTL 7天），HttpOnly+Secure Cookie 返回。
- `_middleware.ts`：对 sites 写操作校验 Cookie token 是否在 KV。
- `GET /api/status`（公开）：各站点最新状态、延时、最近60分钟逐分钟 ok 序列、24h 可用率。
- `GET /api/checks?site_id=`（公开）：历史明细供趋势。
- `sites` 增删改仅登录可用；API key 等请求头只存 D1、不下发前端。

## 前端（src/，黑白主题，左右两栏）
- `__root.tsx`：左侧 `app-sidebar`（仪表盘 / 后台 / 登录），右侧 `<Outlet/>`。
- **状态面板（首页，公开）**：每站点一张 `status-card`：名称、在线/离线、延时、最近60格分钟状态条（黑=在线/灰=离线 或 绿/红）、24h 可用率；每 30s 轮询 `/api/status`。
- **登录页**：用户名/密码。
- **后台**：表格 + `site-form` 增删改站点（名称/URL/类型/方法/期望状态码/请求头/启用）。
- 主题：黑/白，语义化 token，shadcn 组件（Card/Table/Button/Input/Switch/Tabs）。

## 部署步骤（README）
1. `wrangler d1 create probe-db` → 填两处 wrangler.toml 的 `database_id`。
2. `wrangler kv namespace create PROBE_KV` → 填 `id`。
3. `wrangler d1 execute probe-db --file=./schema.sql` 建表。
4. 跑初始化管理员的 SQL（README 给命令 + 哈希生成方式）。
5. `cd worker && wrangler deploy`（含 cron）。
6. 前端构建后 `wrangler pages deploy`（绑定 D1/KV 与 functions）。

## 说明 / 限制
- `functions/`、`worker/` 不在 Lovable 预览运行，需自行用 wrangler 部署。
- Cloudflare Workers cron 最小粒度 1 分钟，满足每分钟检测。
- wrangler.toml 中 `database_id`、KV `id` 为占位符，部署时替换。

确认后我会生成全部文件与 README，并保证每个文件 < 300 行。
