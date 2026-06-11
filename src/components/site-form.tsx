import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Site, SiteInput } from "@/lib/probe-api";

const SELECT_CLS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function SiteForm({
  initial,
  onSubmit,
  onCancel,
  busy,
}: {
  initial?: Site;
  onSubmit: (data: SiteInput) => void | Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}) {
  const [form, setForm] = useState<SiteInput>({
    name: initial?.name ?? "",
    url: initial?.url ?? "",
    type: initial?.type ?? "web",
    method: initial?.method ?? "GET",
    expected_status: initial?.expected_status ?? 200,
    headers: "{}",
    enabled: initial?.enabled ?? 1,
  });

  const set = <K extends keyof SiteInput>(k: K, v: SiteInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">名称</Label>
        <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="url">目标地址</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="type">类型</Label>
          <select
            id="type"
            className={SELECT_CLS}
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="web">网站</option>
            <option value="api">API</option>
            <option value="supabase">Supabase</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="method">方法</Label>
          <select
            id="method"
            className={SELECT_CLS}
            value={form.method}
            onChange={(e) => set("method", e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="HEAD">HEAD</option>
            <option value="POST">POST</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">期望状态码</Label>
          <Input
            id="status"
            type="number"
            min={100}
            max={599}
            value={form.expected_status}
            onChange={(e) => set("expected_status", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="headers">请求头 (JSON)</Label>
        <Textarea
          id="headers"
          rows={3}
          placeholder={initial ? "留空则保留原值" : '{"Authorization": "Bearer ..."}'}
          value={form.headers}
          onChange={(e) => set("headers", e.target.value)}
        />
        {initial && (
          <p className="text-[11px] text-muted-foreground">
            为安全起见，请求头不会从服务器回传。留空则保留原值，填写则覆盖。
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="enabled"
          checked={form.enabled === 1}
          onCheckedChange={(c) => set("enabled", c ? 1 : 0)}
        />
        <Label htmlFor="enabled">启用监控</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "保存中…" : "保存"}
        </Button>
      </div>
    </form>
  );
}
