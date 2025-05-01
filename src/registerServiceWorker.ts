/* eslint-disable no-console */

import { register } from "register-service-worker";

// キャッシュをクリアする関数
const clearCache = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          return window.caches.delete(cacheName);
        })
      );
      console.log('All caches cleared successfully');
    } catch (err) {
      console.error('Error clearing caches:', err);
    }
  }
};

// アプリケーションの初回ロード時にキャッシュをクリア
clearCache();

if (process.env.NODE_ENV === "production") {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log(
        "App is being served from cache by a service worker.\n" +
          "For more details, visit https://goo.gl/AFskqB"
      );
    },
    registered(registration) {
      console.log("Service worker has been registered.");
      
      // 24時間ごとにService Workerを更新
      setInterval(() => {
        registration.update();
        console.log('Service Worker update check triggered');
      }, 1000 * 60 * 60 * 24);
    },
    cached() {
      console.log("Content has been cached for offline use.");
    },
    updatefound() {
      console.log("New content is downloading.");
    },
    updated(registration) {
      console.log("New content is available; please refresh.");
      
      // 更新があることをユーザーに通知
      const updateApp = confirm('新しいバージョンがあります。更新しますか？');
      if (updateApp) {
        // 新しいバージョンのService Workerをアクティブにする
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        // キャッシュをクリア
        clearCache().then(() => {
          // ページをリロード
          window.location.reload();
        });
      }
    },
    offline() {
      console.log(
        "No internet connection found. App is running in offline mode."
      );
    },
    error(error) {
      console.error("Error during service worker registration:", error);
    },
  });
}

// Service Workerのメッセージを監視
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // Service Workerが更新された場合、ページをリロード
  window.location.reload();
});
