import { configureStore } from '@reduxjs/toolkit';


import wizardReducer from './features/wizardSlice';
import siteWorksReducer from './features/siteWorksSlice';
import siteVisitReducer from './features/siteVisitSlice';

export const store = configureStore({
  reducer: {
  wizard: wizardReducer,
  siteWorks: siteWorksReducer,
  siteVisit: siteVisitReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
