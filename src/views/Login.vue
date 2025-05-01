<template>
  <div class="login">
    <div class="background"></div>
    <div class="login-container">
      <h1>Login</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="メールアドレス"
          />
        </div>

        <div class="form-group">
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="パスワード"
          />
        </div>

        <div class="button-group">
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'ログイン中...' : 'ログイン' }}
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="links">
          <router-link to="/register">アカウントを作成</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';

export default defineComponent({
  name: 'UserLogin',
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const isLoading = ref(false);

    const handleLogin = async () => {
      try {
        isLoading.value = true;
        error.value = '';
        await signInWithEmailAndPassword(auth, email.value, password.value);
        router.push('/achievements');
      } catch (err: any) {
        console.error('Login error:', err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          error.value = 'メールアドレスまたはパスワードが正しくありません。';
        } else if (err.code === 'auth/invalid-email') {
          error.value = '有効なメールアドレスを入力してください。';
        } else if (err.code === 'auth/too-many-requests') {
          error.value = 'ログイン試行回数が多すぎます。しばらく時間をおいてから再試行してください。';
        } else {
          error.value = 'ログインに失敗しました。入力内容を確認してください。';
        }
      } finally {
        isLoading.value = false;
      }
    };

    return {
      email,
      password,
      error,
      isLoading,
      handleLogin,
    };
  },
});
</script>

<style scoped lang="scss">
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  z-index: -1;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.login-container {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
  backdrop-filter: blur(10px);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  font-family: 'Roboto', sans-serif;
  color: #2c3e50;
}

.login-form {
  .form-group {
    margin-bottom: 1.5rem;

    input {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 25px;
      font-family: 'Roboto', sans-serif;
      background-color: rgba(255, 255, 255, 0.8);
      transition: all 0.3s;

      &:focus {
        outline: none;
        box-shadow: 0 0 5px rgba(35, 166, 213, 0.5);
        background-color: rgba(255, 255, 255, 0.9);
      }

      &::placeholder {
        color: #999;
      }
    }
  }

  .button-group {
    margin-top: 2rem;

    button {
      width: 100%;
      padding: 0.75rem;
      background: #23a6d5;
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-family: 'Roboto', sans-serif;
      transition: all 0.3s;

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      &:hover {
        background: #1a8cb8;
      }
    }
  }

  .error-message {
    color: #e74c3c;
    margin-top: 1rem;
    text-align: center;
    font-family: 'Roboto', sans-serif;
  }

  .links {
    margin-top: 1rem;
    text-align: center;

    a {
      color: #3498db;
      text-decoration: none;
      font-family: 'Roboto', sans-serif;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@keyframes iconBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@media screen and (max-width: 480px) {
  .login-container {
    width: 100%;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>