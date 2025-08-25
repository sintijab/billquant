import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/store';


// Thunk to fetch new activity data by price source for a specific row
export const fetchActivityBySource = createAsyncThunk(
  'boq/fetchActivityBySource',
  async ({ activity, description, priceSource, rowIndex }: { activity: string, description: string, priceSource: string, rowIndex?: number }) => {
    // const isDev = import.meta.env.DEV;
    // const LOCAL_API_BASE = 'http://127.0.0.1:8000';
    // let endpoint = '';
    // if (priceSource === 'dei') endpoint = isDev ? `${LOCAL_API_BASE}/search_dei` : `${prodBase.dei}/search_dei`;
    // else if (priceSource === 'pat') endpoint = isDev ? `${LOCAL_API_BASE}/search_pat` : `${prodBase.pat}/search_pat`;
    // else if (priceSource === 'piemonte') endpoint = isDev ? `${LOCAL_API_BASE}/search_piemonte` : `${prodBase.piemonte}/search_piemonte`;
        // const isDev = import.meta.env.DEV;
    // const LOCAL_API_BASE = 'http://127.0.0.1:8000';
    const prodBase = {
      dei: 'https://billquant-dei-production.up.railway.app',
      pat: 'https://billquant-pat-production.up.railway.app',
      piemonte: 'https://billquant-piemonte-production.up.railway.app',
    };
    let endpoint = '';
    if (priceSource === 'dei') endpoint = `${prodBase.dei}/search_dei`;
    else if (priceSource === 'pat') endpoint = `${prodBase.pat}/search_pat`;
    else if (priceSource === 'piemonte') endpoint = `${prodBase.piemonte}/search_piemonte`;
    else throw new Error('Invalid price source');
    const fd = new FormData();
    fd.append('query', description);
    const resp = await fetch(endpoint, {
      method: 'POST',
      body: fd,
    });
    return { activity, priceSource, data: await resp.json(), rowIndex };
  }
);

// Helper to fetch category data (API call)
async function fetchCategoryDataApi(activity: string) {
  try {
    const formData = new FormData();
    formData.append('query', activity);
    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/mistral_activity_categories`, {
      method: 'POST',
      body: formData,
    });
    return await resp.json();
  } catch (e: any) {
    return { error: e?.message || 'Failed to fetch activity categories' };
  }
}

// Redux asyncThunk for fetching category data and storing in state
export const fetchCategoryData = createAsyncThunk(
  'boq/fetchCategoryData',
  async (activity: string) => {
    return await fetchCategoryDataApi(activity);
  }
);

// Helper to normalize price response to always be an array
function extractResults(source: any) {
  if (!source) return [];
  if (Array.isArray(source.results)) return source.results;
  if (source.results && Array.isArray(source.results.Results)) return source.results.Results;
  return [];
}

export const fetchActivityCategoryDei = createAsyncThunk(
  'boq/fetchActivityCategoryDei',
  async (activity: string, { getState }) => {
    const state = getState() as RootState;
    const categoryData = state.boq.categoryData?.[activity];
    if (!categoryData || categoryData.error) {
      return { activity, category: null, deiItems: [], error: categoryData?.error || 'No category data', raw_answer: categoryData?.raw_answer };
    }
    let categories: any[] = [];
    if (Array.isArray(categoryData.it)) {
      categories = categoryData.it;
    } else if (Array.isArray(categoryData.en)) {
      categories = categoryData.en;
    } else if (Array.isArray(categoryData)) {
      categories = categoryData;
    } else if (categoryData) {
      categories = [categoryData];
    }
    const deiItems: any[] = [];
    for (const cat of categories) {
      const mainCategory = cat?.['Main Category'] || '';
      const description = cat?.Description;
      if (!description) continue;
      const fd = new FormData();
      fd.append('query', description);
  const resp = await fetch(`https://billquant-dei-production.up.railway.app/search_dei`, {
        method: 'POST',
        body: fd,
      });
      const raw = await resp.json();
      const items = extractResults(raw);
      for (const item of items) {
        deiItems.push({
          type: 'main',
          activity,
          mainCategory,
          priceSource: 'dei',
          ...item,
        });
        if (Array.isArray(item.resources)) {
          for (const res of item.resources) {
            deiItems.push({
              type: 'resource',
              activity,
              mainCategory,
              priceSource: 'dei',
              ...res,
            });
          }
        }
      }
    }
    return { activity, category: categoryData, deiItems };
  }
);

