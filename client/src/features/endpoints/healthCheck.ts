import { createAsyncThunk } from '@reduxjs/toolkit';

export const checkAllHealth = createAsyncThunk(
  'health/checkAll',
  async () => {
    const urls = [
      'http://localhost:5173/pat/health',
      'http://localhost:5173/piemonte/health',
      'http://localhost:5173/dei/health',
      'http://localhost:5173/health',
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
