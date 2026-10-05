/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" 면 광고를 숨겨요. 비워두면 광고를 보여줘요. */
  readonly VITE_ADS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
