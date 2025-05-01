<!-- アチーブメント一覧画面 -->
<template>
  <div class="achievement-list">
    <header class="header">
      <div class="header-title">
        <h1>思い出</h1>
      </div>
      <div class="month-selector">
        <button @click="prevMonth" class="month-nav-button">
          ◀
        </button>
        <div class="current-month" @click="toggleYearSelector">
          {{ formatYearMonth(currentYear, currentMonth) }}
        </div>
        <button @click="nextMonth" class="month-nav-button">
          ▶
        </button>
      </div>
      <div v-if="showYearSelector" class="year-selector">
        <button @click="prevYear" class="year-nav-button">
          ◀
        </button>
        <div class="current-year">
          {{ currentYear }}年
        </div>
        <button @click="nextYear" class="year-nav-button">
          ▶
        </button>
      </div>
      <div class="header-actions">
        <div class="tag-filter">
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
        <button @click="navigateToAdd" class="add-button">
          新しい記録を追加
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading">
      <p>読み込み中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="achievements-container">
      <div v-if="filteredAchievements.length === 0" class="no-data">
        <p>{{ currentYear }}年{{ currentMonth }}月の記録はありません。新しい記録を追加してみましょう！</p>
      </div>
      <template v-else>
        <div class="achievements">
          <div
            v-for="achievement in paginatedAchievements"
            :key="achievement.id"
            @click="showDetail(achievement.id)"
            class="achievement-card"
          >
            <div class="achievement-image">
              <img :src="achievement.photoUrl" :alt="achievement.title" />
            </div>
            <div class="achievement-info">
              <h3>{{ achievement.title }}</h3>
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
        </div>
        
        <!-- ページネーション -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="goToPage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="page-button"
          >
            前へ
          </button>
          
          <div class="page-info">
            {{ currentPage }} / {{ totalPages }}
          </div>
          
          <button 
            @click="goToPage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="page-button"
          >
            次へ
          </button>
        </div>
      </template>
    </div>

    <!-- カレンダー表示 -->
    <div v-if="showCalendar" class="calendar">
      <vue-cal
        :events="events"
        @change="onDateChange"
        :disable-views="['days']"
        :selected-date="selectedDate"
        :style="{ 'max-width': '600px', 'margin': '0 auto' }"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { Achievement } from "@/types/achievement";
import { format, getYear, getMonth } from "date-fns";
import { ja } from "date-fns/locale";
import { useStore } from "vuex";
import VueCal from 'vue-cal';
import 'vue-cal/dist/vuecal.css';
import { TAGS } from '@/constants/tags';

