import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ClerkProvider } from '@clerk/clerk-react'
import { Provider } from 'react-redux';
import { store } from './store';
import process from 'process'

// Import your Publishable Key
// Add type for import.meta.env
interface ImportMeta {
  env: {
    VITE_CLERK_PUBLISHABLE_KEY: string;
    [key: string]: string;
  };
}
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Provider store={store}>
        <App />
      </Provider>
    </ClerkProvider>
  </StrictMode>
)