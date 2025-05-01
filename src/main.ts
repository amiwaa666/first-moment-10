import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

// 認証状態の初期化
store.dispatch('initializeAuth').then(() => {
  createApp(App).use(store).use(router).mount("#app");
});
