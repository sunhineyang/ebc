/**
 * Watti 计算引擎（纯函数、零依赖、可复用）
 * -------------------------------------------------
 * 所有 calculator 页面共用这一个引擎。
 * 每个计算器只是不同的“输入配置”，公式核心永远是：
 *   kWh = 瓦数 × 每天使用小时数 × 数量 / 1000
 *   费用 = kWh × 每度电价格
 */

// 一条电器输入记录：用户在界面上添加的一行
export interface ApplianceEntry {
  id: string; // 行的唯一标识，用于 React key 和增删
  presetId: string; // 关联的电器预设 id，'custom' 表示自定义
  label: string; // 显示名称，如 "Air Conditioner"
  watts: number; // 功率（瓦）
  hoursPerDay: number; // 每天使用小时数
  quantity: number; // 数量（比如 5 个灯泡）
}

// 单个电器的计算结果
export interface ApplianceCost {
  entry: ApplianceEntry;
  kwhPerDay: number; // 每天耗电量（度）
  costPerDay: number; // 每天电费
  costPerMonth: number; // 每月电费（按 365.25/12 天）
  costPerYear: number; // 每年电费（按 365.25 天）
  share: number; // 占总费用比例（0-1），用于画占比条
}

// 整个清单的计算结果
export interface CalcResult {
  items: ApplianceCost[];
  totalKwhPerDay: number;
  totalKwhPerMonth: number;
  totalCostPerDay: number;
  totalCostPerMonth: number;
  totalCostPerYear: number;
}

// 一条省钱洞察：告诉用户“做什么动作、每月省多少”
export interface SavingInsight {
  title: string;
  detail: string;
  savingPerMonth: number; // 每月可省金额，用于排序
}

const DAYS_PER_MONTH = 365.25 / 12; // 平均每月天数，比直接用 30 更准
const DAYS_PER_YEAR = 365.25;

/** 计算单个电器每天耗电量（度） */
export function kwhPerDay(entry: ApplianceEntry): number {
  return (entry.watts * entry.hoursPerDay * entry.quantity) / 1000;
}

/**
 * 核心计算：输入电器清单 + 电价，输出完整费用拆解
 * @param entries 电器清单
 * @param ratePerKwh 每度电价格（如 0.17 美元）
 */
export function calculate(
  entries: ApplianceEntry[],
  ratePerKwh: number
): CalcResult {
  const rate = Math.max(0, ratePerKwh || 0);

  const items: ApplianceCost[] = entries.map((entry) => {
    const kwh = kwhPerDay(entry);
    const costPerDay = kwh * rate;
    return {
      entry,
      kwhPerDay: kwh,
      costPerDay,
      costPerMonth: costPerDay * DAYS_PER_MONTH,
      costPerYear: costPerDay * DAYS_PER_YEAR,
      share: 0, // 先占位，算完总数后再回填
    };
  });

  const totalCostPerDay = items.reduce((sum, i) => sum + i.costPerDay, 0);
  const totalKwhPerDay = items.reduce((sum, i) => sum + i.kwhPerDay, 0);

  // 回填每个电器的费用占比（总费用为 0 时记 0，避免除零）
  for (const item of items) {
    item.share = totalCostPerDay > 0 ? item.costPerDay / totalCostPerDay : 0;
  }

  // 按费用从高到低排序，让“最烧钱”的排最前面
  items.sort((a, b) => b.costPerDay - a.costPerDay);

  return {
    items,
    totalKwhPerDay,
    totalKwhPerMonth: totalKwhPerDay * DAYS_PER_MONTH,
    totalCostPerDay,
    totalCostPerMonth: totalCostPerDay * DAYS_PER_MONTH,
    totalCostPerYear: totalCostPerDay * DAYS_PER_YEAR,
  };
}

/**
 * 生成量化省钱洞察 —— 这是对比竞品“更进一步”的核心。
 * 规则都是纯计算，不编造数字：
 * 1. 最大头电器：每天少用 1 小时能省多少
 * 2. 白炽灯：换成 9W LED 能省多少
 * 3. 电价敏感度：电价每降 1 美分，每月省多少
 */
export function buildInsights(
  result: CalcResult,
  ratePerKwh: number,
  currency: string
): SavingInsight[] {
  const insights: SavingInsight[] = [];
  const top = result.items[0];

  // 洞察 1：最烧钱的电器，每天少用 1 小时的节省
  if (top && top.costPerDay > 0 && top.entry.hoursPerDay >= 1) {
    const savedKwh = (top.entry.watts * 1 * top.entry.quantity) / 1000;
    const savedPerMonth = savedKwh * ratePerKwh * DAYS_PER_MONTH;
    insights.push({
      title: `${top.entry.label} is your biggest cost`,
      detail: `It makes up ${(top.share * 100).toFixed(0)}% of this estimate. Using it 1 hour less per day saves about ${currency}${savedPerMonth.toFixed(2)}/month.`,
      savingPerMonth: savedPerMonth,
    });
  }

  // 洞察 2：白炽灯换 LED（75W → 9W 是行业常用对比值）
  const bulb = result.items.find(
    (i) => i.entry.presetId === 'incandescent-bulb'
  );
  if (bulb && bulb.costPerDay > 0) {
    const ledWatts = 9;
    const savedKwh =
      ((bulb.entry.watts - ledWatts) *
        bulb.entry.hoursPerDay *
        bulb.entry.quantity) /
      1000;
    if (savedKwh > 0) {
      const savedPerMonth = savedKwh * ratePerKwh * DAYS_PER_MONTH;
      insights.push({
        title: 'Switch to LED bulbs',
        detail: `Replacing your incandescent bulbs with 9W LEDs saves about ${currency}${savedPerMonth.toFixed(2)}/month.`,
        savingPerMonth: savedPerMonth,
      });
    }
  }

  // 洞察 3：电价敏感度，让用户理解“换更便宜电价”的价值
  if (result.totalKwhPerDay > 0 && ratePerKwh > 0.02) {
    const savedPerMonth = result.totalKwhPerMonth * 0.01;
    insights.push({
      title: 'Your rate matters',
      detail: `Every 1¢/kWh lower rate saves you about ${currency}${savedPerMonth.toFixed(2)}/month on this usage.`,
      savingPerMonth: savedPerMonth,
    });
  }

  return insights.sort((a, b) => b.savingPerMonth - a.savingPerMonth);
}
