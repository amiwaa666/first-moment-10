<template>
  <div class="achievement-detail">
    <header class="header">
      <div class="header-left">
        <button @click="goBack" class="back-button" aria-label="戻る">
          <span class="material-icons">arrow_back</span>
        </button>
      </div>
      <div class="header-right">
        <div v-if="achievement" class="action-buttons">
          <button v-if="!isEditMode" @click="toggleEditMode" class="edit-button">
            編集
          </button>
          <button v-if="!isEditMode" @click="showDeleteConfirm = true" class="delete-button">
            削除
          </button>
          <button v-if="isEditMode" @click="saveChanges" :disabled="isSaving" class="save-button">
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
          <button v-if="isEditMode" @click="cancelEdit" class="cancel-button">
            キャンセル
          </button>
        </div>
      </div>
    </header>

    <!-- 表示モード -->
    <div v-if="achievement && !isEditMode" class="content">
      <div class="photo-container">
        <img :src="achievement.photoUrl" :alt="achievement.title" />
      </div>
      <div class="info">
        <h2 class="title">{{ achievement.title }}</h2>
        <p class="date">{{ formatDate(achievement.date) }}</p>
        <div class="tags">
         <span 
           v-for="tag in achievement.tags" 
           :key="tag"
           class="tag"
         >
           {{ tag }}
         </span>
       </div>
      </div>
    </div>

    <!-- 編集モード -->
    <div v-else-if="achievement && isEditMode" class="content edit-form">
      <div class="form-group">
        <label>写真</label>
        <div>
          <img :src="achievement.photoUrl" :alt="editedTitle" class="photo-preview" />
          <p class="photo-note">※写真の変更はできません</p>
        </div>
      </div>

      <div class="form-group">
        <label for="title">タイトル</label>
        <div class="title-input-container">
          <input
            id="title"
            v-model="editedTitle"
            type="text"
            required
            maxlength="15"
            placeholder="タイトルを入力"
          />
          <span class="character-count" :class="{ 'near-limit': editedTitle.length >= 12 }">
            {{ editedTitle.length }}/15
          </span>
        </div>
      </div>

      <div class="form-group">
        <label for="date">日付</label>
        <input 
          id="date" 
          v-model="editedDate" 
          type="date" 
          required 
        />
      </div>

      <div class="form-group">
        <label for="tags">タグ:</label>
        <div class="tag-list">
          <div 
            v-for="tag in TAGS" 
            :key="tag" 
            class="tag"
            :class="{ 'selected': editedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>

      <div v-if="editError" class="error-message">
        {{ editError }}
      </div>
    </div>

    <!-- エラー表示 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="goBack">一覧に戻る</button>
    </div>

    <!-- ローディング表示 -->
    <div v-else-if="!achievement && !error" class="loading">
      <p>読み込み中...</p>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="modal-content">
        <h3>記録の削除</h3>
        <p>この記録を削除してもよろしいですか？</p>
        <p class="warning">※この操作は取り消せません</p>
        <div class="modal-buttons">
          <button @click="deleteAchievement" :disabled="isDeleting" class="delete-confirm-button">
            {{ isDeleting ? '削除中...' : '削除する' }}
          </button>
          <button @click="showDeleteConfirm = false" class="cancel-button">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { doc, getDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase';
import { Achievement } from '@/types/achievement';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TAGS } from '@/constants/tags';

