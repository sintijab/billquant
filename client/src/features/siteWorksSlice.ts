
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store';

export interface SiteWorkItem {
  Area: string;
  Subarea: string;
  Item: string;
  Unit: string;
  Quantity: number;
  Work: string;
  Timeline: string;
}

export interface MissingItem {
  Severity: string;
  Area: string;
  Subarea: string;
  Missing: string;
  Risks: string;
  Suggestions: string;
}


export interface GeneralTimelineActivity {
  Activity: string;
  Starting: number;
  Finishing: number;
}

export interface GeneralTimeline {
  Activities: GeneralTimelineActivity[];
}

export interface SiteWorksState {
  Works: SiteWorkItem[];
  Missing: MissingItem[];
  GeneralTimeline: GeneralTimeline | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SiteWorksState = {
  Works: [],
  Missing: [],
  GeneralTimeline: null,
  loading: 'idle',
  error: null,
};

// Async thunk for fetching site works from the backend
export const fetchSiteWorks = createAsyncThunk(
  'siteWorks/fetchSiteWorks',
  async (query: string, thunkAPI) => {
    const formData = new FormData();
    formData.append('query', query);
    const resp = await fetch('http://127.0.0.1:8000/mistral_activity_list', {
      method: 'POST',
      body: formData
    });
    const data = await resp.json();
    if (data && data.Works && data.Missing && data.GeneralTimeline && Array.isArray(data.GeneralTimeline.Activities)) {
      // Optionally, validate each activity structure here if needed
      return { Works: data.Works, Missing: data.Missing, GeneralTimeline: data.GeneralTimeline };
    } else {
      throw new Error('Invalid response format');
    }
  }
);


const siteWorksSlice = createSlice({
  name: 'siteWorks',
  initialState,
  reducers: {
    setSiteWorks(state, action: PayloadAction<{ SiteWorks: SiteWorkItem[]; Missing: MissingItem[]; GeneralTimeline: GeneralTimeline }>) {
      state.Works = action.payload.SiteWorks;
      state.Missing = action.payload.Missing;
      state.GeneralTimeline = action.payload.GeneralTimeline;
    },
    resetSiteWorks(state) {
      state.Works = [];
      state.Missing = [];
      state.GeneralTimeline = null;
      state.loading = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSiteWorks.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchSiteWorks.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.Works = action.payload.Works;
        state.Missing = action.payload.Missing;
        state.GeneralTimeline = action.payload.GeneralTimeline;
      })
      .addCase(fetchSiteWorks.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.error.message || 'Failed to fetch site works';
      });
  },
});

export const { setSiteWorks, resetSiteWorks } = siteWorksSlice.actions;
export default siteWorksSlice.reducer;
