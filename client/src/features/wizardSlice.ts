import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectWizardData } from '@/lib/types';
import { RootState } from '@/store';

interface WizardState {
  projectSetup: Partial<ProjectWizardData>;
  siteVisit: Partial<ProjectWizardData>;
}

const initialState: WizardState = {
  projectSetup: {},
  siteVisit: {},
};

const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    setProjectSetup(state, action: PayloadAction<Partial<ProjectWizardData>>) {
      state.projectSetup = { ...state.projectSetup, ...action.payload };
    },
    setSiteVisit(state, action: PayloadAction<Partial<ProjectWizardData>>) {
      state.siteVisit = { ...state.siteVisit, ...action.payload };
    },
    resetWizard(state) {
      state.projectSetup = {};
      state.siteVisit = {};
    },
  },
});

export const selectDigitalSignature = (state: RootState) =>
  state.wizard.projectSetup.digitalSignature;

// import { useSelector } from 'react-redux';
// import { selectDigitalSignature } from '@/features/wizardSlice';

// const signature = useSelector(selectDigitalSignature);

// return (
//   <div>
//     {signature && <img src={signature} alt="Signature" />}
//   </div>
// );

export const { setProjectSetup, setSiteVisit, resetWizard } = wizardSlice.actions;
export default wizardSlice.reducer;
