/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declare .xlsx files as importable assets
declare module '*.xlsx' {
  const src: string;
  export default src;
}

declare module '*.xlsx?url' {
  const src: string;
  export default src;
}
