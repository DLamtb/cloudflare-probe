import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Gauge, XCircle } from "lucide-react";

import { probeData } from "@/lib/probe-data";
import { StatusCard } from "@/components/status-card";
import type { SiteStatus } from "@/lib/probe-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "状态面板 · Probe 在线探针" },
      { name: "description", content: "实时网站与 API 在线状态监控面板。" },
    ],
  }),
  component: Dashboard,
});

function summarize(sites: SiteStatus[]) {
  const active = sites.filter((s) => s.enabled);
  const online = active.filter((s) => s.latest?.ok === 1).length;
  const offline = active.filter((s) => s.latest?.ok === 0).length;
  const disabled = sites.filter((s) => !s.enabled).length;
  const lats = active
    .map((s) => s.latest?.latency_ms)
    .filter((n): n is number => typeof n === "number");
  const avg = lats.length ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : null;
  return { total: sites.length, active: active.length, online, offline, disabled, avg };
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="rise-in rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div
        className={
          "mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight " +
          (tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["status"],
    queryFn: probeData.status,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const sites = data?.sites ?? [];
  const s = summarize(sites);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="rise-in mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">状态面板</h1>
          <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            每分钟检测 · 每 30 秒自动刷新 · 共 {s.total} 个监控对象
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-success live-dot" />
          实时
        </span>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
        <Stat icon={Activity} label="监控总数" value={String(s.total)} />
        <Stat icon={CheckCircle2} label="运行正常" value={String(s.online)} tone="success" />
        <Stat
          icon={XCircle}
          label="服务中断"
          value={String(s.offline)}
          tone={s.offline > 0 ? "danger" : undefined}
        />
        <Stat icon={Gauge} label="平均延时" value={s.avg != null ? `${s.avg}ms` : "—"} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">加载中…</p>
      ) : sites.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card/60 p-6 text-center text-sm text-muted-foreground backdrop-blur-sm sm:p-10">
          还没有监控对象，请到「后台管理」添加站点。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
          {sites.map((site, i) => (
            <StatusCard key={site.id} site={site} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
