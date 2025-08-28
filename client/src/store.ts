import { configureStore } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import wizardReducer from './features/wizardSlice';
import siteWorksReducer from './features/siteWorksSlice';
import siteVisitReducer from './features/siteVisitSlice';
import boqReducer from './features/boqSlice';
import priceQuotationReducer from './features/priceQuotationSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['wizard'],
};

const rootReducer = {
  wizard: wizardReducer,
  siteWorks: siteWorksReducer,
  siteVisit: siteVisitReducer,
  boq: boqReducer,
  priceQuotation: priceQuotationReducer,
};

const persistedReducer = persistReducer(persistConfig, (state: any, action: any) => {
  // mimic combineReducers
  return Object.keys(rootReducer).reduce((acc, key) => {
    acc[key] = rootReducer[key as keyof typeof rootReducer](state ? state[key] : undefined, action);
    return acc;
  }, {} as any);
});

export const store = configureStore({
  reducer: persistedReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
