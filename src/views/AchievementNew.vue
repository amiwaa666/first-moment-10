<template>
  <div class="achievement-new">
    <header class="header">
      <button @click="goBack" class="back-button">戻る</button>
      <h1>新しい記録を追加</h1>
    </header>

    <form @submit.prevent="saveAchievement" class="achievement-form">
      <div class="form-group">
        <label for="photo">写真</label>
        <div
          class="photo-upload-area"
          @dragover.prevent
          @drop.prevent="handlePhotoDrop"
          :class="{ 'has-preview': photoPreview }"
        >
          <div v-if="!photoPreview" class="upload-placeholder">
            <span class="upload-icon">📸</span>
            <p class="upload-text">クリックまたはドラッグ&ドロップで写真を追加</p>
            <p class="upload-hint">推奨: 1280px以下の画像</p>
          </div>
          <div v-else class="preview-container">
            <img :src="photoPreview" alt="プレビュー" class="preview-image" />
            <button type="button" @click="removePhoto" class="remove-photo">
              ✕
            </button>
            <div class="image-info" v-if="originalSize && compressedSize">
              <p>元のサイズ: {{ formatFileSize(originalSize) }}</p>
              <p>圧縮後のサイズ: {{ formatFileSize(compressedSize) }}</p>
              <p>圧縮率: {{ compressionRatio }}%</p>
            </div>
          </div>
          <input
            id="photo"
            type="file"
            @change="handlePhotoChange"
            accept="image/*"
            required
            class="file-input"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="title">タイトル</label>
        <div class="title-input-container">
          <input
            id="title"
            v-model="title"
            type="text"
            required
            maxlength="15"
            placeholder="例：はじめての一歩"
          />
          <span class="character-count" :class="{ 'near-limit': title.length >= 12 }">
            {{ title.length }}/15
          </span>
        </div>
      </div>

      <div class="form-group">
        <label for="date">日付</label>
        <input id="date" v-model="date" type="date" required />
      </div>

      <div class="form-group">
        <label for="tags">タグ:</label>
        <div class="tag-list">
          <div 
            v-for="tag in TAGS" 
            :key="tag" 
            class="tag"
            :class="{ 'selected': selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>

      <div class="button-group">
                <button type="button" @click="goBack" class="cancel-button">
          キャンセル
        </button>
        <button type="submit" class="save-button" :disabled="isSaving">
          {{ isSaving ? '保存中...' : '保存する' }}
        </button>

      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '@/firebase';
import { useStore } from 'vuex';
import imageCompression from 'browser-image-compression';
import exifr from 'exifr';
import { TAGS } from '@/constants/tags';

