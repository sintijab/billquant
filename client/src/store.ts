import { configureStore } from '@reduxjs/toolkit';



import wizardReducer from './features/wizardSlice';
import siteWorksReducer from './features/siteWorksSlice';
import siteVisitReducer from './features/siteVisitSlice';
import boqReducer from './features/boqSlice';

export const store = configureStore({
  reducer: {
  wizard: wizardReducer,
  siteWorks: siteWorksReducer,
  siteVisit: siteVisitReducer,
  boq: boqReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
