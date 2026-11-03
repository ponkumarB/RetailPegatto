import { configureStore } from '@reduxjs/toolkit';
import selectuserReducer from './dashboard/SelectChatUserSlice';
import audioCallReducer from './redux/audioCall';
import videoCallReducer from './redux/videoCall';

export const store = configureStore({
  reducer: {
    selectuser: selectuserReducer,
    audioCall: audioCallReducer,
    videoCall: videoCallReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
