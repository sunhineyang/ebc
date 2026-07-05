import { getTranslations, setRequestLocale } from 'next-intl/server';

import { envConfigs } from '@/config';
import { getThemePage } from '@/core/theme';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const revalidate = 3600;

// 首页 SEO：读取 pages/index.json 里的 metadata，
// canonical 指向根路径 "/"（默认语言下生成 https://域名/ ，结尾带斜杠）
export const generateMetadata = getMetadata({
  metadataKey: 'pages.index.metadata',
  canonicalUrl: '/',
});

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.index');

  // get page data
  const page: DynamicPage = t.raw('page');

  // load page component
  const Page = await getThemePage('dynamic-page');

  // ================================================================
  // JSON-LD 结构化数据：帮助 Google 理解页面内容，争取富文本搜索结果
  // 1. WebApplication：告诉 Google 这是一个在线工具应用
  // 2. FAQPage：让 FAQ 模块有机会拿到 Google 精选摘要（搜索结果直接显示问答）
  // 数据全部来自 pages/index.json，不需要重复维护
  // ================================================================
  const appUrl = envConfigs.app_url;

  const faqEntities =
    page.sections?.faq?.items?.map((item, index) => ({
      '@type': 'Question',
      '@id': `${appUrl}/#faq-question-${index}`,
      position: index + 1,
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })) ?? [];

  const jsonLdData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Watti Electricity Calculator',
      url: `${appUrl}/`,
      description: page.sections?.hero?.description || '',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: page.sections?.features?.items?.map((f) => f.title) ?? [],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      url: `${appUrl}/`,
      mainEntity: faqEntities,
    },
  ];

  return (
    <>
      {/* JSON-LD 结构化数据，放在页面最前面 */}
      {jsonLdData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      <Page locale={locale} page={page} />
    </>
  );
}
