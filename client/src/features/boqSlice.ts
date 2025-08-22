import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Helper to fetch category data
async function fetchCategoryData(activity: string) {
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

// Helper to normalize price response to always be an array
function extractResults(source: any) {
  if (!source) return [];
  if (Array.isArray(source.results)) return source.results;
  if (source.results && Array.isArray(source.results.Results)) return source.results.Results;
  return [];
}

export const fetchActivityCategoryDei = createAsyncThunk(
  'boq/fetchActivityCategoryDei',
  async (activity: string) => {
    try {
      const categoryData = await fetchCategoryData(activity);
      if (categoryData && (categoryData.error || categoryData.raw_answer)) {
        return { activity, category: null, deiItems: [], error: categoryData.error, raw_answer: categoryData.raw_answer };
      }
      let categories: any[] = [];
      if (categoryData && Array.isArray(categoryData.it)) {
        categories = categoryData.it;
      } else if (categoryData && Array.isArray(categoryData.en)) {
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
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search_dei`, {
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
    } catch (e: any) {
      return { activity, category: null, deiItems: [], error: e?.message || 'Failed to fetch DEI prices' };
    }
  }
);

export const fetchActivityCategoryPat = createAsyncThunk(
  'boq/fetchActivityCategoryPat',
  async (activity: string) => {
    try {
      const categoryData = await fetchCategoryData(activity);
      if (categoryData && (categoryData.error || categoryData.raw_answer)) {
        return { activity, category: null, patItems: [], error: categoryData.error, raw_answer: categoryData.raw_answer };
      }
      let categories: any[] = [];
      if (categoryData && Array.isArray(categoryData.it)) {
        categories = categoryData.it;
      } else if (categoryData && Array.isArray(categoryData.en)) {
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
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search_pat`, {
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
    } catch (e: any) {
      return { activity, category: null, patItems: [], error: e?.message || 'Failed to fetch PAT prices' };
    }
  }
);

export const fetchActivityCategoryPiemonte = createAsyncThunk(
  'boq/fetchActivityCategoryPiemonte',
  async (activity: string) => {
    try {
      const categoryData = await fetchCategoryData(activity);
      if (categoryData && (categoryData.error || categoryData.raw_answer)) {
        return { activity, category: null, piemonteItems: [], error: categoryData.error, raw_answer: categoryData.raw_answer };
      }
      let categories: any[] = [];
      if (categoryData && Array.isArray(categoryData.it)) {
        categories = categoryData.it;
      } else if (categoryData && Array.isArray(categoryData.en)) {
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
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search_piemonte`, {
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
    } catch (e: any) {
      return { activity, category: null, piemonteItems: [], error: e?.message || 'Failed to fetch PIEMONTE prices' };
    }
  }
);


interface BoqState {
  categories: Record<string, any>;
  loading: boolean;
  error: string | null;
}

const initialState: BoqState = {
  categories: {},
  loading: false,
  error: null,
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
    },
  },
  extraReducers: builder => {
    builder
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

export const { clearCategoryError } = boqSlice.actions;
export default boqSlice.reducer;