export default defineComponent({
  name: 'AchievementDetail',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const achievement = ref<Achievement | null>(null);
    const error = ref<string>('');
    const showDeleteConfirm = ref<boolean>(false);
    const isDeleting = ref<boolean>(false);
    
    // 編集モード関連
    const isEditMode = ref<boolean>(false);
    const editedTitle = ref<string>('');
    const editedDate = ref<string>('');
    const editedTags = ref<string[]>([]);
    const isSaving = ref<boolean>(false);
    const editError = ref<string>('');

    const fetchAchievement = async () => {
      try {
        const docRef = doc(db, 'achievements', route.params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          achievement.value = {
            id: docSnap.id,
            ...docSnap.data(),
          } as Achievement;
          
          // 編集用の初期値を設定
          resetEditForm();
        } else {
          error.value = '記録が見つかりませんでした。';
        }
      } catch (err) {
        console.error('Error fetching achievement:', err);
        error.value = 'データの取得中にエラーが発生しました。';
      }
    };

    const deleteAchievement = async () => {
      if (!achievement.value) return;
      
      try {
        isDeleting.value = true;
        
        // 1. 画像の削除
        // 画像URLからファイル名を抽出
        const photoUrl = achievement.value.photoUrl;
        const filePathMatch = photoUrl.match(/achievements%2F(.+)\?/);
        
        if (filePathMatch && filePathMatch[1]) {
          const filePath = `achievements/${decodeURIComponent(filePathMatch[1])}`;
          const imageRef = storageRef(storage, filePath);
          
          try {
            await deleteObject(imageRef);
          } catch (storageErr) {
            console.error('Error deleting image:', storageErr);
            // 画像削除に失敗してもドキュメント削除は続行
          }
        }
        
        // 2. Firestoreドキュメントの削除
        const docRef = doc(db, 'achievements', achievement.value.id);
        await deleteDoc(docRef);
        
        // 3. 一覧画面に戻る
        router.push('/achievements');
      } catch (err) {
        console.error('Error deleting achievement:', err);
        error.value = '削除中にエラーが発生しました。';
        showDeleteConfirm.value = false;
      } finally {
        isDeleting.value = false;
      }
    };

    // 編集モードの切り替え
    const toggleEditMode = () => {
      isEditMode.value = !isEditMode.value;
      if (isEditMode.value) {
        resetEditForm();
      }
    };

    // 編集フォームのリセット
    const resetEditForm = () => {
      if (achievement.value) {
        editedTitle.value = achievement.value.title;
        
        // Timestampを日付文字列に変換 (YYYY-MM-DD形式)
        if (achievement.value.date && typeof achievement.value.date.toDate === 'function') {
          const dateObj = achievement.value.date.toDate();
          editedDate.value = format(dateObj, 'yyyy-MM-dd');
        }

        // タグの初期化
        editedTags.value = achievement.value.tags || [];
      }
      editError.value = '';
    };

    // 編集のキャンセル
    const cancelEdit = () => {
      isEditMode.value = false;
      resetEditForm();
    };

    // 変更の保存
    const saveChanges = async () => {
      if (!achievement.value) return;
      
      // 入力チェック
      if (!editedTitle.value.trim()) {
        editError.value = 'タイトルを入力してください';
        return;
      }
      
      if (!editedDate.value) {
        editError.value = '日付を選択してください';
        return;
      }
      
      try {
        isSaving.value = true;
        editError.value = '';
        
        // 更新データの準備
        const updatedData = {
          title: editedTitle.value.trim(),
          date: Timestamp.fromDate(new Date(editedDate.value)),
          tags: editedTags.value,
          updatedAt: Timestamp.now()
        };
        
        // Firestoreドキュメントの更新
        const docRef = doc(db, 'achievements', achievement.value.id);
        await updateDoc(docRef, updatedData);
        
        // 成功したら表示モードに戻す
        isEditMode.value = false;
        
        // 表示データを更新
        achievement.value = {
          ...achievement.value,
          ...updatedData
        };
        
      } catch (err) {
        console.error('Error updating achievement:', err);
        editError.value = '更新中にエラーが発生しました。';
      } finally {
        isSaving.value = false;
      }
    };

    const formatDate = (date: any) => {
      // Firestoreのタイムスタンプをjsのdateに変換
      if (date && typeof date.toDate === 'function') {
        return format(date.toDate(), 'yyyy年M月d日', { locale: ja });
      }
      // すでにDate型の場合
      if (date instanceof Date) {
        return format(date, 'yyyy年M月d日', { locale: ja });
      }
      // 日付が無効な場合
      return '日付なし';
    };

    const goBack = () => {
      router.back();
    };

    const toggleTag = (tag: string) => {
      if (editedTags.value.includes(tag)) {
        editedTags.value = editedTags.value.filter(t => t !== tag);
      } else {
        editedTags.value.push(tag);
      }
    };

    onMounted(fetchAchievement);

    return {
      achievement,
      error,
      formatDate,
      goBack,
      showDeleteConfirm,
      isDeleting,
      deleteAchievement,
      TAGS,
      // 編集モード関連
      isEditMode,
      editedTitle,
      editedDate,
      editedTags,
      isSaving,
      editError,
      toggleEditMode,
      cancelEdit,
      saveChanges,
      toggleTag
    };
  }
});
</script>

<style scoped>
.achievement-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 16px;
}

.header-left {
  flex: 0 0 auto;
}

.header-right {
  flex: 0 0 auto;
}

.back-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
  font-family: var(--button-font);
}

.back-button:hover {
  color: #333;
  background-color: rgba(0, 0, 0, 0.04);
}

.back-button .material-icons {
  font-size: 24px;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.edit-button,
.delete-button,
.save-button,
.cancel-button {
  white-space: nowrap;
  padding: 8px 16px;
  font-size: 14px;
  min-width: 80px;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  font-family: var(--button-font);
  letter-spacing: 0.02em;
}

.edit-button {
  background: var(--primary-color);
  color: white;
}

.edit-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.delete-button {
  background-color: var(--danger-color);
  color: white;
}

.delete-button:hover {
  background-color: #d32f2f;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.save-button {
  background: var(--primary-color);
  color: white;
}

.save-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.save-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-button {
  background-color: var(--background-color);
  color: var(--text-primary);
}

.cancel-button:hover {
  background-color: var(--surface-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.content {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.edit-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.form-group input[type='text'],
.form-group input[type='date'] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.photo-container {
  width: 100%;
  max-height: 600px;
  overflow: hidden;
}

.photo-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 400px;
}

.photo-preview {
  width: 250px;
}

.photo-note {
  color: #666;
  font-size: 14px;
  font-style: italic;
  margin-top: 8px;
}

.info {
  padding: 20px;
}

.title {
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  line-height: 1.4;
  word-break: break-all;
}

.date {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  background: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--primary-light);
  border-color: var(--primary-color);
  
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list .tag {
  cursor: pointer;
  transition: var(--transition);
}

.tag-list .tag:hover {
  background: var(--background-color);
}

.tag-list .tag.selected {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.error {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 40px;
}

.error-message {
  color: #f44336;
  margin-top: 1rem;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 5px;
  text-align: center;
}

/* モーダルスタイル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-content p {
  margin-bottom: 16px;
}

.warning {
  color: #f44336;
  font-size: 14px;
  font-weight: bold;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.delete-confirm-button {
  background-color: var(--danger-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
  font-family: var(--button-font);
  letter-spacing: 0.02em;
}

.delete-confirm-button:hover {
  background-color: #d32f2f;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.delete-confirm-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.title-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.character-count {
  position: absolute;
  right: 10px;
  color: #666;
  font-size: 12px;
  pointer-events: none;
}

.near-limit {
  color: #ff9800;
}
</style>
