import type express from "express";
import Shopify from "@shopify/shopify-api";

export const processWebhooks: express.RequestHandler = async (req, res) => {
  try {
    await Shopify.Webhooks.Registry.process(req, res);
    console.log(`Webhook processed, returned status code 200`);
  } catch (e) {
    // res.send("ok")
    if (e instanceof Error) {
      console.log(`Failed to process webhook: ${e.message}`);
      if (!res.headersSent) {
        res.status(500).send(e.message);
      }
    } else {
      // console.log("Oops")
      throw e;
    }
  }
};
