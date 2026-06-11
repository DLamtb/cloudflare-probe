import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, BookOpen, Moon, Radar, Settings, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

const NAV = [
  { to: "/", label: "状态面板", icon: Activity },
  { to: "/admin", label: "后台管理", icon: Settings },
  { to: "/docs", label: "接口文档", icon: BookOpen },
] as const;

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("probe-theme");
    return stored ? stored === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () =>
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("probe-theme", next ? "dark" : "light");
      return next;
    });

  return { dark, toggle };
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { dark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/90 backdrop-blur-xl lg:hidden"
        aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/70 bg-card/95 backdrop-blur-xl transition-transform duration-200 lg:sticky lg:translate-x-0 lg:bg-card/40",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
            <Radar className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-semibold tracking-tight">Probe</div>
            <div className="text-[11px] text-muted-foreground">在线状态探针</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 px-4">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-4">
          <button
            onClick={toggle}
            className="flex w-full items-center justify-between rounded-xl border border-border/70 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {dark ? "浅色模式" : "深色模式"}
            </span>
          </button>
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted-foreground/60">
            {USE_MOCK ? "演示数据 · 部署后接入实时检测" : "实时数据 · 每分钟自动检测"}
          </p>
        </div>
      </aside>
    </>
  );
}