export default defineComponent({
  name: 'AchievementNew',
  setup() {
    const router = useRouter();
    const store = useStore();
    const title = ref('');
    const date = ref('');
    const photoFile = ref<File | null>(null);
    const compressedPhotoFile = ref<File | null>(null);
    const photoPreview = ref<string>('');
    const isSaving = ref(false);
    const error = ref('');
    const originalSize = ref<number | null>(null);
    const compressedSize = ref<number | null>(null);
    const takenDate = ref<Date | null>(null);
    const selectedTags = ref<string[]>([]);

    const compressionRatio = computed(() => {
      if (originalSize.value && compressedSize.value) {
        const ratio = 100 - (compressedSize.value / originalSize.value) * 100;
        return ratio.toFixed(1);
      }
      return '0';
    });

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) {
        return bytes + ' B';
      } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
      } else {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      }
    };

    const compressImage = async (file: File) => {
      const options = {
        maxSizeMB: 0.5,           // 最大500KB
        maxWidthOrHeight: 1280,   // 最大幅または高さ1280px
        useWebWorker: true,
        fileType: file.type,
      };

      try {
        originalSize.value = file.size;
        const compressedFile = await imageCompression(file, options);
        compressedSize.value = compressedFile.size;
        return compressedFile;
      } catch (error) {
        console.error('画像圧縮エラー:', error);
        return file; // 圧縮に失敗した場合は元のファイルを返す
      }
    };

    const handlePhotoChange = async (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        photoFile.value = file;
        
        // 画像の撮影日を取得し、日付項目に設定
        const takenDate = await getImageDate(file);
        if (takenDate) {
          date.value = formatDate(takenDate);
        } else {
          console.warn('撮影日の取得に失敗しました。ファイル名:', file.name);
        }
        
        // 画像を圧縮
        compressedPhotoFile.value = await compressImage(file);
        
        // プレビュー表示
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.value = e.target?.result as string;
        };
        reader.readAsDataURL(compressedPhotoFile.value);
      }
    };

    // 画像の撮影日を取得する関数を修正
    const getImageDate = async (file: File): Promise<Date | null> => {
      try {
        const exifData = await exifr.parse(file);
        if (exifData && exifData.DateTimeOriginal) {
          return new Date(exifData.DateTimeOriginal);
        } else {
          console.warn('EXIF情報に撮影日が含まれていません。ファイル名:', file.name);
          return null;
        }
      } catch (error) {
        console.error('EXIF情報の解析に失敗しました。ファイル名:', file.name, 'エラー:', error);
        return null;
      }
    };

    // 日付をYYYY-MM-DD形式にフォーマットする関数を追加
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const handlePhotoDrop = async (event: DragEvent) => {
      event.preventDefault();
      const dataTransfer = event.dataTransfer;
      if (dataTransfer && dataTransfer.files) {
        const file = dataTransfer.files[0];
        photoFile.value = file;
        
        // 画像の撮影日を取得し、日付項目に設定
        const takenDate = await getImageDate(file);
        if (takenDate) {
          date.value = formatDate(takenDate);
        } else {
          console.warn('撮影日の取得に失敗しました。ファイル名:', file.name);
        }
        
        // 画像を圧縮
        compressImage(file);
        
        // プレビュー表示
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };

    const removePhoto = () => {
      console.log('removePhoto called');
      photoFile.value = null;
      compressedPhotoFile.value = null;
      photoPreview.value = '';
      takenDate.value = null;
      date.value = '';
      
      // ファイル選択inputをクリア
      const fileInput = document.getElementById('photo') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    };

    const saveAchievement = async () => {
      if (!compressedPhotoFile.value) return;
      if (!store.state.user) {
        error.value = 'ログインが必要です';
        return;
      }

      try {
        isSaving.value = true;
        error.value = '';

        // 圧縮された画像をアップロード
        const userId = store.state.user.uid;
        const timestamp = Date.now();
        const fileName = `${timestamp}_${userId}_${compressedPhotoFile.value.name}`;
        const imageRef = storageRef(
          storage,
          `achievements/${fileName}`
        );
        await uploadBytes(imageRef, compressedPhotoFile.value);
        const photoUrl = await getDownloadURL(imageRef);

        // Firestoreにデータを保存
        const achievementData = {
          userId: userId,
          title: title.value,
          date: Timestamp.fromDate(new Date(date.value)),
          photoUrl,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          tags: selectedTags.value,
        };

        const docRef = await addDoc(
          collection(db, 'achievements'),
          achievementData
        );
        
        // 一覧画面に戻る
        router.push('/achievements');
      } catch (err) {
        console.error('Error saving achievement:', err);
        error.value = '保存中にエラーが発生しました。もう一度お試しください。';
      } finally {
        isSaving.value = false;
      }
    };

    const goBack = () => {
      router.back();
    };

    const toggleTag = (tag: string) => {
      if (selectedTags.value.includes(tag)) {
        selectedTags.value = selectedTags.value.filter(t => t !== tag);
      } else {
        selectedTags.value.push(tag);
      }
    };

    return {
      title,
      date,
      photoFile,
      photoPreview,
      error,
      isSaving,
      handlePhotoChange,
      handlePhotoDrop,
      removePhoto,
      saveAchievement,
      goBack,
      originalSize,
      compressedSize,
      compressionRatio,
      formatFileSize,
      selectedTags,
      TAGS,
      toggleTag,
    };
  },
});
</script>

<style lang="scss" scoped>
.achievement-new {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif;
  color: var(--text-primary);
  background-color: var(--background-color);

  .header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 40px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(to right, var(--primary-color), var(--primary-dark), var(--primary-color));
      border-radius: 3px;
    }

    h1 {
      color: var(--text-primary);
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.03em;
      position: relative;
      margin: 0;
    }
  }

  .back-button {
    background: none;
    border: 2px solid var(--primary-color);
    font-size: 15px;
    color: var(--primary-color);
    cursor: pointer;
    padding: 8px 16px;
    transition: var(--transition);
    border-radius: 20px;
    font-weight: 600;
    font-family: var(--button-font);
    letter-spacing: 0.02em;

    &:hover {
      color: white;
      background: var(--primary-color);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }
}

