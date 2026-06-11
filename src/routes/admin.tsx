import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { probeData } from "@/lib/probe-data";
import { type Site, type SiteInput } from "@/lib/probe-api";
import { SiteForm } from "@/components/site-form";
import { ActionMenu, useConfirm } from "@/components/overlay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "后台管理 · Probe" }] }),
  component: AdminPage,
});

const TYPE_LABEL: Record<string, string> = { web: "网站", api: "API", supabase: "Supabase" };

function AdminPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Site | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const sitesQ = useQuery({ queryKey: ["sites"], queryFn: probeData.listSites });
  const sites = sitesQ.data?.sites ?? [];

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (s: Site) => {
    setEditing(s);
    setOpen(true);
  };

  const save = async (data: SiteInput) => {
    setBusy(true);
    try {
      if (editing) await probeData.updateSite(editing.id, data);
      else await probeData.createSite(data);
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["sites"] });
      qc.invalidateQueries({ queryKey: ["status"] });
      toast.success(editing ? "站点已更新" : "站点已添加");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: Site) => {
    const ok = await confirm({
      title: "删除站点",
      description: `确定删除「${s.name}」及其所有历史记录？此操作不可撤销。`,
      confirmText: "删除",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await probeData.deleteSite(s.id);
      qc.invalidateQueries({ queryKey: ["sites"] });
      qc.invalidateQueries({ queryKey: ["status"] });
      toast.success("站点已删除");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="rise-in mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">后台管理</h1>
          <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">管理监控的网站、API 与 Supabase 保活。</p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          添加站点
        </Button>
      </header>

      <div className="rise-in overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">名称</TableHead>
                <TableHead className="hidden sm:table-cell">地址</TableHead>
                <TableHead className="hidden md:table-cell">类型</TableHead>
                <TableHead className="hidden md:table-cell">方法</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="pr-5 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    暂无站点，点击右上角添加。
                  </TableCell>
                </TableRow>
              )}
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-5 font-medium">{s.name}</TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-muted-foreground sm:table-cell sm:max-w-[280px]">
                    {s.url}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {TYPE_LABEL[s.type] ?? s.type}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{s.method}</TableCell>
                  <TableCell>
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs " +
                        (s.enabled
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground")
                      }
                    >
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (s.enabled ? "bg-success" : "bg-muted-foreground")
                        }
                      />
                      {s.enabled ? "启用" : "停用"}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <ActionMenu
                      label={s.name}
                      items={[
                        { label: "编辑", icon: Pencil, onSelect: () => openEdit(s) },
                        {
                          label: "删除",
                          icon: Trash2,
                          tone: "danger",
                          onSelect: () => remove(s),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="mx-4 max-w-lg sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "编辑站点" : "添加站点"}
            </DialogTitle>
          </DialogHeader>
          <SiteForm
            initial={editing ?? undefined}
            busy={busy}
            onSubmit={save}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
