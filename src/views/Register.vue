<template>
  <div class="register">
    <h1>新規登録</h1>
    <form @submit.prevent="handleRegister" class="register-form">
      <div class="form-group">
        <label for="email">メールアドレス</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="example@example.com"
        />
      </div>

      <div class="form-group">
        <label for="password">パスワード</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="パスワードを入力（6文字以上）"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">パスワード（確認）</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          required
          placeholder="パスワードを再入力"
        />
      </div>

      <div class="button-group">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? '登録中...' : '登録する' }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="links">
        <router-link to="/login">ログインはこちら</router-link>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';

export default defineComponent({
  name: 'UserRegister',
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const isLoading = ref(false);

    const handleRegister = async () => {
      if (password.value !== confirmPassword.value) {
        error.value = 'パスワードが一致しません';
        return;
      }

      if (password.value.length < 6) {
        error.value = 'パスワードは6文字以上で入力してください';
        return;
      }

      try {
        isLoading.value = true;
        error.value = '';
        await createUserWithEmailAndPassword(auth, email.value, password.value);
        router.push('/achievements');
      } catch (err: any) {
        console.error('Registration error:', err);
        if (err.code === 'auth/email-already-in-use') {
          error.value = 'このメールアドレスは既に使用されています。別のメールアドレスを試すか、ログインしてください。';
        } else if (err.code === 'auth/invalid-email') {
          error.value = '有効なメールアドレスを入力してください。';
        } else if (err.code === 'auth/weak-password') {
          error.value = 'パスワードが弱すぎます。より強力なパスワードを設定してください。';
        } else {
          error.value = '登録に失敗しました。入力内容を確認してください。';
        }
      } finally {
        isLoading.value = false;
      }
    };

    return {
      email,
      password,
      confirmPassword,
      error,
      isLoading,
      handleRegister,
    };
  },
});
</script>

<style scoped lang="scss">
.register {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;

  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }
}

.register-form {
  .form-group {
    margin-bottom: 1rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  }

  .button-group {
    margin-top: 2rem;

    button {
      width: 100%;
      padding: 0.75rem;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
    }
  }

  .error-message {
    color: #f44336;
    margin-top: 1rem;
    text-align: center;
  }

  .links {
    margin-top: 1rem;
    text-align: center;

    a {
      color: #2196F3;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style> 