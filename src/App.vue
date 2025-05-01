<template>
  <div id="app">
    <Header />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Header from '@/components/Header.vue';

export default defineComponent({
  name: 'App',
  components: {
    Header,
  },
});
</script>

<style lang="scss">
:root {
  --primary-color: #8d6e63;
  --primary-dark: #6d4c41;
  --primary-light: #e8d5c8;
  --danger-color: #f44336;
  --danger-light: #ffebee;
  --text-primary: #2c1810;
  --text-secondary: #666;
  --background-color: #fff9f0;
  --surface-color: #ffffff;
  --border-radius: 12px;
  --shadow-sm: 0 2px 4px rgba(93, 64, 55, 0.05);
  --shadow-md: 0 4px 6px rgba(93, 64, 55, 0.07);
  --shadow-lg: 0 10px 15px rgba(93, 64, 55, 0.1);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --button-font: "Hiragino Maru Gothic ProN", "Rounded Mplus 1c", "Hiragino Sans", sans-serif;
}

#app {
  font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  min-height: 100vh;
  background-color: var(--background-color);
}

.main-content {
  padding-top: 3rem;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

// アニメーション
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 共通のスタイル
.card {
  background: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  
  &.primary {
    background-color: var(--primary-color);
    color: white;
    
    &:hover {
      background-color: var(--primary-dark);
      transform: translateY(-1px);
    }
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;

  h1 {
    margin-bottom: 0;
    font-size: 1.125rem;
  }
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
  transition: var(--transition);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }
}

// レスポンシブ設定
@media (max-width: 480px) {
  .main-content {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .button {
    padding: 0.375rem 0.875rem;
    font-size: 0.8125rem;
  }

  .page-header {
    h1 {
      font-size: 1rem;
    }
  }
}
</style>
