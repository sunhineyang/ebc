'use client';

/**
 * Watti 电器清单计算器（可复用交互组件）
 * -------------------------------------------------
 * 差异化定位：清单式多电器 + 费用占比 + 量化省钱洞察。
 * 界面组件全部复用骨架里的 shadcn/ui，不引入任何新依赖。
 *
 * 复用方式：任何 calculator 页面都渲染这个组件，
 * 通过 props 传入不同的默认电器组合与文案即可变成新工具页。
 */
import { useMemo, useState } from 'react';
import { Lightbulb, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

import {
  ApplianceEntry,
  buildInsights,
  calculate,
} from './engine';
import { APPLIANCE_PRESETS, findPreset } from './presets';

// 组件可配置项：不同工具页传不同配置即可复用
export interface CalculatorConfig {
  currency?: string; // 货币符号，默认 $
  defaultRate?: number; // 默认电价（每 kWh）
  defaultPresets?: string[]; // 初始展示的电器预设 id 列表
  showInsights?: boolean; // 是否展示省钱洞察区
}

let uid = 0;
const nextId = () => `entry-${++uid}-${Date.now()}`;

/** 用预设生成一行输入记录 */
function entryFromPreset(presetId: string): ApplianceEntry {
  const preset = findPreset(presetId);
  return {
    id: nextId(),
    presetId: preset.id,
    label: preset.label,
    watts: preset.watts,
    hoursPerDay: preset.hoursPerDay,
    quantity: 1,
  };
}

export function ApplianceCalculator({ config }: { config?: CalculatorConfig }) {
  const currency = config?.currency ?? '$';
  const [rate, setRate] = useState<number>(config?.defaultRate ?? 0.17);
  const [entries, setEntries] = useState<ApplianceEntry[]>(() =>
    (config?.defaultPresets ?? ['central-ac', 'refrigerator', 'tv']).map(
      entryFromPreset
    )
  );

  // 输入一变，结果实时重算（useMemo 避免无效重复计算）
  const result = useMemo(() => calculate(entries, rate), [entries, rate]);
  const insights = useMemo(
    () =>
      config?.showInsights === false
        ? []
        : buildInsights(result, rate, currency),
    [result, rate, currency, config?.showInsights]
  );

  // 更新某一行的某个字段
  const updateEntry = (id: string, patch: Partial<ApplianceEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  // 切换某一行的电器预设：名称和默认瓦数/时长跟着变
  const changePreset = (id: string, presetId: string) => {
    const preset = findPreset(presetId);
    updateEntry(id, {
      presetId: preset.id,
      label: preset.label,
      watts: preset.watts,
      hoursPerDay: preset.hoursPerDay,
    });
  };

  const money = (n: number) =>
    `${currency}${n.toFixed(n >= 100 ? 0 : 2)}`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* 电价输入 */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <label className="text-sm font-medium" htmlFor="watti-rate">
            Electricity rate ({currency} per kWh)
          </label>
          <Input
            id="watti-rate"
            type="number"
            min={0}
            step={0.01}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-28"
          />
          <span className="text-muted-foreground text-xs">
            Find it on your electricity bill. US average is about 17¢/kWh.
          </span>
        </CardContent>
      </Card>

      {/* 电器清单 */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="grid grid-cols-2 items-end gap-3 pt-6 md:grid-cols-[1.6fr_1fr_1fr_0.7fr_auto]">
              <div className="col-span-2 md:col-span-1">
                <label className="text-muted-foreground mb-1 block text-xs">
                  Appliance
                </label>
                <Select
                  value={entry.presetId}
                  onValueChange={(v) => changePreset(entry.id, v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLIANCE_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">
                  Watts
                </label>
                <Input
                  type="number"
                  min={0}
                  value={entry.watts}
                  onChange={(e) =>
                    updateEntry(entry.id, { watts: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">
                  Hours / day
                </label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={entry.hoursPerDay}
                  onChange={(e) =>
                    updateEntry(entry.id, {
                      hoursPerDay: Math.min(24, Number(e.target.value)),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">
                  Qty
                </label>
                <Input
                  type="number"
                  min={1}
                  value={entry.quantity}
                  onChange={(e) =>
                    updateEntry(entry.id, {
                      quantity: Math.max(1, Number(e.target.value)),
                    })
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${entry.label}`}
                onClick={() =>
                  setEntries((prev) => prev.filter((e) => e.id !== entry.id))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={() =>
            setEntries((prev) => [...prev, entryFromPreset('custom')])
          }
        >
          <Plus className="size-4" />
          Add appliance
        </Button>
      </div>

      {/* 结果总览 */}
      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-muted-foreground text-xs">Per day</p>
              <p className="text-2xl font-semibold">
                {money(result.totalCostPerDay)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Per month</p>
              <p className="text-primary text-3xl font-bold">
                {money(result.totalCostPerMonth)}
              </p>
              <p className="text-muted-foreground text-xs">
                {result.totalKwhPerMonth.toFixed(0)} kWh
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Per year</p>
              <p className="text-2xl font-semibold">
                {money(result.totalCostPerYear)}
              </p>
            </div>
          </div>

          {/* 每个电器的费用占比条 —— 竞品没有的“账单构成”视角 */}
          {result.totalCostPerDay > 0 && (
            <div className="mt-6 space-y-2">
              {result.items.map((item) => (
                <div key={item.entry.id} className="flex items-center gap-3">
                  <span className="w-40 truncate text-sm">
                    {item.entry.label}
                    {item.entry.quantity > 1 ? ` ×${item.entry.quantity}` : ''}
                  </span>
                  <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${Math.max(2, item.share * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-sm font-medium">
                    {money(item.costPerMonth)}/mo
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 省钱洞察 —— “更进一步”的差异化区域 */}
      {insights.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="text-primary size-4" />
              How to lower this bill
            </p>
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-muted-foreground text-sm">
                  {insight.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
