import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { auth } from "@/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/achievements",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: { requiresGuest: true },
    beforeEnter: (to, from, next) => {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // ログイン済みの場合は一覧画面にリダイレクト
          next('/achievements');
        } else {
          // ログインしていない場合はログイン画面に遷移
          next();
        }
      });
    },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/Register.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/achievements",
    name: "AchievementList",
    component: () => import("@/views/AchievementList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/achievements/new",
    name: "AchievementNew",
    component: () => import("@/views/AchievementNew.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/achievements/:id",
    name: "AchievementDetail",
    component: () => import("@/views/AchievementDetail.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// ナビゲーションガード
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest);
  const isAuthenticated = !!auth.currentUser;

  // 認証が必要なルートに未認証でアクセスした場合
  if (requiresAuth && !isAuthenticated) {
    next("/login");
    return;
  }

  // ゲスト専用ルートに認証済みでアクセスした場合
  if (requiresGuest && isAuthenticated) {
    next("/achievements");
    return;
  }

  next();
});

export default router;
