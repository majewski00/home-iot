interface ImportMetaEnv {
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_DOMAIN: string;
  readonly VITE_COGNITO_USER_POOL_CLIENT_ID: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_HTTP_API_URL: string;
  readonly VITE_IS_OFFLINE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
