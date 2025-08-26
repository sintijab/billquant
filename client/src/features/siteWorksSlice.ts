import { resetBoqState } from './boqSlice';
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    const resp = await fetch(`${API_BASE_URL}/mistral_activity_list`, {
      method: 'POST',
      body: formData
    });
    const data = await resp.json();
    if (data && data.Works && data.Missing && data.GeneralTimeline && Array.isArray(data.GeneralTimeline.Activities)) {
      // Reset boq state when site works are fetched
      thunkAPI.dispatch(resetBoqState());
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
    resetSiteWorks(state, action) {
      const { area, subarea } = action.payload || {};
      if (area && subarea) {
        // Remove only works and missing for this subarea in this area
        const removedWorks = state.Works.filter(w => w.Area === area && w.Subarea === subarea).map(w => w.Work);
        if (state.GeneralTimeline && Array.isArray(state.GeneralTimeline.Activities)) {
          state.GeneralTimeline.Activities = state.GeneralTimeline.Activities.filter(a => !removedWorks.includes(a.Activity));
        }
        state.Works = state.Works.filter(w => !(w.Area === area && w.Subarea === subarea));
        state.Missing = state.Missing.filter(m => !(m.Area === area && m.Subarea === subarea));
      } else if (area) {
        // Remove all works and missing for this area, work name is sometimes Work or item
        const removedWorks = state.Works.filter(w => w.Area === area).map(w => w.Work);
        if (state.GeneralTimeline && Array.isArray(state.GeneralTimeline.Activities)) {
          state.GeneralTimeline.Activities = state.GeneralTimeline.Activities.filter(a => !removedWorks.includes(a.Activity));
        }
        state.Works = state.Works.filter(w => w.Area !== area);
        state.Missing = state.Missing.filter(m => m.Area !== area);
      } else {
        // Remove all (legacy behavior)
        state.Works = [];
        state.Missing = [];
        state.GeneralTimeline = null;
        state.loading = 'idle';
        state.error = null;
      }
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
        // Merge Works by Area/Subarea
        const newWorks = action.payload.Works;
        // Do not merge/replace if there are identical Work names for the same Area; keep all distinct (Area, Work, Subarea) entries
        const existingKeys = new Set(newWorks.map((w: SiteWorkItem) => `${w.Area}|||${w.Subarea}|||${w.Work}`));
        const mergedWorks = [
          ...state.Works.filter(w => !existingKeys.has(`${w.Area}|||${w.Subarea}|||${w.Work}`)),
          ...newWorks
        ];
        // Merge Missing by Area/Subarea: only add new area/subarea combos
        const existingAreaSubareas = new Set(state.Missing.map((m: MissingItem) => `${m.Area}|||${m.Subarea}`));
        const newMissing = action.payload.Missing
          .filter((m: MissingItem) => !existingAreaSubareas.has(`${m.Area}|||${m.Subarea}`))
          .filter((m: MissingItem) => typeof m.Missing !== 'undefined' && m.Missing !== null && m.Missing !== '');
        state.Missing = [...state.Missing, ...newMissing];
        const newTimeline = action.payload.GeneralTimeline;
        if (newTimeline && Array.isArray(newTimeline.Activities)) {
          // Ensure timeline has exactly one activity per work, matching by Work/Activity name
          const newActivityMap = new Map(newTimeline.Activities.map((a: GeneralTimelineActivity) => [a.Activity, a]));
          const oldActivityMap = state.GeneralTimeline && Array.isArray(state.GeneralTimeline.Activities)
            ? new Map(state.GeneralTimeline.Activities.map((a: GeneralTimelineActivity) => [a.Activity, a]))
            : new Map();
          const mergedActivities: GeneralTimelineActivity[] = mergedWorks.map(w => {
            if (newActivityMap.has(w.Work)) {
              return newActivityMap.get(w.Work)!;
            } else if (oldActivityMap.has(w.Work)) {
              return oldActivityMap.get(w.Work)!;
            } else {
              // Optionally, create a default activity if none exists
              return { Activity: w.Work, Starting: 0, Finishing: 0 };
            }
          });
          state.GeneralTimeline = {
            Activities: mergedActivities
          };
        } else if (newTimeline) {
          state.GeneralTimeline = newTimeline;
        }
        state.Works = mergedWorks;
      })
      .addCase(fetchSiteWorks.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.error.message || 'Failed to fetch site works';
      });
  },
});

export const { setSiteWorks, resetSiteWorks } = siteWorksSlice.actions;
// Export resetBoqState from boqSlice for use in thunks
export { resetBoqState } from './boqSlice';
export default siteWorksSlice.reducer;
