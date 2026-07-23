
import * as Sentry from "@sentry/nextjs";
import { scrubSensitiveData } from "@/lib/sentry-scrub";

Sentry.init({
  dsn: "https://ec92d9e658376053df8deaabb1e3025a@o4511779935027200.ingest.de.sentry.io/4511779972841552",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  enableLogs: true,
  beforeSend: scrubSensitiveData,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
