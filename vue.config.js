const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  parallel: false,
  chainWebpack: config => {
    // TypeScriptチェックを完全に無効化
    config.plugins.delete('fork-ts-checker');
  },
  // PWA設定を追加
  pwa: {
    name: 'First Moments',
    themeColor: '#D4C5B9',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      exclude: [/\.map$/, /_redirects/],
      runtimeCaching: [
        {
          urlPattern: new RegExp('^https://firebasestorage\\.googleapis\\.com/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'firebase-storage',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30日
            }
          }
        }
      ]
    },
    // アイコンを直接指定する代わりに、デフォルトのアイコン生成を使用
    iconPaths: {
      favicon32: 'img/icons/favicon-32x32.png',
      favicon16: 'img/icons/favicon-16x16.png',
      appleTouchIcon: 'img/icons/apple-touch-icon.png',
      maskIcon: 'img/icons/safari-pinned-tab.svg',
      msTileImage: 'img/icons/msapplication-icon-144x144.png'
    },
    manifestOptions: {
      display: 'standalone',
      background_color: '#FFFFFF',
      icons: [
        {
          src: 'img/icons/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png'
        },
        {
          src: 'img/icons/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png'
        },
        {
          src: 'img/icons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png'
        },
        {
          src: 'img/icons/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'img/icons/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  }
});
