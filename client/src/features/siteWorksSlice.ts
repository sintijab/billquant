import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';

export interface SiteWorkItem {
  Area: string;
  Subarea: string;
  Unit: string;
  Quantity: number;
  Work: string;
}

export interface MissingItem {
  Severity: string;
  Area: string;
  Subarea: string;
  Description: string;
}

export interface SiteWorksState {
  SiteWorks: SiteWorkItem[];
  Missing: MissingItem[];
}

const initialState: SiteWorksState = {
  SiteWorks: [],
  Missing: [],
};

const siteWorksSlice = createSlice({
  name: 'siteWorks',
  initialState,
  reducers: {
    setSiteWorks(state, action: PayloadAction<SiteWorksState>) {
      state.SiteWorks = action.payload.SiteWorks;
      state.Missing = action.payload.Missing;
    },
    resetSiteWorks(state) {
      state.SiteWorks = [];
      state.Missing = [];
    },
  },
});

export const { setSiteWorks, resetSiteWorks } = siteWorksSlice.actions;
export default siteWorksSlice.reducer;
