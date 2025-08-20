/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  // add more env vars here as needed
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
