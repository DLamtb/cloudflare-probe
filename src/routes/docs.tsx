import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Globe, Send, Eye, ArrowRightLeft, Trash2, Pencil, Activity, Search } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "接口文档 · Probe" },
      { name: "description", content: "Probe 探针系统 HTTP 方法说明与接口请求示例。" },
    ],
  }),
  component: DocsPage,
});

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    GET: "bg-chart-3/15 text-chart-3",
    POST: "bg-chart-1/15 text-chart-1",
    PUT: "bg-chart-4/15 text-chart-4",
    DELETE: "bg-chart-2/15 text-chart-2",
    HEAD: "bg-chart-5/15 text-chart-5",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
        map[method] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {method}
    </span>
  );
}

function EndpointCard({
  method,
  path,
  title,
  icon: Icon,
  children,
}: {
  method: string;
  path: string;
  title: string;
  icon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <div className="rise-in overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-border/50 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex flex-1 items-center gap-3">
          <MethodBadge method={method} />
          <code className="text-sm font-medium text-foreground">{path}</code>
        </div>
      </div>
      <div className="px-6 py-5">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-secondary/60 p-4 text-[13px] leading-relaxed text-foreground/90">
      <code>{code}</code>
    </pre>
  );
}

function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="rise-in mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">接口文档</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          探针系统 API 的 HTTP 方法说明与请求示例。
        </p>
      </header>

      <section className="rise-in mb-10">
        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">HTTP 方法速查</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-chart-3" />
              <span className="font-display text-sm font-semibold">GET</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              获取资源，只读操作，不修改服务器数据。请求参数放在 URL 中，适合查询和读取。
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-chart-1" />
              <span className="font-display text-sm font-semibold">POST</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              提交数据，创建资源，会改变服务器状态。数据放在请求体（body）中，适合新增和写入。
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-chart-5" />
              <span className="font-display text-sm font-semibold">HEAD</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              只获取响应头，不返回响应体。用于快速检查资源是否存在或获取元数据，不消耗带宽下载正文。
            </p>
          </div>
        </div>
      </section>

      <section className="rise-in mb-10">
        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">探针系统 API</h2>
        <div className="flex flex-col gap-4">
          <EndpointCard method="GET" path="/api/status" title="获取全部站点状态" icon={Activity}>
            <p>返回所有监控站点的最新状态、最近 60 分钟历史条、24 小时可用率及当前时间戳。</p>
            <CodeBlock code={`// 请求示例
fetch("/api/status")
  .then(r => r.json())
  .then(data => console.log(data.sites));

// 返回片段
{
  "sites": [
    {
      "id": 1,
      "name": "我的博客",
      "latest": { "ok": 1, "latency_ms": 120, "status_code": 200 },
      "uptime24h": 99.9,
      "minutes": [{ "t": 1717560000, "ok": 1 }, ...]
    }
  ],
  "now": 1717563660
}`} />
          </EndpointCard>

          <EndpointCard method="GET" path="/api/sites" title="获取站点列表" icon={Globe}>
            <p>返回所有已配置站点的基本信息，包括名称、地址、类型、检测方法、期望状态码等。</p>
            <CodeBlock code={`// 请求示例
fetch("/api/sites")
  .then(r => r.json())
  .then(data => console.log(data.sites));

// 返回片段
{
  "sites": [
    { "id": 1, "name": "我的博客", "url": "https://example.com", "type": "web", "method": "GET", "enabled": 1 }
  ]
}`} />
          </EndpointCard>

          <EndpointCard method="POST" path="/api/sites" title="新增监控站点" icon={Send}>
            <p>在 body 中提交站点配置，创建新的监控对象。创建成功后返回新站点的 id。</p>
            <CodeBlock code={`// 请求示例
fetch("/api/sites", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "我的 API",
    url: "https://api.example.com/health",
    type: "api",
    method: "GET",
    expected_status: 200,
    headers: "{}",
    enabled: 1,
  }),
})
  .then(r => r.json())
  .then(data => console.log(data.id));  // 新站点 id`} />
          </EndpointCard>

          <EndpointCard method="PUT" path="/api/sites/:id" title="修改站点配置" icon={Pencil}>
            <p>在 body 中提交完整或部分字段，更新指定 id 的站点信息。返回 {'{'}&quot;ok&quot;: true{'}'} 表示成功。</p>
            <CodeBlock code={`// 请求示例
fetch("/api/sites/1", {
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "我的博客（已改名）",
    url: "https://new-domain.com",
    type: "web",
    method: "HEAD",
    expected_status: 200,
    headers: "{}",
    enabled: 1,
  }),
})
  .then(r => r.json())
  .then(data => console.log(data.ok));`} />
          </EndpointCard>

          <EndpointCard method="DELETE" path="/api/sites/:id" title="删除站点及历史" icon={Trash2}>
            <p>删除指定 id 的监控站点，同时清理该站点的全部历史检测记录。操作不可逆。</p>
            <CodeBlock code={`// 请求示例
fetch("/api/sites/1", { method: "DELETE" })
  .then(r => r.json())
  .then(data => console.log(data.ok));

// 返回
{ "ok": true }`} />
          </EndpointCard>

          <EndpointCard method="GET" path="/api/checks" title="查询单站点历史明细" icon={ArrowRightLeft}>
            <p>通过 query 参数指定 site_id 和 hours，获取该站点在指定时间范围内的每一次检测结果。</p>
            <CodeBlock code={`// 请求示例
fetch("/api/checks?site_id=1&hours=24")
  .then(r => r.json())
  .then(data => console.log(data.checks));

// 返回片段
{
  "site_id": 1,
  "checks": [
    { "id": 42, "site_id": 1, "ok": 1, "latency_ms": 85, "status_code": 200, "checked_at": 1717560000 }
  ]
}`} />
          </EndpointCard>
        </div>
      </section>

      <section className="rise-in">
        <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">检测方法配置</h2>
        <div className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            在「后台管理」添加站点时，method 字段决定 Worker 每分钟如何访问目标地址：
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-secondary/40 p-4">
              <MethodBadge method="GET" />
              <p className="mt-2 text-sm text-muted-foreground">标准请求，下载完整响应体，适合大多数网站和 API。</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-4">
              <MethodBadge method="HEAD" />
              <p className="mt-2 text-sm text-muted-foreground">只取响应头，不下载正文，节省流量，适合大型页面或仅需验证存活。</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-4">
              <MethodBadge method="POST" />
              <p className="mt-2 text-sm text-muted-foreground">向目标提交数据，适合需要触发操作的接口或特定的健康检查端点。</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
