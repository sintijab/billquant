

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// AsyncThunk to fetch price quotation and internal costs from the backend
export const fetchMistralPriceQuotation = createAsyncThunk(
	'priceQuotation/fetchMistralPriceQuotation',
	async (priceQuotationPayload: string) => {
		const formData = new FormData();
		formData.append('query', priceQuotationPayload);
		const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/mistral_price_quotation`, {
			method: 'POST',
			body: formData,
		});
		return await resp.json(); 
	}
);

// State type
interface PriceQuotationState {
	data: any | null;
	loading: boolean;
	error: string | null;
}

const initialState: PriceQuotationState = {
	data: null,
	loading: false,
	error: null,
};

const priceQuotationSlice = createSlice({
	name: 'priceQuotation',
	initialState,
	reducers: {
		clearPriceQuotationError: (state) => {
			state.error = null;
		},
		clearPriceQuotationData: (state) => {
			state.data = null;
			state.loading = false;
		},
		resetPriceQuotation: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMistralPriceQuotation.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchMistralPriceQuotation.fulfilled, (state, action) => {
				state.loading = false;
				state.data = action.payload;
				state.error = null;
			})
			.addCase(fetchMistralPriceQuotation.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || 'Failed to fetch price quotation';
			});
	},
});

export const { clearPriceQuotationError, clearPriceQuotationData, resetPriceQuotation } = priceQuotationSlice.actions;
export default priceQuotationSlice.reducer;
