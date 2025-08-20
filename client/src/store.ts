import { configureStore } from '@reduxjs/toolkit';

import wizardReducer from './features/wizardSlice';
import siteWorksReducer from './features/siteWorksSlice';

export const store = configureStore({
  reducer: {
    wizard: wizardReducer,
    siteWorks: siteWorksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