export const fetchActivityCategoryPat = createAsyncThunk(
  'boq/fetchActivityCategoryPat',
  async (activity: string, { getState }) => {
    const state = getState() as RootState;
    const categoryData = state.boq.categoryData?.[activity];
    if (!categoryData || categoryData.error) {
      return { activity, category: null, patItems: [], error: categoryData?.error || 'No category data', raw_answer: categoryData?.raw_answer };
    }
    let categories: any[] = [];
    if (Array.isArray(categoryData.it)) {
      categories = categoryData.it;
    } else if (Array.isArray(categoryData.en)) {
      categories = categoryData.en;
    } else if (Array.isArray(categoryData)) {
      categories = categoryData;
    } else if (categoryData) {
      categories = [categoryData];
    }
    const patItems: any[] = [];
    for (const cat of categories) {
      const mainCategory = cat?.['Main Category'] || '';
      const description = cat?.Description;
      if (!description) continue;
      const fd = new FormData();
      fd.append('query', description);
  const resp = await fetch(`https://billquant-pat-production.up.railway.app/search_pat`, {
        method: 'POST',
        body: fd,
      });
      const raw = await resp.json();
      const items = extractResults(raw);
      for (const item of items) {
        patItems.push({
          type: 'main',
          activity,
          mainCategory,
          priceSource: 'pat',
          ...item,
        });
        if (Array.isArray(item.resources)) {
          for (const res of item.resources) {
            patItems.push({
              type: 'resource',
              activity,
              mainCategory,
              priceSource: 'pat',
              ...res,
            });
          }
        }
      }
    }
    return { activity, category: categoryData, patItems };
  }
);

export const fetchActivityCategoryPiemonte = createAsyncThunk(
  'boq/fetchActivityCategoryPiemonte',
  async (activity: string, { getState }) => {
    const state = getState() as RootState;
    const categoryData = state.boq.categoryData?.[activity];
    if (!categoryData || categoryData.error) {
      return { activity, category: null, piemonteItems: [], error: categoryData?.error || 'No category data', raw_answer: categoryData?.raw_answer };
    }
    let categories: any[] = [];
    if (Array.isArray(categoryData.it)) {
      categories = categoryData.it;
    } else if (Array.isArray(categoryData.en)) {
      categories = categoryData.en;
    } else if (Array.isArray(categoryData)) {
      categories = categoryData;
    } else if (categoryData) {
      categories = [categoryData];
    }
    const piemonteItems: any[] = [];
    for (const cat of categories) {
      const mainCategory = cat?.['Main Category'] || '';
      const description = cat?.Description;
      if (!description) continue;
      const fd = new FormData();
      fd.append('query', description);
  const resp = await fetch(`'https://billquant-piemonte-production.up.railway.app'/search_piemonte`, {
        method: 'POST',
        body: fd,
      });
      const raw = await resp.json();
      const items = extractResults(raw);
      for (const item of items) {
        piemonteItems.push({
          type: 'main',
          activity,
          mainCategory,
          priceSource: 'piemonte',
          ...item,
        });
        if (Array.isArray(item.resources)) {
          for (const res of item.resources) {
            piemonteItems.push({
              type: 'resource',
              activity,
              mainCategory,
              priceSource: 'piemonte',
              ...res,
            });
          }
        }
      }
    }
    return { activity, category: categoryData, piemonteItems };
  }
);


