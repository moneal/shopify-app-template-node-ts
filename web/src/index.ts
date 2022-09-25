import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import express from "express";
import {
  displayServerWelcome,
  setupFirebase,
  setupShopifyContext,
} from "./helpers";
import {
  applyApiEndpoints,
  applyAuthMiddleware,
  frontendLoader,
  getLogger,
  setupLogging,
} from "./middleware";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "8080",
  10
);
const USE_ONLINE_TOKENS = false;
const TOP_LEVEL_OAUTH_COOKIE = "shopify_top_level_oauth";
const THEME_APP_EXTENSION_UUID = process.env.THEME_APP_EXTENSION_UUID;

export const createServer = async ({
  isProd = process.env.NODE_ENV === "production",
} = {}): Promise<{ app: express.Application }> => {
  /**
   * Initialize Firebase and setup local emulator if not in production mode
   */
  setupFirebase();

  /**
   * Initialize Shopify context, needs firebase for sessions
   */
  setupShopifyContext();

  /**
   * Display a welcome message to the console with the server environment
   */
  displayServerWelcome({ port: PORT, isProd });

  /**
   * Create the base express application
   */
  const app = express();

  // Some middleware has not been updated uet so using express variables
  app.set("top-level-oauth-cookie", TOP_LEVEL_OAUTH_COOKIE);
  app.set("use-online-tokens", USE_ONLINE_TOKENS);

  /**
   * Setup logging middleware
   */
  await setupLogging(app, {
    logName: "shopify_app",
    isProd,
  });

  /**
   * Load middleware for authentication and authorization
   */
  applyAuthMiddleware(app);

  /**
   * Add API endpoints
   */
  applyApiEndpoints(app, {
    themeAppExtensionUuid: THEME_APP_EXTENSION_UUID,
    isOnlineSession: USE_ONLINE_TOKENS,
    simulateCharges: !isProd,
  });

  /**
   * Load the frontend bundle and serve it for all remaining requests
   */
  await frontendLoader(app, { isProd });

  return { app };
};

createServer().then(({ app }) =>
  app.listen(PORT, () => {
    getLogger().info(`🔋 Server listening on port ${PORT}`);
  })
);

/**
 * Bunch of shutdown catches to see how various services send signals
 */

process.on("SIGTERM", function () {
  const uptime = process.uptime();
  getLogger().info(`🪫 Received SIGTERM, exiting gracefully. Uptime: ${uptime}`);
  process.exit(0);
});

process.on("SIGUSR2", () => {
  const uptime = process.uptime();
  getLogger().info(`⚡️ Received SIGUSR2, Hot Reload. Uptime: ${uptime}`);
  process.exit(0);
});
process.on("SIGINT", () => {
  const uptime = process.uptime();
  getLogger().info(`☠️  Received SIGINT, Killed. Uptime: ${uptime}`);
  process.exit(0);
});
