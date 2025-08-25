import { createAsyncThunk } from '@reduxjs/toolkit';

export const checkAllHealth = createAsyncThunk(
  'health/checkAll',
  async () => {
    const urls = [
      'https://billquant-rag-pat.onrender.com/health',
      'https://billquant-piemonte.onrender.com/health',
      'https://billquant-dei.onrender.com/health',
      'https://billquant-rag-general.onrender.com/health',
    ];
    try {
      await Promise.all(
        urls.map(url =>
          fetch(url).catch(() => null)
        )
      );
    } catch (e) {
      console.log(e);
    }
  }
);
