/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER?: string;
  readonly VITE_OPENROUTER_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
