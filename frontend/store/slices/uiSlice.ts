import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalType: string | null;
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
    duration?: number;
  }>;
  loadingStates: Record<string, boolean>;
}

const initialState: UIState = {
  sidebarOpen: false,
  modalOpen: false,
  modalType: null,
  notifications: [],
  loadingStates: {},
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modalOpen = true;
      state.modalType = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalType = null;
    },
    addNotification: (
      state,
      action: PayloadAction<{
        id: string;
        type: "success" | "error" | "info" | "warning";
        message: string;
        duration?: number;
      }>
    ) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    setLoadingState: (
      state,
      action: PayloadAction<{ key: string; loading: boolean }>
    ) => {
      state.loadingStates[action.payload.key] = action.payload.loading;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  setLoadingState,
} = uiSlice.actions;

export default uiSlice.reducer;
