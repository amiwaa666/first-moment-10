<template>
  <header class="header">
    <nav class="nav">
      <router-link to="/" class="logo">
        First Moments
        <span class="logo-dot"></span>
      </router-link>
      <div v-if="isAuthenticated" class="user-info">
        <div class="user-menu" @click="toggleMenu">
          <span class="user-initial">{{ userInitial }}</span>
        </div>
        <transition name="fade">
          <div v-if="isMenuOpen" class="dropdown-menu">
            <div class="menu-email">{{ userEmail }}</div>
            <button @click="handleLogout" class="menu-item logout-button" :disabled="isLoading">
              <span class="icon">⇥</span>
              {{ isLoading ? 'ログアウト中...' : 'ログアウト' }}
            </button>
          </div>
        </transition>
      </div>
      <div v-else class="auth-links">
        <router-link to="/login" class="auth-button login-link">
          <span class="icon">⇥</span>
          ログイン
        </router-link>
      </div>
    </nav>
  </header>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'AppHeader',
  setup() {
    const store = useStore();
    const router = useRouter();
    const isLoading = ref(false);
    const isMenuOpen = ref(false);

    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const userEmail = computed(() => store.state.user?.email);
    const userInitial = computed(() => {
      const email = store.state.user?.email;
      return email ? email[0].toUpperCase() : '';
    });

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value;
    };

    const handleLogout = async () => {
      try {
        isLoading.value = true;
        isMenuOpen.value = false;
        await store.dispatch('signOut');
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        isLoading.value = false;
      }
    };

    return {
      isAuthenticated,
      userEmail,
      userInitial,
      isLoading,
      isMenuOpen,
      toggleMenu,
      handleLogout,
    };
  },
});
</script>

<style scoped lang="scss">
.header {
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.9);
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover .logo-dot {
    transform: scale(1.2);
  }
}

.logo-dot {
  width: 4px;
  height: 4px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: inline-block;
  transition: var(--transition);
}

.user-info {
  position: relative;
}

.user-menu {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);

  &:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}

.user-initial {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  min-width: 220px;
  padding: 0.5rem;
  transform-origin: top right;
  
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    right: 1rem;
    width: 8px;
    height: 8px;
    background-color: var(--surface-color);
    transform: rotate(45deg);
    box-shadow: var(--shadow-sm);
  }
}

.menu-email {
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  border-bottom: 1px solid #eee;
  margin-bottom: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
  gap: 0.5rem;
  transition: var(--transition);

  .icon {
    font-size: 1rem;
    opacity: 0.5;
  }

  &:hover {
    background-color: #f5f5f5;
  }

  &.logout-button {
    color: var(--danger-color);

    &:hover {
      background-color: var(--danger-light);
    }

    &:disabled {
      color: var(--text-secondary);
      background-color: transparent;
      cursor: not-allowed;
    }
  }
}

.auth-links {
  display: flex;
  gap: 1rem;
}

.auth-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: var(--transition);

  .icon {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  &.login-link {
    background-color: var(--primary-color);
    color: white;
    box-shadow: var(--shadow-sm);

    &:hover {
      background-color: var(--primary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
  }
}

// アニメーション
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media (max-width: 480px) {
  .nav {
    padding: 0.5rem 0.75rem;
  }

  .logo {
    font-size: 0.9375rem;
  }

  .user-menu {
    width: 1.75rem;
    height: 1.75rem;
  }

  .user-initial {
    font-size: 0.75rem;
  }

  .dropdown-menu {
    right: -0.5rem;
    min-width: 180px;
  }

  .auth-button {
    padding: 0.375rem 0.875rem;
    font-size: 0.75rem;
  }
}
</style> 