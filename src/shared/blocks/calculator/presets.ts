/**
 * 电器预设库（可复用数据层）
 * -------------------------------------------------
 * 瓦数默认值参考 calculator.net / inchcalculator 公开的常见电器功率范围，
 * 取区间内的典型值。用户随时可以在界面上手动修改瓦数。
 */

export interface AppliancePreset {
  id: string; // 唯一标识，engine 里的省钱洞察会用到
  label: string; // 界面显示名（英文，站点默认语言）
  watts: number; // 典型功率（瓦）
  hoursPerDay: number; // 典型每天使用小时数（作为默认值）
  category: 'cooling-heating' | 'kitchen' | 'lighting' | 'entertainment' | 'other';
}

export const APPLIANCE_PRESETS: AppliancePreset[] = [
  // 制冷制热类 —— 账单大头
  { id: 'central-ac', label: 'Central Air Conditioner', watts: 3500, hoursPerDay: 8, category: 'cooling-heating' },
  { id: 'window-ac', label: 'Window AC Unit', watts: 1200, hoursPerDay: 8, category: 'cooling-heating' },
  { id: 'space-heater', label: 'Space Heater', watts: 1500, hoursPerDay: 6, category: 'cooling-heating' },
  { id: 'water-heater', label: 'Electric Water Heater', watts: 4000, hoursPerDay: 3, category: 'cooling-heating' },
  { id: 'ceiling-fan', label: 'Ceiling Fan', watts: 60, hoursPerDay: 8, category: 'cooling-heating' },

  // 厨房类
  { id: 'refrigerator', label: 'Refrigerator', watts: 200, hoursPerDay: 24, category: 'kitchen' },
  { id: 'electric-oven', label: 'Electric Oven', watts: 2400, hoursPerDay: 1, category: 'kitchen' },
  { id: 'microwave', label: 'Microwave Oven', watts: 1100, hoursPerDay: 0.5, category: 'kitchen' },
  { id: 'dishwasher', label: 'Dishwasher', watts: 1400, hoursPerDay: 1, category: 'kitchen' },
  { id: 'coffee-maker', label: 'Coffee Maker', watts: 900, hoursPerDay: 0.5, category: 'kitchen' },

  // 照明类 —— LED 替换洞察依赖 incandescent-bulb 这个 id
  { id: 'led-bulb', label: 'LED Light Bulb', watts: 9, hoursPerDay: 5, category: 'lighting' },
  { id: 'incandescent-bulb', label: 'Incandescent Bulb', watts: 60, hoursPerDay: 5, category: 'lighting' },

  // 娱乐办公类
  { id: 'tv', label: 'Television', watts: 100, hoursPerDay: 4, category: 'entertainment' },
  { id: 'desktop-pc', label: 'Desktop Computer', watts: 200, hoursPerDay: 6, category: 'entertainment' },
  { id: 'laptop', label: 'Laptop', watts: 60, hoursPerDay: 6, category: 'entertainment' },
  { id: 'game-console', label: 'Game Console', watts: 150, hoursPerDay: 2, category: 'entertainment' },

  // 其他大件
  { id: 'washing-machine', label: 'Washing Machine', watts: 800, hoursPerDay: 0.5, category: 'other' },
  { id: 'clothes-dryer', label: 'Clothes Dryer', watts: 3000, hoursPerDay: 0.75, category: 'other' },
  { id: 'ev-charger', label: 'EV Charger', watts: 7200, hoursPerDay: 2, category: 'other' },
  { id: 'custom', label: 'Custom Appliance', watts: 100, hoursPerDay: 1, category: 'other' },
];

/** 按 id 找预设，找不到返回 custom */
export function findPreset(id: string): AppliancePreset {
  return (
    APPLIANCE_PRESETS.find((p) => p.id === id) ||
    APPLIANCE_PRESETS[APPLIANCE_PRESETS.length - 1]
  );
}
