declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      PORT: string;
      WEB_URL: string;
      BETTER_AUTH_SECRET: string;
      TRUST_PROXY?: string;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      MAIL_FROM?: string;
    }
  }
}

export {};
