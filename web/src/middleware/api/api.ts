import express from "express";
import { verifyRequest } from "./verify-request";
import { processWebhooks, registerWebHooks } from "./webhooks";
import { graphqlProxy } from "./graphql-proxy";
import { productsCount, productsCreate } from "./products";

interface Options {
  urlBase?: string;
  themeAppExtensionUuid?: string;
  isOnlineSession?: boolean;
  simulateCharges?: boolean;
  host?: string;
}
export const applyApiEndpoints = (app: express.Express, options?: Options) => {
  const {
    urlBase = "/api",
    isOnlineSession = false,
    simulateCharges = false,
    host = process.env.HOST || "set-host-in-env.example.com",
  } = options || {};
  const appSettings = {
    host,
    isOnlineSession,
  };
  const webhooksPath = `${urlBase}/webhooks`;
  // This cannot be changed and is automatically appended to the webhooks path.
  // a manual listener outside the normal webhooks system is needed for this path
  // https://shopify.dev/apps/fulfillment/fulfillment-service-apps/manage-fulfillments-as-a-service-app
  // const shopifyNeededUrl = "fulfillment_order_notification";
  // const fulfillmentNotificationsPath = `${webhooksPath}/${shopifyNeededUrl}`;

  registerWebHooks({ path: webhooksPath });

  app.post(webhooksPath, processWebhooks);

  // Needs access to raw body data so must be ran before json middleware
  // app.post(fulfillmentNotificationsPath, fulfillmentNotifications);

  /**
   * All endpoints after this point will have access to a request.body
   * attribute, as a result of the express.json() middleware. Needs to be after
   * process webhooks per Shopify docs
   */
  app.use(express.json());

  /**
   * Verify that all requests have valid sessions for auth.
   */
  app.use(`${urlBase}/*`, verifyRequest(appSettings));

  // Setup a proxy for quick request without the need of writing a REST endpoint
  // for everything
  app.use(`${urlBase}/graphql/`, graphqlProxy);

  app.use(`${urlBase}/products/count`, productsCount);

  app.use(`${urlBase}/products/create`, productsCreate);

  /**
   * Generate a json 404 response for remaining requests.
   */
  app.use(`${urlBase}/*`, (req, res) => {
    res.status(404);
    res.json({
      error: "Not found",
    });
  });
};
