import { createAsyncThunk } from '@reduxjs/toolkit';

export const checkAllHealth = createAsyncThunk(
  'health/checkAll',
  async () => {
    const urls = [
      'billquant-pat-production.up.railway.app/health',
      'billquant-piemonte-production.up.railway.app/health',
      'billquant-dei-production.up.railway.app/health',
      'billquant-production.up.railway.app/health',
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
