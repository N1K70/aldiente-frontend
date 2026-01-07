/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_FILES_URL?: string;
  readonly VITE_CHAT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