export default defineComponent({
  name: "AchievementList",
  components: {
    VueCal
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const achievements = ref<Achievement[]>([]);
    const loading = ref(true);
    const error = ref("");
    
    // 月別表示のための状態
    const today = new Date();
    const currentYear = ref(getYear(today));
    const currentMonth = ref(getMonth(today) + 1); // JavaScriptの月は0始まり
    const showCalendar = ref(false); // カレンダー表示の状態
    const selectedDate = ref(today);
    const events = ref<{ start: Date; title: string; }[]>([]); // カレンダーのイベント

    // ページネーションのための状態
    const itemsPerPage = 5;
    const currentPage = ref(1);

    const selectedTags = ref<string[]>([]);

    const showYearSelector = ref(false);

    const fetchAchievements = async () => {
      if (!store.state.user) {
        error.value = "ログインが必要です";
        loading.value = false;
        return;
      }

      try {
        const achievementsQuery = query(
          collection(db, "achievements"),
          where("userId", "==", store.state.user.uid),
          orderBy("date", "desc")
        );
        
        const querySnapshot = await getDocs(achievementsQuery);
        achievements.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Achievement[];
        // カレンダーイベントの設定
        events.value = achievements.value.map(achievement => ({
          start: achievement.date.toDate(),
          title: achievement.title,
        }));
      } catch (err) {
        console.error("Error fetching achievements:", err);
        error.value = "データの取得に失敗しました";
      } finally {
        loading.value = false;
      }
    };

    // 選択された月のデータをフィルタリング
    const filteredAchievements = computed(() => {
      if (selectedTags.value.length === 0) {
        return achievements.value.filter(achievement => {
          if (!achievement.date || typeof achievement.date.toDate !== 'function') return false;
          
          const achievementDate = achievement.date.toDate();
          const year = getYear(achievementDate);
          const month = getMonth(achievementDate) + 1; // JavaScriptの月は0始まり
          
          return year === currentYear.value && month === currentMonth.value;
        });
      } else {
        return achievements.value.filter(achievement => {
          if (!achievement.date || typeof achievement.date.toDate !== 'function') return false;
          
          const achievementDate = achievement.date.toDate();
          const year = getYear(achievementDate);
          const month = getMonth(achievementDate) + 1; // JavaScriptの月は0始まり
          
          return year === currentYear.value && month === currentMonth.value && selectedTags.value.every(tag => (achievement.tags || []).includes(tag));
        });
      }
    });

    // ページネーションされたデータ
    const paginatedAchievements = computed(() => {
      const startIndex = (currentPage.value - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredAchievements.value.slice(startIndex, endIndex);
    });

    // 総ページ数
    const totalPages = computed(() => {
      return Math.ceil(filteredAchievements.value.length / itemsPerPage);
    });

    // ページ移動
    const goToPage = async (page: number) => {
      if (page >= 1 && page <= totalPages.value) {
        loading.value = true;
        currentPage.value = page;
        await nextTick();
        // ページトップにスクロール
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        loading.value = false;
      }
    };

    // 月が変わったらページをリセット
    watch([currentYear, currentMonth], () => {
      currentPage.value = 1;
    });

    const formatDate = (date: Timestamp) => {
      return format(date.toDate(), "yyyy年M月d日", { locale: ja });
    };

    const formatYearMonth = (year: number, month: number) => {
      return `${year}年${month}月`;
    };

    const navigateToAdd = () => {
      router.push("/achievements/new");
    };

    const showDetail = (id: string) => {
      store.commit('setScrollPosition', window.scrollY);
      store.commit('setCurrentPage', currentPage.value);
      router.push(`/achievements/${id}`);
    };

    // 年の移動
    const prevYear = () => {
      currentYear.value--;
    };

    const nextYear = () => {
      currentYear.value++;
    };

    // 月の移動
    const prevMonth = () => {
      if (currentMonth.value === 1) {
        currentYear.value--;
        currentMonth.value = 12;
      } else {
        currentMonth.value--;
      }
    };

    const nextMonth = () => {
      if (currentMonth.value === 12) {
        currentYear.value++;
        currentMonth.value = 1;
      } else {
        currentMonth.value++;
      }
    };

    const onDateChange = (date) => {
      selectedDate.value = date;
      currentYear.value = getYear(date);
      currentMonth.value = getMonth(date) + 1; // JavaScriptの月は0始まり
      showCalendar.value = false; // カレンダーを閉じる
    };

    const allTags = computed(() => {
      const tags = new Set<string>();
      if (achievements.value) {
        achievements.value.forEach((achievement: any) => {
          if (achievement.tags) {
            achievement.tags.forEach((tag: string) => tags.add(tag));
          }
        });
      }
      return Array.from(tags);
    });

    const filterByTags = () => {
      // achievements computed property will automatically update
    };

    const toggleTag = (tag: string) => {
      if (selectedTags.value.includes(tag)) {
        selectedTags.value = selectedTags.value.filter(t => t !== tag);
      } else {
        selectedTags.value.push(tag);
      }
    };

    // 年選択の切り替え
    const toggleYearSelector = () => {
      showYearSelector.value = !showYearSelector.value;
    };

    onMounted(async () => {
      await fetchAchievements();
      await nextTick();
      window.scrollTo({
        top: store.state.scrollPosition,
        behavior: 'smooth'
      });
      
      // 保存したページ番号を復元
      const savedPage = store.state.currentPage;
      if (savedPage) {
        currentPage.value = savedPage;
      }
    });

    return {
      achievements,
      filteredAchievements,
      paginatedAchievements,
      loading,
      error,
      formatDate,
      navigateToAdd,
      showDetail,
      currentYear,
      currentMonth,
      prevMonth,
      nextMonth,
      prevYear,
      nextYear,
      formatYearMonth,
      currentPage,
      totalPages,
      goToPage,
      showCalendar,
      selectedDate,
      events,
      onDateChange,
      selectedTags,
      allTags,
      filterByTags,
      TAGS,
      toggleTag,
      showYearSelector,
      toggleYearSelector
    };
  },
});
</script>

<style lang="scss" scoped>
.achievement-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 30px;
  align-items: center;
  text-align: center;

  @media (min-width: 768px) {
    grid-template-columns: 1fr auto 1fr;
    text-align: left;
  }
}

.header-title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;

  @media (min-width: 768px) {
    justify-content: flex-end;
  }
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface-color);
  padding: 8px 16px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin: 0 auto;
  justify-content: center;
}

.month-nav-button {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  border-radius: 50%;
  padding: 0;

  &:hover {
    background-color: var(--background-color);
    transform: scale(1.1);
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
    transform: none;
  }
}

.current-month {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  min-width: 100px;
  text-align: center;
  font-family: var(--button-font);
}

.add-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
  font-family: var(--button-font);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.add-button:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.achievements-container {
  position: relative;
  min-height: 200px;
}

.loading {
  text-align: center;
  padding: 40px;
  background: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin: 20px 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  min-width: 200px;
}

.error, .no-data {
  text-align: center;
  padding: 40px;
  background: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin: 20px 0;
}

.error {
  color: var(--danger-color);
}

.achievements {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.achievement-card {
  background: var(--surface-color);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: var(--transition);
}

.achievement-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}

.achievement-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.achievement-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.achievement-info {
  padding: 15px;
}

.achievement-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: var(--text-primary);
}

.date {
  color: var(--text-secondary);
  margin: 0;
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.page-button {
  background: var(--surface-color);
  color: var(--primary-color);
  border: 1px solid var(--primary-light);
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
  font-family: var(--button-font);

  &:hover:not(:disabled) {
    background: var(--background-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  &:disabled {
    color: #ccc;
    border-color: #eee;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 60px;
  text-align: center;
}

@media (max-width: 480px) {
  .header {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .add-button {
    width: 100%;
    text-align: center;
  }
}

.calendar {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.tag-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  background: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--primary-light);
  border-color: var(--primary-color);
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

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
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

.year-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface-color);
  padding: 8px 16px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin: 0 auto;
  justify-content: center;
}

.year-nav-button {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  border-radius: 50%;
  padding: 0;

  &:hover {
    background-color: var(--background-color);
    transform: scale(1.1);
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
    transform: none;
  }
}

.current-year {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  min-width: 60px;
  text-align: center;
  font-family: var(--button-font);
}
</style>
