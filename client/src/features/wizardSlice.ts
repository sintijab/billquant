import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectWizardData } from '@/lib/types';
import { RootState } from '@/store';

interface WizardState {
  projectSetup: Partial<ProjectWizardData>;
}

const initialState: WizardState = {
  projectSetup: {},
};

const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    setProjectSetup(state, action: PayloadAction<Partial<ProjectWizardData>>) {
      state.projectSetup = { ...state.projectSetup, ...action.payload };
    },
    resetWizard(state) {
      state.projectSetup = {};
    },
  },
});

export const selectDigitalSignature = (state: RootState) =>
  state.wizard.projectSetup.digitalSignature;

export const selectProjectSetup = (state: RootState) => state.wizard.projectSetup;

// import { useSelector } from 'react-redux';
// import { selectDigitalSignature } from '@/features/wizardSlice';

// const signature = useSelector(selectDigitalSignature);

// return (
//   <div>
//     {signature && <img src={signature} alt="Signature" />}
//   </div>
// );

export const { setProjectSetup, resetWizard } = wizardSlice.actions;
export default wizardSlice.reducer;
