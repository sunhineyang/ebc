/**
 * Calculator 主题 block（接入层）
 * -------------------------------------------------
 * 作用：让计算器像 hero/faq 一样，可以直接写进页面 JSON 配置：
 *   "calculator": { "block": "calculator", "title": "...", ... }
 * DynamicPage 会通过 getThemeBlock('calculator') 自动加载这里。
 *
 * 真正的计算逻辑与交互都在 shared/blocks/calculator，
 * 这里只负责套上标题、描述和页面配置，保持与其他 block 一致的用法。
 */
import { ApplianceCalculator } from '@/shared/blocks/calculator';
import { Section } from '@/shared/types/blocks/landing';

export function Calculator({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <section id={section.id} className={`py-8 md:py-12 ${className ?? ''}`}>
      <div className="container">
        {/* 标题和描述可选：首页 hero 已有 H1 时，这里可以不传 */}
        {section.title && (
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="text-foreground mb-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground">{section.description}</p>
            )}
          </div>
        )}

        <ApplianceCalculator
          config={{
            // 这些都可以在页面 JSON 里覆盖，实现“一套组件、多个工具页”
            currency: section.currency ?? '$',
            defaultRate: section.default_rate ?? 0.17,
            defaultPresets: section.default_presets,
            showInsights: section.show_insights !== false,
          }}
        />
      </div>
    </section>
  );
}