.achievement-form {
  background: var(--surface-color);
  padding: 40px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, var(--primary-color), var(--primary-dark), var(--primary-color));
  }

  .form-group {
    margin-bottom: 35px;
    position: relative;

    label {
      display: inline-block;
      margin-bottom: 12px;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 16px;
      background: var(--surface-color);
      padding: 0 8px;
      border-radius: 4px;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 0;
        width: 20px;
        height: 2px;
        background: var(--primary-color);
        border-radius: 2px;
      }
    }

    input[type='text'],
    input[type='date'] {
      width: 100%;
      padding: 14px;
      border: 2px solid var(--primary-color);
      border-radius: var(--border-radius);
      font-size: 16px;
      background-color: var(--surface-color);
      transition: var(--transition);
      box-shadow: var(--shadow-sm);

      &:focus {
        border-color: var(--primary-dark);
        outline: none;
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
    }
  }
}

.photo-upload-area {
  border: 3px dashed var(--primary-color);
  border-radius: var(--border-radius);
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  background-color: var(--surface-color);
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);

  &:hover {
    border-color: var(--primary-dark);
    background-color: var(--background-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.has-preview {
    padding: 0;
    border-style: solid;
    border-color: var(--primary-dark);
    background-color: var(--surface-color);
  }
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    var(--background-color),
    var(--background-color) 10px,
    var(--surface-color) 10px,
    var(--surface-color) 20px
  );

  .upload-icon {
    font-size: 64px;
    margin-bottom: 16px;
    color: var(--primary-color);
    transform-origin: center;
    animation: pulse 2s infinite;
  }

  .upload-text {
    font-size: 18px;
    color: var(--text-primary);
    margin: 0;
    font-weight: 600;
    line-height: 1.6;
  }

  .upload-hint {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
    background: rgba(255, 255, 255, 0.8);
    padding: 6px 12px;
    border-radius: 16px;
    backdrop-filter: blur(4px);
  }
}

.preview-container {
  position: relative;
  width: 100%;
  border-radius: var(--border-radius);
  overflow: hidden;

  .preview-image {
    width: 100%;
    height: auto;
    display: block;
    border-radius: var(--border-radius);
    transition: var(--transition);
  }

  &:hover {
    .preview-image {
      transform: scale(1.02);
    }

    .image-info {
      transform: translateY(0);
    }
  }

  .remove-photo {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: var(--transition);
    backdrop-filter: blur(4px);
    z-index: 1000;
    pointer-events: auto;

    &:hover {
      background: rgba(0, 0, 0, 0.85);
      transform: scale(1.1) rotate(90deg);
    }
  }
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.image-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 16px;
  font-size: 14px;
  backdrop-filter: blur(8px);
  transform: translateY(100%);
  transition: var(--transition);

  p {
    margin: 6px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.button-group {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 40px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--primary-color), transparent);
  }
}

.cancel-button,
.save-button {
  padding: 14px 28px;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  font-family: var(--button-font);
  letter-spacing: 0.02em;
}

.cancel-button {
  background-color: var(--background-color);
  color: var(--text-primary);

  &:hover {
    background-color: var(--surface-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
}

.save-button {
  background: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-sm);

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.error-message {
  margin-top: 24px;
  padding: 16px;
  color: var(--danger-color);
  background-color: var(--danger-light);
  border-radius: var(--border-radius);
  text-align: center;
  border: 1px solid var(--danger-color);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  animation: shake 0.5s ease-in-out;
}

.title-input-container {
  position: relative;
  display: flex;
  align-items: center;

  .character-count {
    position: absolute;
    right: 14px;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    pointer-events: none;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 12px;
    backdrop-filter: blur(4px);

    &.near-limit {
      color: var(--danger-color);
      animation: pulse 1s infinite;
    }
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

// レスポンシブ対応
@media (max-width: 480px) {
  .achievement-new {
    padding: 16px;

    .header {
      margin-bottom: 30px;
      gap: 12px;

      h1 {
        font-size: 24px;
      }
    }

    .back-button {
      font-size: 14px;
      padding: 6px 12px;
    }
  }

  .achievement-form {
    padding: 24px;

    .form-group {
      margin-bottom: 24px;

      label {
        font-size: 14px;
      }

      input[type='text'],
      input[type='date'] {
        padding: 12px;
        font-size: 14px;
      }
    }
  }

  .photo-upload-area {
    min-height: 200px;
    padding: 20px;
  }

  .upload-placeholder {
    .upload-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .upload-text {
      font-size: 16px;
    }

    .upload-hint {
      font-size: 12px;
    }
  }

  .button-group {
    margin-top: 30px;
    flex-direction: column-reverse;
    gap: 12px;
  }

  .cancel-button,
  .save-button {
    width: 100%;
    padding: 12px;
    font-size: 14px;
  }

  .character-count {
    font-size: 12px;
    padding: 3px 6px;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--primary-light);
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: var(--transition);

  &:hover {
    background: var(--background-color);
  }

  &.selected {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}
</style>
