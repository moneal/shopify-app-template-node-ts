import Shopify from "@shopify/shopify-api";
export const registerWebHooks = ({ path = "/api/webhooks" }) => {
  //55600add96d2.ngrok.io?shop=igneous-clover.myshopify.com&host=aWduZW91cy1jbG92ZXIubXlzaG9waWZ5LmNvbS9hZG1pbgD

  // Shopify.Webhooks.Registry.addHandler("APP_SUBSCRIPTIONS_UPDATE", {
  //   path,
  //   webhookHandler: webhookAppSubscriptionUpdate,
  // });

  Shopify.Webhooks.Registry.addHandler("PRODUCTS_CREATE", {
    path,
    webhookHandler: mockHandleWebhookRequest,
  });

  // Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED", {
  //   path,
  //   webhookHandler: webhookAppUninstalled,
  // });

  Shopify.Webhooks.Registry.addHandler("APP_PURCHASES_ONE_TIME_UPDATE", {
    path,
    webhookHandler: mockHandleWebhookRequest,
  });

  Shopify.Webhooks.Registry.addHandler(
    "APP_SUBSCRIPTIONS_APPROACHING_CAPPED_AMOUNT",
    {
      path,
      webhookHandler: mockHandleWebhookRequest,
    }
  );

  Shopify.Webhooks.Registry.addHandler("FULFILLMENTS_CREATE", {
    path,
    webhookHandler: mockHandleWebhookRequest,
  });
};

const mockHandleWebhookRequest = async (
  topic: string,
  shop: string,
  webhookRequestBody: string
) => {
  // handler triggered when a webhook is sent by the Shopify platform to your application
  console.log(`Webhook received for topic ${topic}`, {
    shop,
    webhookRequestBody,
  });
};
