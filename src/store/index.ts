import { createStore } from "vuex";
import { User } from "firebase/auth";
import { auth } from "@/firebase";

interface State {
  user: User | null;
  loading: boolean;
  scrollPosition: number;
  currentPage: number;
}

export default createStore({
  state: {
    user: null,
    loading: true,
    scrollPosition: 0,
    currentPage: 1,
  } as State,

  getters: {
    isAuthenticated: (state) => !!state.user,
    currentUser: (state) => state.user,
    isLoading: (state) => state.loading,
  },

  mutations: {
    setUser(state, user: User | null) {
      state.user = user;
    },
    setLoading(state, loading: boolean) {
      state.loading = loading;
    },
    setScrollPosition(state, position: number) {
      state.scrollPosition = position;
    },
    setCurrentPage(state, page: number) {
      state.currentPage = page;
    },
  },

  actions: {
    async initializeAuth({ commit }) {
      // Firebase Authの状態監視
      auth.onAuthStateChanged((user) => {
        commit('setUser', user);
        commit('setLoading', false);
      });
    },

    async signOut({ commit }) {
      try {
        await auth.signOut();
        commit('setUser', null);
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
  },
});
