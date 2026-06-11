import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SiteStatus } from "@/lib/probe-api";

function cellClass(ok: number | null): string {
  if (ok === null) return "bg-muted-foreground/15";
  return ok === 1 ? "bg-success" : "bg-danger";
}

const TYPE_LABEL: Record<string, string> = {
  web: "网站",
  api: "API",
  supabase: "Supabase",
};

export function StatusCard({ site, index = 0 }: { site: SiteStatus; index?: number }) {
  const online = site.latest?.ok === 1;
  const offline = site.latest != null && site.latest.ok === 0;
  const disabled = !site.enabled;

  const statusText = disabled ? "已停用" : online ? "运行正常" : offline ? "服务中断" : "等待数据";
  const dotColor = disabled
    ? "bg-muted-foreground/50"
    : online
      ? "bg-success live-dot"
      : offline
        ? "bg-danger"
        : "bg-muted-foreground/50";

  return (
    <div
      className="rise-in group rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm transition-all hover:border-border hover:shadow-[0_8px_40px_-12px] hover:shadow-foreground/10"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotColor)} />
            <h3 className="truncate font-display text-[15px] font-semibold tracking-tight">
              {site.name}
            </h3>
            <span className="rounded-md border border-border/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {TYPE_LABEL[site.type] ?? site.type}
            </span>
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="truncate">{site.url.replace(/^https?:\/\//, "")}</span>
            <ArrowUpRight className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-[13px] font-semibold",
              online ? "text-success" : offline ? "text-danger" : "text-muted-foreground",
            )}
          >
            {statusText}
          </div>
          <div className="mt-0.5 font-display text-2xl font-semibold tabular-nums tracking-tight">
            {site.latest?.latency_ms != null ? site.latest.latency_ms : "—"}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">ms</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex h-9 items-end gap-[3px]">
        {site.minutes.map((m) => (
          <div
            key={m.t}
            title={`${new Date(m.t * 1000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} · ${
              m.ok === null ? "无数据" : m.ok ? "正常" : "中断"
            }`}
            className={cn(
              "flex-1 rounded-full transition-all hover:opacity-70",
              cellClass(m.ok),
              m.ok === null ? "h-3" : m.ok ? "h-full" : "h-5",
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <span className="text-muted-foreground">最近 60 分钟</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          可用率
          <span
            className={cn(
              "font-display font-semibold tabular-nums",
              site.uptime24h == null
                ? "text-muted-foreground"
                : site.uptime24h >= 99
                  ? "text-success"
                  : site.uptime24h >= 95
                    ? "text-foreground"
                    : "text-danger",
            )}
          >
            {site.uptime24h != null ? `${site.uptime24h}%` : "—"}
          </span>
        </span>
      </div>
    </div>
  );
}
