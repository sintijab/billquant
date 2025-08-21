import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ProjectWizardData } from '@/lib/types';
import { RootState } from '@/store';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SiteVisitState {
  data: Partial<ProjectWizardData>;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SiteVisitState = {
  data: {},
  loading: 'idle',
  error: null,
};


export const analyzeImages = createAsyncThunk(
  'siteVisit/analyzeImages',
  async (formData: FormData, thunkAPI) => {
    const resp = await fetch(`${API_BASE_URL}/analyze_image_moondream`, {
      method: 'POST',
      body: formData
    });
    const data = await resp.json();
    // You may want to transform data here if needed
    return data;
  }
);

const siteVisitSlice = createSlice({
  name: 'siteVisit',
  initialState,
  reducers: {
    setSiteVisit(state, action: PayloadAction<Partial<ProjectWizardData>>) {
      state.data = { ...state.data, ...action.payload };
    },
    resetSiteVisit(state) {
      state.data = {};
      state.loading = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeImages.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(analyzeImages.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.data = { ...state.data, ...action.payload };
      })
      .addCase(analyzeImages.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.error.message || 'Failed to fetch site visit data';
      });
  },
});

export const { setSiteVisit, resetSiteVisit } = siteVisitSlice.actions;
export default siteVisitSlice.reducer;
