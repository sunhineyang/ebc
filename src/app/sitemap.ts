import { MetadataRoute } from 'next';

import { envConfigs } from '@/config';

/**
 * 动态生成 sitemap.xml
 * 和 robots.ts 一样，通过 envConfigs.app_url 读取域名，
 * 这样本地开发用 localhost，上线后 .env 改域名就自动同步，不需要手动改文件。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = envConfigs.app_url;

  return [
    {
      url: `${appUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
