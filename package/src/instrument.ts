import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://e4a63c9808182cd9f2509079f7224507@o4508483919609856.ingest.us.sentry.io/4508787035013120",
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Tracing configuration
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  
  // Enable sourcemap support
  includeLocalVariables: true,
});

// Export Sentry instance for use in other files
export default Sentry;