interface BoqState {
  categories: Record<string, any>;
  categoryData: Record<string, any>;
  loading: boolean;
  error: string | null;
  modalCompare?: {
    activity: string;
    priceSource: string;
    original: any;
    newData: any;
    rowIndex?: number;
  } | null;
  modalLoading?: boolean;
}

const initialState: BoqState = {
  categories: {},
  categoryData: {},
  loading: false,
  error: null,
  modalCompare: null,
  modalLoading: false,
};

const boqSlice = createSlice({
  name: 'boq',
  initialState,
  reducers: {
  clearCategoryError: (state, action) => {
      const activity = action.payload;
      if (state.categories[activity]) {
        state.categories[activity].error = undefined;
      }
      if (state.categoryData[activity]) {
        state.categoryData[activity].error = undefined;
      }
    },
  resetBoqState: (state) => {
    state.categories = {};
    state.categoryData = {};
    state.loading = false;
    state.error = null;
    state.modalCompare = null;
    state.modalLoading = false;
  },
    closeModalCompare: (state) => {
      state.modalCompare = null;
      state.modalLoading = false;
    },
    // Replace the original activity with the new one in the correct row
    replaceActivityWithNew: (state) => {
      const { modalCompare } = state;
      if (!modalCompare || typeof modalCompare.rowIndex !== 'number') return;
      const { activity, priceSource, newData, rowIndex } = modalCompare;
      if (state.categories[activity]?.patItems && Array.isArray(state.categories[activity].patItems)) {
        let newMainItems: any[] = [];
        if (Array.isArray(newData?.results)) {
          newMainItems = newData.results.map((result: any) => ({
            ...result,
            type: 'main',
            priceSource,
            resources: Array.isArray(result.resources)
              ? result.resources.map((res: any) => ({ ...res, type: 'resource', priceSource }))
              : [],
          }));
        } else {
          newMainItems = [{
            ...newData,
            type: 'main',
            priceSource,
            resources: Array.isArray(newData.resources)
              ? newData.resources.map((res: any) => ({ ...res, type: 'resource', priceSource }))
              : [],
          }];
        }
        const updatedPatItems = state.categories[activity].patItems.map((item: any, idx: number) =>
          idx === rowIndex ? newMainItems[0] : item
        );
        // If there are more than one new main items, insert them after the replaced row
        if (newMainItems.length > 1) {
          updatedPatItems.splice(rowIndex + 1, 0, ...newMainItems.slice(1));
        }
        state.categories[activity] = {
          ...state.categories[activity],
          patItems: updatedPatItems,
        };
      }
      state.modalCompare = null;
      state.modalLoading = false;
    },
    // Keep the original activity (do nothing, just close the panel)
    keepCurrentActivity: (state) => {
      state.modalCompare = null;
      state.modalLoading = false;
    },
    // Insert the new activity as a new row (keep both)
    keepBothActivities: (state) => {
      const { modalCompare } = state;
      if (!modalCompare || typeof modalCompare.rowIndex !== 'number') return;
      const { activity, priceSource, newData, rowIndex } = modalCompare;
      if (state.categories[activity]?.patItems && Array.isArray(state.categories[activity].patItems)) {
        let newMainItems: any[] = [];
        if (Array.isArray(newData?.results)) {
          newMainItems = newData.results.map((result: any) => ({
            ...result,
            type: 'main',
            priceSource,
            resources: Array.isArray(result.resources)
              ? result.resources.map((res: any) => ({ ...res, type: 'resource', priceSource }))
              : [],
          }));
        } else {
          newMainItems = [{
            ...newData,
            type: 'main',
            priceSource,
            resources: Array.isArray(newData.resources)
              ? newData.resources.map((res: any) => ({ ...res, type: 'resource', priceSource }))
              : [],
          }];
        }
        const patItems = state.categories[activity].patItems;
        const updatedPatItems = [
          ...patItems.slice(0, rowIndex + 1),
          ...newMainItems,
          ...patItems.slice(rowIndex + 1)
        ];
        state.categories[activity] = {
          ...state.categories[activity],
          patItems: updatedPatItems,
        };
      }
      state.modalCompare = null;
      state.modalLoading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchActivityBySource.pending, (state) => {
        state.modalLoading = true;
      })
      .addCase(fetchActivityBySource.fulfilled, (state, action) => {
        state.modalLoading = false;
        // Save both original and new data for modal
        const { activity, priceSource, data, rowIndex } = action.payload;
        // Find the original main activity from categories
        let original = state.categories[activity]?.patItems;
        if (Array.isArray(original) && typeof rowIndex === 'number') {
          original = original[rowIndex];
        }
        state.modalCompare = {
          activity,
          priceSource,
          original,
          newData: data,
          rowIndex,
        };
      })
      .addCase(fetchActivityBySource.rejected, (state, action) => {
        state.modalLoading = false;
        state.error = action.error.message || 'Failed to fetch new activity data';
      });
    builder
      .addCase(fetchCategoryData.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(fetchCategoryData.fulfilled, (state, action) => {
        state.loading = false;
        const activity = action.meta.arg;
        state.categoryData[activity] = action.payload;
      })
      .addCase(fetchCategoryData.rejected, (state, action) => {
        state.loading = false;
        const activity = action.meta.arg;
        state.categoryData[activity] = { error: action.error.message || 'Failed to fetch activity categories' };
        state.error = action.error.message || 'Failed to fetch activity categories';
      })
      .addCase(fetchActivityCategoryDei.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivityCategoryPat.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivityCategoryPiemonte.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivityCategoryDei.fulfilled, (state, action) => {
        state.loading = false;
        const prev = state.categories[action.payload.activity] || {};
        state.categories[action.payload.activity] = {
          ...prev,
          category: action.payload.category,
          deiItems: action.payload.deiItems,
          error: action.payload.error,
          raw_answer: action.payload.raw_answer,
        };
      })
      .addCase(fetchActivityCategoryPat.fulfilled, (state, action) => {
        state.loading = false;
        const prev = state.categories[action.payload.activity] || {};
        state.categories[action.payload.activity] = {
          ...prev,
          category: action.payload.category,
          patItems: action.payload.patItems,
          error: action.payload.error,
          raw_answer: action.payload.raw_answer,
        };
      })
      .addCase(fetchActivityCategoryPiemonte.fulfilled, (state, action) => {
        state.loading = false;
        const prev = state.categories[action.payload.activity] || {};
        state.categories[action.payload.activity] = {
          ...prev,
          category: action.payload.category,
          piemonteItems: action.payload.piemonteItems,
          error: action.payload.error,
          raw_answer: action.payload.raw_answer,
        };
      })
      .addCase(fetchActivityCategoryDei.rejected, (state, action) => {
        state.loading = false;
        const activity = action.meta.arg;
        const prev = state.categories[activity] || {};
        state.categories[activity] = {
          ...prev,
          error: action.error.message || 'Failed to fetch DEI prices',
        };
        state.error = action.error.message || 'Failed to fetch DEI prices';
      })
      .addCase(fetchActivityCategoryPat.rejected, (state, action) => {
        state.loading = false;
        const activity = action.meta.arg;
        const prev = state.categories[activity] || {};
        state.categories[activity] = {
          ...prev,
          error: action.error.message || 'Failed to fetch PAT prices',
        };
        state.error = action.error.message || 'Failed to fetch PAT prices';
      })
      .addCase(fetchActivityCategoryPiemonte.rejected, (state, action) => {
        state.loading = false;
        const activity = action.meta.arg;
        const prev = state.categories[activity] || {};
        state.categories[activity] = {
          ...prev,
          error: action.error.message || 'Failed to fetch PIEMONTE prices',
        };
        state.error = action.error.message || 'Failed to fetch PIEMONTE prices';
      });
  },
});

export const { clearCategoryError, closeModalCompare, replaceActivityWithNew, keepCurrentActivity, keepBothActivities, resetBoqState } = boqSlice.actions;
export default boqSlice.reducer;
