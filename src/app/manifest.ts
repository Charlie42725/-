import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '失控事務所 - GK.盲盒.一番賞',
    short_name: '失控事務所',
    description: '歡迎失控事務所，理智請寄放在門口。GK、盲盒、一番賞，提供最公平、公正、公開的抽賞體驗。',
    start_url: '/',
    display: 'standalone',
    background_color: '#161B26',
    theme_color: '#161B26',
    orientation: 'portrait',
    icons: [
      {
        src: '/assets/images/logos/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/images/logos/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/assets/images/logos/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/images/logos/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
